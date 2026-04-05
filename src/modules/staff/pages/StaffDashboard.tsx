import React, { useEffect, useState, useCallback } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { 
    Users, FileText, 
    LogOut, Grid, Timer, Settings,
    Menu, X, ChevronRight, UserCircle
} from 'lucide-react';
import { Role } from '@/types';

// Sub-páginas RH
import { StaffEmployeesWrapper } from '@/modules/staff/pages/admin/StaffEmployeesWrapper';
import { StaffPayrollWrapper } from '@/modules/staff/pages/admin/StaffPayrollWrapper';
import { StaffAttendance } from '@/modules/staff/pages/admin/StaffAttendance';
import { StaffSettings } from '@/modules/staff/pages/admin/StaffSettings';

// Estilos CSS injetados dinamicamente
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('mobile-menu-styles')) {
    const style = document.createElement('style');
    style.id = 'mobile-menu-styles';
    style.textContent = `
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
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
      
      .animate-slide-in-right {
        animation: slideInRight 0.3s ease-out forwards;
      }
      
      .animate-fade-in {
        animation: fadeIn 0.2s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
};

export const StaffDashboard: React.FC = () => {
  const { state: restState } = useRestaurant();
  const { state: authState, logout } = useAuth();
  const { planLimits, allowedFeatures } = restState;
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const userRole = authState.currentUser?.role;

  // Injetar estilos ao montar componente
  useEffect(() => {
    injectStyles();
  }, []);

  // Definição dos itens do menu
  const menuItems = [
    { 
        path: '/rh', 
        label: 'COLABORADORES', 
        icon: Users, 
        exact: true,
        featureKeys: ['hr_staff'],
        description: 'Gestão de equipe'
    },
    { 
        path: '/rh/attendance', 
        label: 'CONTROLE DE PONTO', 
        icon: Timer, 
        featureKeys: ['hr_timeclock'],
        description: 'Frequência e horários'
    },
    { 
        path: '/rh/payroll', 
        label: 'FOLHA', 
        icon: FileText, 
        featureKeys: ['hr_payroll'],
        description: 'Cálculos e proventos'
    },
    { 
        path: '/rh/settings', 
        label: 'CONFIGURAÇÕES', 
        icon: Settings, 
        featureKeys: ['hr_config'],
        description: 'Preferências do sistema'
    },
  ];

  const visibleMenuItems = menuItems.filter(item => {
      if (!planLimits.allowHR && userRole !== Role.ADMIN) return false;
      
      if (allowedFeatures && allowedFeatures.length > 0) {
          const hasFeature = item.featureKeys.some(key => allowedFeatures.includes(key));
          if (!hasFeature) return false;
      }

      if (authState.currentUser?.role !== 'ADMIN' && authState.currentUser?.customRoleId) {
          const userFeatures = authState.currentUser.allowedFeatures || [];
          const hasUserFeature = item.featureKeys.some(key => userFeatures.includes(key));
          if (!hasUserFeature) return false;
      }

      return true;
  });

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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden ">
        
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
        
        {/* Header */}
        <header className="bg-transparent relative">

            <div className="max-w-[1920px] mx-auto relative z-10">
                <div className="px-2 sm:px-2 lg:px-2  flex justify-between items-center">
                    {!menuOpen && (
                        <>
                        <div className="flex items-center gap-1 sm:gap-1">
                            <button 
                                onClick={toggleMenu}
                                className="flex items-center justify-center p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all relative z-50"
                                aria-label="Abrir menu"
                            >
                                <Menu size={30} />
                            </button>
                        </div>
                      </>
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
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-pink-900 shadow-2xl z-50"
              style={{
                animation: 'slideInLeft 0.3s ease-out forwards'
              }}
            >
                <div className="flex flex-col h-full">
                    {/* Header do menu */}
                    <div className="flex items-center justify-between p-4 border-b border-pink-700/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/15 p-2 rounded-full">
                                <UserCircle size={20} color="white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold  text-white">{authState.currentUser?.name}</p>
                                <p className="text-xs text-pink-200">Módulo RH & Equipe</p>
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
                                            ? 'bg-white/20 text-white' 
                                            : 'text-pink-100 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} />
                                        <div>
                                            <div className="font-medium text-sm">{item.label}</div>
                                            <div className="text-xs text-pink-200">{item.description}</div>
                                        </div>
                                    </div>
                                    {isActive && <ChevronRight size={16} />}
                                </Link>
                            );
                        })}
                    </div>
                    
                    {/* Footer do menu */}
                    <div className="border-t border-pink-700/50 p-4">
                        <button 
                            onClick={() => {
                                closeMenu();
                                setTimeout(() => handleExitToModules(), 150);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-pink-100 hover:bg-white/10 transition-all"
                        >
                            <Grid size={18} />
                            <span className="font-medium text-sm">Módulos</span>
                        </button>
                        <button 
                            onClick={() => {
                                closeMenu();
                                setTimeout(() => logout(), 150);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-pink-100 hover:bg-white/10 transition-all mt-2"
                        >
                            <LogOut size={18} />
                            <span className="font-medium text-sm">Sair</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
            <Routes>
                <Route path="/" element={<StaffEmployeesWrapper />} />
                <Route path="/attendance" element={<StaffAttendance />} />
                <Route path="/payroll" element={<StaffPayrollWrapper />} />
                <Route path="/settings" element={<StaffSettings />} />
                <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
        </main>
    </div>
  );
};