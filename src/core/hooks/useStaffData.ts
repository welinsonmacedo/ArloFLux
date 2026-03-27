// src/core/hooks/useStaffData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabaseClient';
import { captureException } from '../monitoring/sentry';

interface UseStaffDataProps {
  userId?: string;
  tenantId?: string;
}

export const useStaffData = ({ userId, tenantId }: UseStaffDataProps) => {
  return useQuery({
    queryKey: ['staff', userId, tenantId],
    queryFn: async () => {
      if (!userId && !tenantId) return null;
      
      let query = supabase.from('staff').select(`
        *,
        tenants(id, slug, name),
        custom_roles(permissions)
      `);
      
      if (userId) {
        query = query.eq('auth_user_id', userId);
      } else if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!(userId || tenantId),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['staff', data.id] });
      queryClient.invalidateQueries({ queryKey: ['staff', data.auth_user_id] });
    },
    onError: (error) => {
      captureException(error as Error, { source: 'useUpdateStaff' });
    },
  });
};

export const useTenantData = (slug?: string) => {
  return useQuery({
    queryKey: ['tenant', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};