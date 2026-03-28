import { createClient } from '@supabase/supabase-js';
import { environment } from '@/core/config/environment';

// ✨ Diagnóstico: Lê diretamente do Vite ou usa a sua URL fixa como último recurso
const url = import.meta.env.VITE_SUPABASE_URL || environment.supabaseUrl ;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || environment.supabaseAnonKey;

console.log("=== DIAGNÓSTICO DE REDE SUPABASE ===");
console.log("Tentando conectar na URL:", url);
console.log("Chave de API presente?", !!key);
console.log("====================================");

if (!url || !url.startsWith('http')) {
    console.error("ERRO CRÍTICO: A URL do Supabase é inválida!", url);
}

export const isSupabaseConfigured = () => Boolean(url && key && !url.includes('Sua_Url'));

export const supabase: any = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key'
);

export const logAudit = async (tenantId: any, userId: any, userName: any, module: string, action: string, details: any = {}) => {
  try {
    const safeTenantId = tenantId && tenantId.trim() !== '' ? tenantId : null;
    let safeUserId = userId && typeof userId === 'string' && userId.trim() !== '' ? userId : null;
    if (Array.isArray(userId)) safeUserId = userId[0] || null;

    const { error } = await supabase.from('audit_logs').insert({
      tenant_id: safeTenantId,
      user_id: safeUserId,
      user_name: userName || 'Sistema',
      module,
      action,
      details: { timestamp: new Date().toISOString(), environment: 'development', data: details }
    });

    if (error) console.error("[AUDIT ERROR]", error); 
  } catch (error) {
    console.error("Erro interno ao tentar registrar log:", error);
  }
};