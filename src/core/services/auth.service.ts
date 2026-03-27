// core/services/auth.service.ts
import { supabase } from '../api/supabaseClient';
import { AppError } from '../errors/AppError';
import { ErrorHandler } from '../errors/errorHandler';
import { rateLimitService } from './rateLimit.service';
import { LoginFormData, RegisterFormData } from '../validation/auth.schema';
import { queryClient } from '../lib/queryClient';

export interface StaffData {
  id: string;
  name: string;
  role: string;
  email: string;
  tenant_id: string;
  auth_user_id?: string;
  custom_role_id?: string;
  allowed_routes: string[];
  allowed_features: string[];
  tenants?: {
    id: string;
    slug: string;
    name: string;
  };
}

export class AuthService {
  static async login(credentials: LoginFormData, tenantSlug?: string) {
    const identifier = `${credentials.email}:${tenantSlug || 'no-tenant'}`;
    
    await rateLimitService.checkLimit(identifier);
    
    try {
      const authResult = await ErrorHandler.withRetry(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        
        if (error) throw error;
        return data;
      });
      
      if (!authResult.user) {
        throw new AppError('AUTH_USER_NOT_FOUND', 'Usuário não encontrado');
      }
      
      const staff = await this.getStaffData(authResult.user.id, credentials.email, tenantSlug);
      
      // Cache dos dados do staff
      if (staff) {
        queryClient.setQueryData(['staff', staff.id], staff);
        queryClient.setQueryData(['staff', authResult.user.id], staff);
      }
      
      await rateLimitService.recordAttempt(identifier, true);
      
      return {
        user: authResult.user,
        staff,
      };
    } catch (error) {
      await rateLimitService.recordAttempt(identifier, false);
      throw ErrorHandler.handle(error);
    }
  }
  static async logout() {
    // Limpar cache do usuário
    queryClient.clear();
    
    const { error } = await supabase.auth.signOut();
    if (error) throw ErrorHandler.handle(error);
  }
  static async register(data: RegisterFormData) {
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
        },
      });
      
      if (error) throw error;
      
      return {
        user: signUpData.user,
        requiresEmailConfirmation: !signUpData.session,
      };
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  }
  
  private static async getStaffData(
    authUserId: string,
    email: string,
    tenantSlug?: string
  ): Promise<StaffData | null> {
    let tenantId = '';
    
    // Buscar tenant pelo slug
    if (tenantSlug) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .single();
      
      if (tenant) tenantId = tenant.id;
    }
    
    // Buscar staff pelo auth_user_id
    let { data: staff } = await supabase
      .from('staff')
      .select(`
        *,
        tenants(id, slug, name),
        custom_roles(permissions)
      `)
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    
    // Se não encontrado, tentar vincular por email
    if (!staff && tenantId) {
      const { data: staffByEmail } = await supabase
        .from('staff')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('email', email)
        .is('auth_user_id', null)
        .maybeSingle();
      
      if (staffByEmail) {
        const { data: updatedStaff } = await supabase
          .from('staff')
          .update({ auth_user_id: authUserId })
          .eq('id', staffByEmail.id)
          .select(`
            *,
            tenants(id, slug, name),
            custom_roles(permissions)
          `)
          .single();
        
        staff = updatedStaff;
      }
    }
    
    // Se ainda não encontrou, verificar se é owner
    if (!staff && tenantId) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, slug, name')
        .eq('owner_auth_id', authUserId)
        .single();
      
      if (tenant) {
        // Owner não tem registro em staff, redirecionar
        return null;
      }
    }
    
    if (!staff) {
      throw new AppError('AUTH_STAFF_NOT_FOUND', 'Staff não encontrado');
    }
    
    // Validar tenant
    const staffTenant = staff.tenants;
    const actualSlug = Array.isArray(staffTenant) ? staffTenant[0]?.slug : staffTenant?.slug;
    
    if (tenantSlug && actualSlug && tenantSlug !== actualSlug) {
      throw new AppError('AUTH_TENANT_MISMATCH', 'Tenant mismatch');
    }
    
    // Calcular permissões
    const allowedRoutes = this.calculateAllowedRoutes(staff);
    const allowedFeatures = staff.custom_roles?.permissions?.allowed_features || [];
    
    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      email: staff.email,
      tenant_id: staff.tenant_id,
      auth_user_id: staff.auth_user_id,
      custom_role_id: staff.custom_role_id,
      allowed_routes: allowedRoutes,
      allowed_features: allowedFeatures,
      tenants: staff.tenants,
    };
  }
  
  private static calculateAllowedRoutes(staff: any): string[] {
    if (staff.custom_roles?.permissions?.allowed_modules) {
      return staff.custom_roles.permissions.allowed_modules;
    }
    
    if (staff.role === 'ADMIN') {
      return [
        'RESTAURANT', 'SNACKBAR', 'DISTRIBUTOR', 'COMMERCE',
        'MANAGER', 'CONFIG', 'FINANCE', 'INVENTORY', 'HR',
        'AUDIT', 'TIMECLOCK', 'SUPPORT'
      ];
    }
    
    if (staff.allowed_routes?.length) {
      return staff.allowed_routes;
    }
    
    if (['WAITER', 'KITCHEN', 'CASHIER'].includes(staff.role)) {
      const routes = ['RESTAURANT'];
      if (staff.role === 'CASHIER') routes.push('COMMERCE');
      return routes;
    }
    
    return [];
  }
}