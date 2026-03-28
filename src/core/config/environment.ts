// Função segura para ler variáveis do Node (process) sem quebrar o navegador
const getProcessEnv = (key: string) => {
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    return undefined;
};

export const environment = {
  supabaseUrl: 
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined) || 
    getProcessEnv('VITE_SUPABASE_URL') || 
    getProcessEnv('SUPABASE_URL') || 
    '',

  supabaseAnonKey: 
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) || 
    getProcessEnv('VITE_SUPABASE_ANON_KEY') || 
    getProcessEnv('SUPABASE_ANON_KEY') || 
    '',

  isProduction: 
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.PROD : undefined) || 
    (getProcessEnv('NODE_ENV') === 'production') || 
    false,

  appUrl: 
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_APP_URL : undefined) || 
    getProcessEnv('VITE_APP_URL') || 
    (typeof window !== 'undefined' ? window.location.origin : ''),

  geminiApiKey: 
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_KEY : undefined) || 
    getProcessEnv('VITE_API_KEY') || 
    getProcessEnv('API_KEY') || 
    '',
};

export const isSupabaseConfigured = () => {
  return Boolean(
    environment.supabaseUrl && 
    environment.supabaseAnonKey && 
    !environment.supabaseUrl.includes('Sua_Url')
  );
};