import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { 
    LogOut, Grid, ChefHat, AlertCircle, X, Settings, RefreshCcw
} from 'lucide-react';

// Importando Sub-páginas
import { AdminSettings } from '@/modules/admin/pages/admin/AdminSettings';
import { AdminStaff } from '@/modules/staff/pages/admin/AdminStaff';

export const SettingsDashboard: React.FC = () => {
  const { state: restState, refresh } = useRestaurant();
  const { state: authState, logout } = useAuth();
  const navigate = useNavigate();

  // --- Sistema de Gestão de Erros Retrátil ---
  const [showErrors, setShowErrors] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Captura a mensagem de erro e evita duplicatas seguidas
      setErrorLog(prev => {
        const newMsg = event.message || "Erro desconhecido no sistema";
        if (prev[prev.length - 1] === newMsg) return prev;
        return [...prev.slice(-3), newMsg];
      });
      setShowErrors(true);
      
      // Timer para ocultar automaticamente após 8 segundos
      const timer = setTimeout(() => setShowErrors(false), 8000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleExitToModules = () => navigate('/modules');

  // Proteção contra estado nulo durante o carregamento
  if (restState.isLoading) {
    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-4">
            <RefreshCcw className="text-emerald-500 animate-spin" size={40} />
            <p className="text-white font-black text-xs uppercase tracking-widest">Sincronizando Configurações...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
        
        {/* HEADER UNIFICADO */}
        <header className="bg-slate-900 text-white shadow-xl shrink-0 z-30">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
                        {restState.theme?.logoUrl ? (
                            <img src={restState.theme.logoUrl} className="h-8 w-8 object-contain" alt="Logo" />
                        ) : (
                            <ChefHat size={24} />
                        )}
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none tracking-tight">
                            {restState.theme?.restaurantName || 'ArloFlux'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Settings size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-black bg-gray-800 px-2 py-0.5 rounded text-slate-400 uppercase tracking-widest">
                                Painel de Configurações
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExitToModules}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
                    >
                        <Grid size={16} /> Módulos
                    </button>
                    <button 
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    >
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </div>
        </header>

        {/* CONSOLE DE ERROS DINÂMICO (Canto inferior direito) */}
        {errorLog.length > 0 && (
            <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${showErrors ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-90 pointer-events-none'}`}>
                <div className="bg-red-600 text-white p-5 rounded-2xl shadow-2xl max-w-sm border-2 border-red-400 ring-4 ring-red-600/20">
                    <div className="flex justify-between items-center mb-3 border-b border-red-400/50 pb-2">
                        <span className="text-[10px] font-black uppercase flex items-center gap-2 tracking-tighter">
                            <AlertCircle size={14}/> Sistema detectou falhas
                        </span>
                        <X size={16} className="cursor-pointer hover:scale-125 transition-transform" onClick={() => setShowErrors(false)} />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {errorLog.map((err, i) => (
                            <p key={i} className="text-[9px] font-bold leading-tight bg-black/20 p-2 rounded-lg border border-white/10 italic">
                                [LOG]: {err}
                            </p>
                        ))}
                    </div>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full mt-4 bg-white text-red-600 text-[10px] font-black py-2 rounded-lg hover:bg-gray-100 transition-colors uppercase"
                    >
                        Recarregar Aplicação
                    </button>
                </div>
            </div>
        )}

        {/* ÍCONE FLUTUANTE PARA ERROS OCULTOS */}
        {errorLog.length > 0 && !showErrors && (
            <button 
                onClick={() => setShowErrors(true)}
                className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40 animate-pulse border-4 border-white"
            >
                <AlertCircle size={24} />
            </button>
        )}

        {/* ÁREA DE CONTEÚDO */}
        <main className="flex-1 overflow-y-auto bg-gray-50 relative p-4 md:p-8">
            <div className="max-w-[1920px] mx-auto h-full">
                <Routes>
                    {/* O AdminSettings gerencia suas próprias abas (Empresa, Regras, Delivery, etc) */}
                    <Route path="/" element={<AdminSettings />} />
                    
                    {/* Aba de Equipe separada */}
                    <Route path="staff" element={<AdminStaff />} />

                    {/* Redirecionamentos de segurança para rotas órfãs */}
                    <Route path="operations" element={<Navigate to="/settings" replace />} />
                    <Route path="delivery" element={<Navigate to="/settings" replace />} />
                    <Route path="finance-config" element={<Navigate to="/settings" replace />} />
                    <Route path="security" element={<Navigate to="/settings" replace />} />
                    <Route path="appearance" element={<Navigate to="/settings" replace />} />

                    <Route path="*" element={<Navigate to="" replace />} />
                </Routes>
            </div>
        </main>
    </div>
  );
};