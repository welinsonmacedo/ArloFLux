// core/hooks/useAuthActions.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useRestaurant } from '../context/RestaurantContext';
import { AuthService } from '../services/auth.service';
import { getTenantSlug } from '../tenant/tenantResolver';
import { AppError } from '../errors/AppError';
import { LoginFormData, RegisterFormData } from '../validation/auth.schema';

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { login } = useAuth();
  const { refresh: refreshRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentSlug = getTenantSlug();
      const result = await AuthService.login(data, currentSlug);
      
      if (!result.staff) {
        // É owner, redirecionar para seleção de restaurante
        window.location.href = `/?restaurant=${currentSlug || ''}`;
        return;
      }
      
      // Salvar slug no sessionStorage
      const tenantSlug = Array.isArray(result.staff.tenants) 
        ? result.staff.tenants[0]?.slug 
        : result.staff.tenants?.slug;
      
      if (tenantSlug) {
        sessionStorage.setItem('fluxeat_tenant_slug', tenantSlug);
      }
      
      // Fazer login no contexto
      login({
        id: result.staff.id,
        name: result.staff.name,
        role: result.staff.role,
        tenant_id: result.staff.tenant_id,
        email: result.staff.email,
        auth_user_id: result.staff.auth_user_id,
        customRoleId: result.staff.custom_role_id,
        allowedRoutes: result.staff.allowed_routes,
        allowedFeatures: result.staff.allowed_features,
      });
      
      // Atualizar contexto do restaurante
      if (refreshRestaurant) {
        await refreshRestaurant();
      }
      
      // Redirecionar baseado no role
      this.redirectBasedOnRole(result.staff.role);
      
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR', 'Erro desconhecido');
      setError(appError.userMessage);
      console.error('Login error:', appError.toJSON());
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
      const appError = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR', 'Erro desconhecido');
      setError(appError.userMessage);
      console.error('Register error:', appError.toJSON());
    } finally {
      setLoading(false);
    }
  };
  
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