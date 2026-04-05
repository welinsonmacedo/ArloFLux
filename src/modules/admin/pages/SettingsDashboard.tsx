import React, { useEffect, useState, useCallback } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { 
    LogOut, Grid, ChefHat, AlertCircle, X, Settings, RefreshCcw,
    Menu, ChevronRight, UserCircle, Building2, Users, Truck, Shield, Palette
} from 'lucide-react';
import { Role } from '@/types';

// Importando Sub-páginas
import { AdminSettings } from '@/modules/admin/pages/admin/AdminSettings';
import { AdminStaff } from '@/modules/staff/pages/admin/AdminStaff';

// Estilos CSS injetados dinamicamente
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('settings-menu-styles')) {
    const style = document.createElement('style');
    style.id = 'settings-menu-styles';
    style.textContent = `
      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      .animate-slide-in-left {
        animation: slideInLeft 0.3s ease-out forwards;
      }
      
      .animate-fade-in {
        animation: fadeIn 0.2s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
};

export const SettingsDashboard: React.FC = () => {
  const { state: restState, refresh } = useRestaurant();
  const { state: authState, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- Sistema de Gestão de Erros Retrátil ---
  const [showErrors, setShowErrors] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  // Injetar estilos ao montar componente
  useEffect(() => {
    injectStyles();
  }, []);

  // Definição dos itens do menu
  const menuItems = [
    { 
      path: '/settings', 
      label: 'CONFIGURAÇÕES', 
      icon: Settings, 
      exact: true,
      featureKeys: ['admin_settings'],
      description: 'Configurações da empresa'
    },
    { 
      path: '/settings/staff', 
      label: 'EQUIPE', 
      icon: Users, 
      featureKeys: ['admin_staff'],
      description: 'Gestão de usuários e cargos'
    },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    // Permissões do Usuário
    if (authState.currentUser?.role !== Role.ADMIN && authState.currentUser?.customRoleId) {
      const userFeatures = authState.currentUser.allowedFeatures || [];
      const hasUserFeature = item.featureKeys.some(key => userFeatures.includes(key));
      if (!hasUserFeature) return false;
    }

    return true;
  });

  // Captura de erros
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrorLog(prev => {
        const newMsg = event.message || "Erro desconhecido no sistema";
        if (prev[prev.length - 1] === newMsg) return prev;
        return [...prev.slice(-3), newMsg];
      });
      setShowErrors(true);
      
      const timer = setTimeout(() => setShowErrors(false), 8000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleExitToModules = () => navigate('/modules');

  // Função para fechar o menu
  const closeMenu = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setMenuOpen(false);
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  // Função para abrir o menu
  const openMenu = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setMenuOpen(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  // Função para alternar o menu
  const toggleMenu = useCallback(() => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [menuOpen, closeMenu, openMenu]);

  // Fecha menu ao trocar de rota
  useEffect(() => {
    if (menuOpen) {
      closeMenu();
    }
  }, [location.pathname]);

  // Handler para o botão de voltar do navegador/Android
  useEffect(() => {
    if (menuOpen) {
      window.history.pushState({ menuOpen: true }, '', window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (menuOpen) {
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [menuOpen, closeMenu]);

  // Handler para tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        closeMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, closeMenu]);

  // Prevenir scroll do body quando menu estiver aberto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Proteção contra estado nulo durante o carregamento
  if (restState.isLoading) {
    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-4">
            <RefreshCcw className="text-emerald-500 animate-spin" size={40} />
            <p className="text-white font-black text-xs uppercase tracking-widest">Sincronizando Configurações...</p>
        </div>
    );
  }

  // Encontrar o item ativo para o indicador mobile
  const activeItem = visibleMenuItems.find(item => 
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        
        {/* Overlay para fechar menu */}
        {menuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            style={{
              animation: 'fadeIn 0.2s ease-out forwards',
              cursor: 'pointer'
            }}
            onClick={closeMenu}
          />
        )}
        
        {/* HEADER */}
        <header className="bg-transparent relative">
          <div className="max-w-[1920px] mx-auto relative z-10">
            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
              {!menuOpen && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleMenu}
                    className="flex items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all relative z-50"
                    aria-label="Abrir menu"
                  >
                    <Menu size={24} />
                  </button>
                  
                 
                </div>
              )}

              {/* Quando o menu está aberto - mostra APENAS o botão toggle no canto esquerdo */}
              {menuOpen && (
                <div className="w-full flex justify-start">
                  <button 
                    onClick={toggleMenu}
                    className="flex items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    aria-label="Fechar menu"
                  >
                    <X size={24} />
                  </button>
                </div>
              )}

             
            </div>
          </div>
        </header>

        {/* Menu Lateral */}
        {menuOpen && (
          <div 
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl z-50"
            style={{
              animation: 'slideInLeft 0.3s ease-out forwards'
            }}
          >
            <div className="flex flex-col h-full">
              {/* Header do menu */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 p-2 rounded-full">
                    <UserCircle size={20} color="white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{authState.currentUser?.name}</p>
                    <p className="text-xs text-slate-300">Configurações</p>
                  </div>
                </div>
              </div>
              
              {/* Links do menu */}
              <div className="flex-1 overflow-y-auto py-4">
                {visibleMenuItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path 
                    : location.pathname.startsWith(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-4 py-3 transition-all ${
                        isActive 
                          ? 'bg-emerald-600/30 text-white border-l-4 border-emerald-500' 
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} />
                        <div>
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-slate-400">{item.description}</div>
                        </div>
                      </div>
                      {isActive && <ChevronRight size={16} />}
                    </Link>
                  );
                })}
              </div>
              
              {/* Footer do menu */}
              <div className="border-t border-slate-700/50 p-4">
                <button 
                  onClick={() => {
                    closeMenu();
                    setTimeout(() => handleExitToModules(), 150);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/10 transition-all"
                >
                  <Grid size={18} />
                  <span className="font-medium text-sm">Módulos</span>
                </button>
                <button 
                  onClick={() => {
                    closeMenu();
                    setTimeout(() => logout(), 150);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all mt-2"
                >
                  <LogOut size={18} />
                  <span className="font-medium text-sm">Sair</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Tab Indicator (apenas quando menu está fechado) */}
        {!menuOpen && activeItem && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 shadow-sm">
            <activeItem.icon size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold text-gray-800">{activeItem.label}</span>
            <span className="text-xs text-gray-400 ml-auto">{activeItem.description}</span>
          </div>
        )}

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
        <main className="flex-1 overflow-y-auto bg-gray-50 relative">
          <div className="w-full mx-auto p-2 sm:p-2 lg:p-2">
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

              <Route path="*" element={<Navigate to="/settings" replace />} />
            </Routes>
          </div>
        </main>
    </div>
  );
};