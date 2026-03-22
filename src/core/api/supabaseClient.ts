import { createClient } from '@supabase/supabase-js';
import { environment, isSupabaseConfigured } from '@/core/config/environment';
import { logger } from '@/core/logger/logger';

export { isSupabaseConfigured };

if (!isSupabaseConfigured()) {
  logger.error('⚠️ SUPABASE NÃO CONFIGURADO CORRETAMENTE!');
  logger.info('Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas.');
} else {
  logger.info('✅ Supabase: Chaves detectadas. Iniciando cliente...');
}

export const supabase: any = createClient(
  environment.supabaseUrl || 'https://placeholder.supabase.co',
  environment.supabaseAnonKey || 'placeholder-key'
);

export const logAudit = async (
  tenantId: string, 
  userId: string, 
  userName: string, 
  module: string, 
  action: string, 
  details: any = {}
) => {
  try {
    const structuredDetails = {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'development',
      data: details,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      user_name: userName,
      module,
      action,
      details: structuredDetails
    });
  } catch (error) {
    logger.error("Erro ao registrar log de auditoria:", error);
  }
};
