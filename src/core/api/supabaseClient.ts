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

// ✨ PROTEÇÃO EXTRA: Forçamos o placeholder se a URL vier do .env sem 'http'
let finalUrl = environment.supabaseUrl;
if (!finalUrl || !finalUrl.startsWith('http')) {
    finalUrl = 'https://placeholder.supabase.co';
}

let finalKey = environment.supabaseAnonKey;
if (!finalKey) {
    finalKey = 'placeholder-key';
}

export const supabase: any = createClient(finalUrl, finalKey);

export const logAudit = async (
  tenantId: string | null | undefined, 
  userId: string | null | undefined, 
  userName: string | null | undefined, 
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

    // Garantir que UUIDs vazios sejam passados como nulos
    const safeTenantId = tenantId && tenantId.trim() !== '' ? tenantId : null;
    let safeUserId = userId && typeof userId === 'string' && userId.trim() !== '' ? userId : null;
    
    // Tratativa caso o userId venha como Array
    if (Array.isArray(userId)) {
        safeUserId = userId[0] || null;
    }

    const { error } = await supabase.from('audit_logs').insert({
      tenant_id: safeTenantId,
      user_id: safeUserId,
      user_name: userName || 'Sistema',
      module,
      action,
      details: structuredDetails
    });

    if (error) {
      logger.error("Falha do Supabase ao gravar log de auditoria:", error);
      console.error("[AUDIT ERROR]", error); 
    }

  } catch (error) {
    logger.error("Erro interno ao tentar registrar log de auditoria:", error);
  }
};