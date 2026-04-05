import React, { useEffect, useState, useCallback } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { 
    LayoutDashboard, Utensils, QrCode, Activity,
    LogOut, Grid, ChefHat, BookOpen, Package,
    Menu, X, ChevronRight, UserCircle,
    DollarSign, Users, Network, ShieldCheck
} from 'lucide-react';
import { Role } from '@/types';

// Importando Sub-páginas
import { AdminOverview } from '@/modules/admin/pages/admin/AdminOverview';
import { AdminProducts } from '@/modules/admin/pages/admin/AdminProducts';
import { AdminTables } from '@/modules/admin/pages/admin/AdminTables';
import { AdminMonitoring } from '@/modules/admin/pages/admin/AdminMonitoring';
import { AdminInventory } from '@/modules/inventory/pages/admin/AdminInventory';
import { StaffPayroll } from '@/modules/staff/pages/admin/StaffPayroll';
import { StaffIntegration } from '@/modules/staff/pages/admin/StaffIntegration';
import { AdminFinance } from '@/modules/finance/pages/admin/AdminFinance';
import { AdminSettings } from '@/modules/admin/pages/admin/AdminSettings';

// Estilos CSS injetados dinamicamente
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('admin-menu-styles')) {
    const style = document.createElement('style');
    style.id = 'admin-menu-styles';
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

export const AdminDashboard: React.FC = () => {
    const { state: restState } = useRestaurant();
    const { state: authState, logout } = useAuth();
    const { planLimits } = restState;
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Injetar estilos ao montar componente
    useEffect(() => {
        injectStyles();
    }, []);

    // Definição dos itens do menu
    const menuItems = [
        { 
            path: '/admin', 
            label: 'VISÃO GERAL', 
            icon: LayoutDashboard, 
            exact: true, 
            featureKeys: ['admin_overview'],
            description: 'Dashboard principal'
        },
        { 
            path: '/admin/monitoring', 
            label: 'MONITORAMENTO', 
            icon: Activity, 
            featureKeys: ['admin_monitoring'],
            description: 'Atividade em tempo real'
        }, 
        { 
            path: '/admin/products', 
            label: 'CARDÁPIO', 
            icon: Utensils, 
            featureKeys: ['admin_products'],
            description: 'Gerenciar produtos'
        },
        { 
            path: '/admin/inventory', 
            label: 'ESTOQUE', 
            icon: Package, 
            featureKeys: ['admin_inventory'],
            description: 'Controle de insumos'
        },
        { 
            path: '/admin/finance', 
            label: 'FINANCEIRO', 
            icon: DollarSign, 
            featureKeys: ['admin_finance'],
            description: 'Fluxo de caixa e DRE'
        },
        { 
            path: '/admin/payroll', 
            label: 'RH & FOLHA', 
            icon: Users, 
            featureKeys: ['admin_staff'],
            description: 'Gestão de pagamentos'
        },
        { 
            path: '/admin/esocial', 
            label: 'E-SOCIAL', 
            icon: Network, 
            featureKeys: ['admin_staff'],
            description: 'Arquivos XML'
        },
        { 
            path: '/admin/tables', 
            label: 'MESAS & QR', 
            icon: QrCode, 
            featureKeys: ['admin_tables'], 
            required: 'allowTableMgmt',
            description: 'Layout e QR Codes'
        },
        { 
            path: '/admin/settings', 
            label: 'EMPRESA', 
            icon: ShieldCheck,
            featureKeys: ['admin_settings'],
            description: 'Dados da unidade'
        },
    ];

    const visibleMenuItems = menuItems.filter(item => {
        // 1. Checa requisitos especiais
        if (item.required === 'allowTableMgmt' && !planLimits.allowTableMgmt) return false;
        
        // 2. Checagem de features (Tenant)
        if (restState.allowedFeatures && restState.allowedFeatures.length > 0) {
            const hasFeature = item.featureKeys.some(key => restState.allowedFeatures!.includes(key));
            if (!hasFeature) return false;
        }

        // 3. Permissões do Usuário
        if (authState.currentUser?.role !== Role.ADMIN && authState.currentUser?.customRoleId) {
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

    // Encontrar o item ativo para o indicador mobile
    const activeItem = visibleMenuItems.find(item => 
        item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
    );

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            
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
                                    <p className="text-xs text-slate-300">Unidade Gestora</p>
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
                                                ? 'bg-purple-600/30 text-white border-l-4 border-purple-500' 
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
                    <activeItem.icon size={18} className="text-purple-600" />
                    <span className="text-sm font-semibold text-gray-800">{activeItem.label}</span>
                    <span className="text-xs text-gray-400 ml-auto">{activeItem.description}</span>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-full mx-auto p-4 sm:p-6 lg:p-8">
                    <Routes>
                        <Route path="/" element={<AdminOverview />} />
                        <Route path="monitoring" element={<AdminMonitoring />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="inventory" element={<AdminInventory />} />
                        <Route path="finance" element={<AdminFinance />} />
                        <Route path="payroll" element={<StaffPayroll />} />
                        <Route path="esocial" element={<StaffIntegration />} />
                        <Route path="tables" element={<AdminTables />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};