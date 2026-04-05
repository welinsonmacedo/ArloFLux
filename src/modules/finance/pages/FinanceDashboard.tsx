import React, { useEffect, useState, useCallback } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { 
    DollarSign, TrendingUp, FileText, PieChart, Lightbulb,
    LogOut, Grid, Menu, X, ChevronRight, UserCircle
} from 'lucide-react';
import { Role } from '@/types';

// Importando Sub-páginas Financeiras
import { AdminFinance } from '@/modules/finance/pages/admin/AdminFinance';
import { AdminAccounting } from '@/modules/finance/pages/admin/AdminAccounting';
import { AdminBusinessIntelligence } from '@/modules/finance/pages/admin/AdminBusinessIntelligence'; 
import { AdminReports } from '@/modules/finance/pages/admin/AdminReports';
import { AdminFinancialTips } from '@/modules/finance/pages/admin/AdminFinancialTips';

// Estilos CSS injetados dinamicamente
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('finance-menu-styles')) {
    const style = document.createElement('style');
    style.id = 'finance-menu-styles';
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

export const FinanceDashboard: React.FC = () => {
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
            path: '/finance', 
            label: 'CAIXA & DESPESAS', 
            icon: DollarSign, 
            exact: true,
            featureKeys: ['fin_cashier'],
            description: 'Fluxo de caixa e controle'
        },
        { 
            path: '/finance/dre', 
            label: 'DRE GERENCIAL', 
            icon: PieChart, 
            featureKeys: ['fin_dre'],
            description: 'Demonstração de resultados'
        },
        { 
            path: '/finance/bi', 
            label: 'INTELIGÊNCIA BI', 
            icon: TrendingUp, 
            featureKeys: ['fin_bi'],
            description: 'Análises e métricas avançadas'
        },
        { 
            path: '/finance/reports', 
            label: 'RELATÓRIOS', 
            icon: FileText, 
            featureKeys: ['fin_reports'],
            description: 'Exportação de dados'
        },
        { 
            path: '/finance/tips', 
            label: 'DICAS & INSIGHTS', 
            icon: Lightbulb, 
            featureKeys: ['fin_tips'],
            description: 'Recomendações financeiras'
        },
    ];

    const visibleMenuItems = menuItems.filter(item => {
        // 1. Checa Limites do Plano (allowReports)
        if (item.path !== '/finance') { // Itens que não são o dashboard principal
            if (!planLimits.allowReports) {
                if (allowedFeatures && allowedFeatures.length > 0) {
                    const hasFeature = item.featureKeys.some(key => allowedFeatures.includes(key));
                    if (!hasFeature) return false;
                } else {
                    return false;
                }
            }
        }
        
        // 2. Checagem de features (Tenant)
        if (allowedFeatures && allowedFeatures.length > 0) {
            const hasFeature = item.featureKeys.some(key => allowedFeatures.includes(key));
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

    return (
        <div className="bg-transparent relative">
            
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
                    <div className="flex justify-between items-center">
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

            {/* Menu Lateral (versão corrigida - slideInLeft) */}
            {menuOpen && (
                <div 
                    className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gradient-to-b from-emerald-900 to-emerald-950 shadow-2xl z-50"
                    style={{
                        animation: 'slideInLeft 0.3s ease-out forwards'
                    }}
                >
                    <div className="flex flex-col h-full">
                        {/* Header do menu */}
                        <div className="flex items-center justify-between p-4 border-b border-emerald-700/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/15 p-2 rounded-full">
                                    <UserCircle size={20} color="white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{authState.currentUser?.name}</p>
                                    <p className="text-xs text-emerald-200">Módulo Financeiro</p>
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
                                                : 'text-emerald-100 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} />
                                            <div>
                                                <div className="font-medium text-sm">{item.label}</div>
                                                <div className="text-xs text-emerald-200">{item.description}</div>
                                            </div>
                                        </div>
                                        {isActive && <ChevronRight size={16} />}
                                    </Link>
                                );
                            })}
                        </div>
                        
                        {/* Footer do menu */}
                        <div className="border-t border-emerald-700/50 p-4">
                            <button 
                                onClick={() => {
                                    closeMenu();
                                    setTimeout(() => handleExitToModules(), 150);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-white/10 transition-all"
                            >
                                <Grid size={18} />
                                <span className="font-medium text-sm">Módulos</span>
                            </button>
                            <button 
                                onClick={() => {
                                    closeMenu();
                                    setTimeout(() => logout(), 150);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-white/10 transition-all mt-2"
                            >
                                <LogOut size={18} />
                                <span className="font-medium text-sm">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Tab Indicator (apenas quando menu está fechado) */}
            {!menuOpen && (
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 shadow-sm">
                    {visibleMenuItems.find(item => 
                        item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
                    ) && (
                        <>
                            {(() => {
                                const activeItem = visibleMenuItems.find(item => 
                                    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
                                );
                                return activeItem ? (
                                    <>
                                        <activeItem.icon size={18} className="text-emerald-600" />
                                        <span className="text-sm font-semibold text-gray-800">{activeItem.label}</span>
                                        <span className="text-xs text-gray-400 ml-auto">{activeItem.description}</span>
                                    </>
                                ) : null;
                            })()}
                        </>
                    )}
                </div>
            )}

            {/* Conteúdo Principal */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
                <Routes>
                    <Route path="/" element={<AdminFinance />} />
                    <Route path="/dre" element={<AdminAccounting />} />
                    <Route path="/bi" element={<AdminBusinessIntelligence />} />
                    <Route path="/reports" element={<AdminReports />} />
                    <Route path="/tips" element={<AdminFinancialTips />} />
                    <Route path="*" element={<Navigate to="/finance" replace />} />
                </Routes>
            </main>
        </div>
    );
};