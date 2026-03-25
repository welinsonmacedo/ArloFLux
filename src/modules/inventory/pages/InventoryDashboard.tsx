import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { 
    Package, ShoppingCart, Truck, LogOut, Grid, 
    ClipboardList, Archive, PlusCircle, FileInput, Scale,
    Menu, X, ChevronRight, Home, User, Settings
} from 'lucide-react';

// Importando Sub-páginas de Estoque
import { AdminInventory } from '@/modules/inventory/pages/admin/AdminInventory';
import { AdminPurchaseSuggestions } from '@/modules/inventory/pages/admin/AdminPurchaseSuggestions';
import { AdminPurchaseOrders } from '@/modules/inventory/pages/admin/AdminPurchaseOrders';

export const InventoryDashboard: React.FC = () => {
  const { state: restState } = useRestaurant();
  const { state: authState, logout } = useAuth();
  const { planLimits, allowedFeatures } = restState;
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  // Definição das Abas do Módulo Estoque
  const tabs = [
    { path: '/inventory', label: 'ITENS', icon: Package, exact: true, featureKeys: ['inv_items'], description: 'Gerenciar estoque' },
    { path: '/inventory/new', label: 'NOVO ITEM', icon: PlusCircle, featureKeys: ['inv_new_item'], description: 'Adicionar produto' },
    { path: '/inventory/entry', label: 'ENTRADA DE NOTA', icon: FileInput, featureKeys: ['inv_entry'], description: 'Registrar nota' },
    { path: '/inventory/count', label: 'BALANÇO', icon: Scale, featureKeys: ['inv_count'], description: 'Inventário físico' },
    { path: '/inventory/purchases', label: 'SUGESTÕES', icon: ShoppingCart, featureKeys: ['inv_purchases'], description: 'Compras sugeridas' },
    { path: '/inventory/suppliers', label: 'FORNECEDORES', icon: Truck, featureKeys: ['inv_suppliers'], description: 'Gerenciar fornecedores' },
    { path: '/inventory/orders', label: 'PEDIDOS', icon: ClipboardList, featureKeys: ['inv_orders'], description: 'Ordens de compra' },
  ];

  // Filtra abas
  const visibleTabs = tabs.filter(tab => {
      // 1. Checa Limites do Plano
      if (!planLimits.allowInventory) return false;
      
      // 2. Checa Features Granulares (Tenant)
      if (allowedFeatures && allowedFeatures.length > 0) {
          const hasTenantFeature = tab.featureKeys.some(key => allowedFeatures.includes(key));
          if (!hasTenantFeature) return false;
      }

      // 3. Permissões do Usuário (Cargos Personalizados)
      if (authState.currentUser?.role !== 'ADMIN' && authState.currentUser?.customRoleId) {
          const userFeatures = authState.currentUser.allowedFeatures || [];
          const hasUserFeature = tab.featureKeys.some(key => userFeatures.includes(key));
          if (!hasUserFeature) return false;
      }

      return true;
  });

  const handleExitToModules = () => {
      navigate('/modules');
  };

  const handleLogout = () => {
    logout();
  };

  const getCurrentTabInfo = () => {
    const currentPath = location.pathname;
    const tab = visibleTabs.find(tab => 
      tab.exact ? currentPath === tab.path : currentPath.startsWith(tab.path)
    );
    return tab || visibleTabs[0];
  };

  const currentTab = getCurrentTabInfo();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        
        {/* TOP BAR / HEADER - Modern Design */}
        <header className="bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-xl shrink-0 z-30 relative">
            <div className="w-full mx-auto">
                
                {/* Main Header Row */}
                <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
                    {/* Logo and Restaurant Info */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Logo */}
                        <div className="bg-white/15 p-2 rounded-xl backdrop-blur-sm shadow-lg">
                            {restState.theme.logoUrl ? (
                                <img src={restState.theme.logoUrl} className="h-7 w-7 sm:h-8 sm:w-8 object-contain" alt="Logo" />
                            ) : (
                                <Archive size={20} className="sm:w-6 sm:h-6" />
                            )}
                        </div>
                        
                        {/* Restaurant Info */}
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight">
                                {restState.theme.restaurantName}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] sm:text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                    Estoque
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Current Module Badge - Mobile */}
                        <div className="sm:hidden text-right">
                            <p className="text-xs font-semibold">{restState.theme.restaurantName?.split(' ')[0]}</p>
                            <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full uppercase">
                                Estoque
                            </span>
                        </div>

                        {/* User Menu */}
                        <div className="relative user-menu">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <User size={14} className="sm:w-4 sm:h-4" />
                                </div>
                                <span className="hidden sm:inline text-sm font-medium">
                                    {authState.currentUser?.name?.split(' ')[0] || 'Usuário'}
                                </span>
                                <ChevronRight size={14} className={`hidden sm:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 animate-fadeIn">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-800">{authState.currentUser?.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{authState.currentUser?.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut size={16} /> Sair
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Modules Button - Desktop */}
                        <button 
                            onClick={handleExitToModules}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/15 hover:bg-white/25 transition-all duration-200 border border-white/20"
                        >
                            <Grid size={16} /> Módulos
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-orange-800/95 backdrop-blur-lg border-t border-orange-700/50 animate-slideDown">
                        <div className="px-4 py-3 space-y-1">
                            {visibleTabs.map(tab => {
                                const isActive = tab.exact 
                                    ? location.pathname === tab.path 
                                    : location.pathname.startsWith(tab.path);
                                
                                return (
                                    <Link 
                                        key={tab.path}
                                        to={tab.path}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                            ${isActive 
                                                ? 'bg-orange-500/30 text-white' 
                                                : 'text-orange-100 hover:bg-white/10'}
                                        `}
                                    >
                                        <tab.icon size={18} />
                                        <div className="flex-1">
                                            <span className="font-medium text-sm">{tab.label}</span>
                                            <p className="text-xs opacity-75">{tab.description}</p>
                                        </div>
                                        {isActive && <ChevronRight size={16} />}
                                    </Link>
                                );
                            })}
                            
                            <div className="pt-3 mt-2 border-t border-orange-700/50">
                                <button
                                    onClick={handleExitToModules}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-orange-100 hover:bg-white/10 transition-all duration-200"
                                >
                                    <Grid size={18} />
                                    <span className="font-medium text-sm">Todos os Módulos</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Navigation Tabs */}
                <div className="hidden lg:block px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {visibleTabs.map(tab => {
                            const isActive = tab.exact 
                                ? location.pathname === tab.path 
                                : location.pathname.startsWith(tab.path);
                            
                            return (
                                <Link 
                                    key={tab.path}
                                    to={tab.path}
                                    className={`
                                        group relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                                        ${isActive 
                                            ? 'text-white bg-white/10 rounded-t-lg' 
                                            : 'text-orange-100 hover:text-white hover:bg-white/5 rounded-t-lg'}
                                    `}
                                >
                                    <tab.icon size={18} className={`transition-transform group-hover:scale-110 ${isActive ? 'text-orange-200' : ''}`} />
                                    <span>{tab.label}</span>
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </header>

        {/* Mobile Tab Indicator */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {currentTab && (
                    <>
                        <currentTab.icon size={16} className="text-orange-600" />
                        <span className="text-sm font-semibold text-gray-800">{currentTab.label}</span>
                    </>
                )}
            </div>
            <span className="text-xs text-gray-500">{currentTab?.description}</span>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto bg-gray-50">
            <div className="w-full mx-auto p-4 sm:p-6 lg:p-8">
                <Routes>
                    <Route path="/" element={<AdminInventory view="ITEMS" />} />
                    <Route path="new" element={<AdminInventory view="NEW_ITEM" />} />
                    <Route path="entry" element={<AdminInventory view="ENTRY" />} />
                    <Route path="count" element={<AdminInventory view="COUNT" />} />
                    <Route path="suppliers" element={<AdminInventory view="SUPPLIERS" />} />
                    <Route path="purchases" element={<AdminPurchaseSuggestions />} />
                    <Route path="orders" element={<AdminPurchaseOrders />} />
                    <Route path="*" element={<Navigate to="" replace />} />
                </Routes>
            </div>
        </main>

        {/* Add these styles to your global CSS */}
        <style >{`
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .animate-fadeIn {
                animation: fadeIn 0.2s ease-out;
            }
            
            .animate-slideDown {
                animation: slideDown 0.3s ease-out;
            }
            
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
    </div>
  );
};