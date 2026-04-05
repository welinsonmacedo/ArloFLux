import React, { useEffect, useState, useCallback, useMemo } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { useUI } from '@/core/context/UIContext';
import { 
    Coffee, Monitor, DollarSign, LogOut, Grid, ChefHat, Lock,
    QrCode, Utensils, Palette, Menu, X, ChevronRight, UserCircle
} from 'lucide-react';
import { Role } from '@/types';

// Importando Apps Operacionais
import { WaiterApp } from '@/modules/operational/pages/WaiterApp';
import { KitchenDisplay } from '@/modules/operational/pages/KitchenDisplay';
import { CashierDashboard } from '@/modules/operational/pages/CashierDashboard';
import { TVPanel } from '@/modules/operational/pages/TVPanel';

// Importando Componentes de Gestão (Reutilizados do Admin)
import { AdminTables } from '@/modules/admin/pages/admin/AdminTables';
import { AdminProducts } from '@/modules/admin/pages/admin/AdminProducts';
import { AdminMenuAppearance } from '@/modules/admin/pages/admin/AdminMenuAppearance';

// Estilos CSS injetados dinamicamente
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('restaurant-menu-styles')) {
    const style = document.createElement('style');
    style.id = 'restaurant-menu-styles';
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

export const RestaurantDashboard: React.FC = () => {
  const { state: restState } = useRestaurant();
  const { state: authState, logout } = useAuth();
  const { isHeaderVisible } = useUI();
  const { planLimits } = restState;
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
        path: '/restaurant/waiter', 
        label: 'SALÃO & MESAS', 
        icon: Coffee, 
        roles: [Role.ADMIN, Role.WAITER, Role.CASHIER], 
        required: null,
        featureKeys: ['rest_tables'],
        description: 'Gestão de mesas e pedidos'
    },
    { 
        path: '/restaurant/kitchen', 
        label: 'COZINHA (KDS)', 
        icon: Monitor, 
        roles: [Role.ADMIN, Role.KITCHEN],
        required: 'allowKds',
        featureKeys: ['rest_kds'],
        description: 'Monitor de produção'
    },
    { 
        path: '/restaurant/cashier', 
        label: 'CAIXA & DELIVERY', 
        icon: DollarSign, 
        roles: [Role.ADMIN, Role.CASHIER],
        required: 'allowCashier',
        featureKeys: ['rest_orders'],
        description: 'PDV e recebimentos'
    },
    { 
        path: '/restaurant/panel', 
        label: 'PAINEL TV', 
        icon: Monitor, 
        roles: [Role.ADMIN, Role.WAITER, Role.CASHIER],
        required: null,
        featureKeys: ['rest_tv'],
        description: 'Monitor de pedidos'
    },
    { 
        path: '/restaurant/tables', 
        label: 'CADASTRO MESAS', 
        icon: QrCode, 
        roles: [Role.ADMIN],
        required: 'allowTableMgmt',
        featureKeys: ['rest_tables_config'],
        description: 'Layout e QR Codes'
    },
    { 
        path: '/restaurant/menu', 
        label: 'CARDÁPIO', 
        icon: Utensils, 
        roles: [Role.ADMIN],
        required: null,
        featureKeys: ['rest_menu'],
        description: 'Gerenciar produtos'
    },
    { 
        path: '/restaurant/appearance', 
        label: 'APARÊNCIA', 
        icon: Palette, 
        roles: [Role.ADMIN],
        required: 'allowCustomization',
        featureKeys: ['rest_appearance'],
        description: 'Personalização visual'
    },
  ];

  // Filtra itens do menu
  const visibleMenuItems = menuItems.filter(item => {
      // 1. Checa Limites do Plano
      if (item.required === 'allowKds' && !planLimits.allowKds) return false;
      if (item.required === 'allowCashier' && !planLimits.allowCashier) return false;
      if (item.required === 'allowTableMgmt' && !planLimits.allowTableMgmt) return false;
      if (item.required === 'allowCustomization' && !planLimits.allowCustomization) return false;
      
      // 2. Checa Features Granulares (Tenant)
      if (restState.allowedFeatures && restState.allowedFeatures.length > 0) {
          const hasTenantFeature = item.featureKeys.some(key => restState.allowedFeatures!.includes(key));
          if (!hasTenantFeature) return false;
      }

      // 3. Permissões do Usuário (Cargos Personalizados)
      if (authState.currentUser?.role !== Role.ADMIN && authState.currentUser?.customRoleId) {
          const userFeatures = authState.currentUser.allowedFeatures || [];
          const hasUserFeature = item.featureKeys.some(key => userFeatures.includes(key));
          if (!hasUserFeature) return false;
          
          // Se o usuário tem um cargo personalizado e a feature está permitida, 
          // ignoramos o check de Role fixo abaixo.
          return true;
      }
      
      // 4. Checa Permissão do Usuário (Role)
      if (userRole === Role.ADMIN) return true; 
      if (item.roles && userRole && !item.roles.includes(userRole)) return false;
      
      return true;
  });

  // Redireciona para a primeira aba disponível se estiver na rota raiz
  useEffect(() => {
      if (location.pathname === '/restaurant' && visibleMenuItems.length > 0) {
          navigate(visibleMenuItems[0].path, { replace: true });
      }
  }, [location.pathname, visibleMenuItems, navigate]);

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

  // Encontrar o item ativo para o indicador mobile
  const activeItem = visibleMenuItems.find(item => 
      location.pathname.startsWith(item.path)
  );

  if (visibleMenuItems.length === 0) {
      return (
          <div className="h-screen flex flex-col items-center justify-center text-slate-500 bg-gray-50">
              <Lock size={48} className="mb-4 text-red-500"/>
              <h2 className="text-xl font-bold">Acesso Restrito</h2>
              <p>Você não tem permissão para acessar nenhuma função deste módulo.</p>
              <button onClick={handleExitToModules} className="mt-4 text-blue-600 underline">Voltar</button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
        
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
        
        {/* TOP BAR / HEADER */}
        <header className="bg-transparent relative" >
            <div className="max-w-[1920px] mx-auto relative z-10">
                <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
                    {!menuOpen && isHeaderVisible && (
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
                className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gradient-to-b from-blue-900 to-blue-950 shadow-2xl z-50"
                style={{
                    animation: 'slideInLeft 0.3s ease-out forwards'
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Header do menu */}
                    <div className="flex items-center justify-between p-4 border-b border-blue-700/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/15 p-2 rounded-full">
                                <UserCircle size={20} color="white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{authState.currentUser?.name}</p>
                                <p className="text-xs text-blue-200">Módulo Restaurante</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Links do menu */}
                    <div className="flex-1 overflow-y-auto py-4">
                        {visibleMenuItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={closeMenu}
                                    className={`flex items-center justify-between px-4 py-3 transition-all ${
                                        isActive 
                                            ? 'bg-blue-600/30 text-white border-l-4 border-blue-400' 
                                            : 'text-blue-100 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} />
                                        <div>
                                            <div className="font-medium text-sm">{item.label}</div>
                                            <div className="text-xs text-blue-200">{item.description}</div>
                                        </div>
                                    </div>
                                    {isActive && <ChevronRight size={16} />}
                                </Link>
                            );
                        })}
                    </div>
                    
                    {/* Footer do menu */}
                    <div className="border-t border-blue-700/50 p-4">
                        <button 
                            onClick={() => {
                                closeMenu();
                                setTimeout(() => handleExitToModules(), 150);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-white/10 transition-all"
                        >
                            <Grid size={18} />
                            <span className="font-medium text-sm">Módulos</span>
                        </button>
                        <button 
                            onClick={() => {
                                closeMenu();
                                setTimeout(() => logout(), 150);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/10 transition-all mt-2"
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
            <div className="lg:hidden bg-blue-700 px-4 py-3 flex items-center gap-2 shadow-sm">
                <activeItem.icon size={18} className="text-white" />
                <span className="text-sm font-semibold text-white">{activeItem.label}</span>
                <span className="text-xs text-blue-200 ml-auto">{activeItem.description}</span>
            </div>
        )}

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 relative p-2 md:p-2">
            <div className="h-full w-full max-w-[1920px] mx-auto">
                <Routes>
                    <Route path="waiter" element={<WaiterApp />} />
                    
                    {planLimits.allowKds && (
                        <Route path="kitchen" element={<KitchenDisplay />} />
                    )}

                    {planLimits.allowCashier && (
                        <Route path="cashier" element={<CashierDashboard />} />
                    )}

                    <Route path="panel" element={<TVPanel />} />

                    {/* Novas Rotas para Admin dentro do Módulo Restaurante */}
                    {planLimits.allowTableMgmt && (
                        <Route path="tables" element={<AdminTables />} />
                    )}

                    <Route path="menu" element={<AdminProducts />} />
                    
                    {planLimits.allowCustomization && (
                        <Route path="appearance" element={<AdminMenuAppearance />} />
                    )}

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="waiter" replace />} />
                </Routes>
            </div>
        </main>
    </div>
  );
};