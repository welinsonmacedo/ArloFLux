// core/hooks/useAuthActions.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useRestaurant } from '../context/RestaurantContext';
import { AuthService } from '../services/auth.service';
import { getTenantSlug } from '../tenant/tenantResolver';
import { AppError } from '../errors/AppError';
import { LoginFormData, RegisterFormData } from '../validation/auth.schema';
import { supabase } from '../api/supabaseClient'; // ✨ Importação do supabase adicionada

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { login } = useAuth();
  const { refresh: refreshRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'CLIENT':
        navigate('/client/home', { replace: true });
        break;
      case 'SUPER_ADMIN':
        navigate('/dashboard', { replace: true });
        break;
      default:
        navigate('/modules', { replace: true });
    }
  };

  // ✨ A função handleLogin recriada com a blindagem robusta
  const handleLogin = async (data: LoginFormData) => {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const emailTrimmed = data.email.trim();

      try {
          const currentSlug = getTenantSlug();

          // 1. FAZ O LOGIN NO SUPABASE
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ 
              email: emailTrimmed, 
              password: data.password 
          });
          
          if (signInError) throw signInError;
          if (!authData.user) throw new Error("Erro desconhecido no retorno do usuário.");

          const userId = authData.user.id;
          const userEmail = authData.user.email;

          let tenantId = '';

          // 2. DESCOBRE O RESTAURANTE DA URL (Se houver)
          if (currentSlug) {
              const { data: tenantRef } = await supabase.from('tenants').select('id').eq('slug', currentSlug).single();
              if (tenantRef) tenantId = tenantRef.id;
          }

          // 3. BUSCA O UTILIZADOR NA TABELA DE EQUIPE
          let { data: staffData } = await supabase
            .from('staff')
            .select('*, tenants(id, slug, name), custom_roles(permissions)')
            .eq('auth_user_id', userId)
            .maybeSingle();
          
          // 4. SE NÃO ACHAR PELO ID, TENTA ACHAR PELO EMAIL E VINCULAR
          if (!staffData && userEmail && tenantId) {
               const { data: staffByEmail } = await supabase
                .from('staff')
                .select('*, tenants(id, slug, name), custom_roles(permissions)')
                .eq('tenant_id', tenantId)
                .eq('email', userEmail)
                .is('auth_user_id', null)
                .maybeSingle();

               if (staffByEmail) {
                   const { data: updatedStaff } = await supabase
                    .from('staff')
                    .update({ auth_user_id: userId })
                    .eq('id', staffByEmail.id)
                    .select('*, tenants(id, slug, name), custom_roles(permissions)')
                    .single();
                   if (updatedStaff) staffData = updatedStaff;
               }
          }

          // 5. MODO CEO / DONO (Se ele não for Staff, vê se ele é Dono de algum restaurante)
          if (!staffData) {
              const { data: tenantData } = await supabase
                  .from('tenants')
                  .select('id, slug, name')
                  .eq('owner_auth_id', userId)
                  .limit(1)
                  .maybeSingle();
              
              if (tenantData) {
                  window.location.href = `/?restaurant=${tenantData.slug}`;
                  return;
              }
          }

          // 6. FINALMENTE CONSTRÓI A SESSÃO
          if (staffData) {
              const t = staffData.tenants;
              const actualSlug = Array.isArray(t) ? t[0]?.slug : (t?.slug || '');
              const actualTenantId = Array.isArray(t) ? t[0]?.id : (t?.id || '');

              if (currentSlug && actualSlug && currentSlug !== actualSlug) {
                  throw new Error("Você não tem permissão para acessar este restaurante.");
              }

              if (actualSlug) {
                  sessionStorage.setItem('fluxeat_tenant_slug', actualSlug);
              }

              let allowedRoutes = staffData.allowed_routes || [];
              
              if (staffData.custom_roles?.permissions) {
                  if (staffData.custom_roles.permissions.allowed_modules) {
                      allowedRoutes = staffData.custom_roles.permissions.allowed_modules;
                  }
              } else if (staffData.role === 'ADMIN') {
                  allowedRoutes = ['RESTAURANT', 'SNACKBAR', 'DISTRIBUTOR', 'COMMERCE', 'MANAGER', 'CONFIG', 'FINANCE', 'INVENTORY', 'HR', 'AUDIT', 'TIMECLOCK', 'SUPPORT'];
              } else if (!staffData.custom_role_id && allowedRoutes.length === 0) {
                  if (['WAITER', 'KITCHEN', 'CASHIER'].includes(staffData.role)) {
                      allowedRoutes = ['RESTAURANT'];
                      if (staffData.role === 'CASHIER') allowedRoutes.push('COMMERCE');
                  }
              }

              login({
                  id: staffData.id, 
                  name: staffData.name, 
                  role: staffData.role,
                  tenant_id: actualTenantId,
                  email: staffData.email, 
                  auth_user_id: staffData.auth_user_id, 
                  customRoleId: staffData.custom_role_id,
                  allowedRoutes: allowedRoutes,
                  allowedFeatures: staffData.custom_roles?.permissions?.allowed_features || []
              });

              if (refreshRestaurant) {
                  refreshRestaurant();
              }
              
              // Redireciona com base no cargo
              redirectBasedOnRole(staffData.role);
              return;
          }

          throw new Error("Usuário não encontrado ou sem restaurante vinculado.");

      } catch (err: any) {
          // ✨ AGORA MOSTRA O ERRO REAL NO CONSOLE E NA TELA!
          console.error("ERRO COMPLETO NO LOGIN:", err);
          setError(err.message || "Credenciais inválidas ou erro de autenticação.");
          await supabase.auth.signOut();
      } finally {
          setLoading(false);
      }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await AuthService.register(data);
      
      if (result.requiresEmailConfirmation) {
        setSuccessMessage(
          'Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar o cadastro antes de fazer login.'
        );
        return;
      }
      
      // Se não precisa confirmar email, fazer login automático
      await handleLogin({
        email: data.email,
        password: data.password,
      });
      
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR', 'Erro ao registrar usuário');
      setError(appError.userMessage);
      console.error('Register error:', appError.toJSON());
    } finally {
      setLoading(false);
    }
  };
  
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };
  
  return {
    loading,
    error,
    successMessage,
    handleLogin,
    handleRegister,
    clearMessages,
  };
};