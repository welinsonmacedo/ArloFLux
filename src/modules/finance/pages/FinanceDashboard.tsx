import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { 
    DollarSign, TrendingUp, FileText, PieChart, Lightbulb,
    LogOut, Grid, ChefHat, Menu, X, ChevronRight, User,
    Bell, Calendar, ArrowLeft, Home, CreditCard, BarChart3,
    Wallet, TrendingDown, Award, HelpCircle
} from 'lucide-react';

// Importando Sub-páginas Financeiras
import { AdminFinance } from '@/modules/finance/pages/admin/AdminFinance';
import { AdminAccounting } from '@/modules/finance/pages/admin/AdminAccounting';
import { AdminBusinessIntelligence } from '@/modules/finance/pages/admin/AdminBusinessIntelligence'; 
import { AdminReports } from '@/modules/finance/pages/admin/AdminReports';
import { AdminFinancialTips } from '@/modules/finance/pages/admin/AdminFinancialTips';

export const FinanceDashboard: React.FC = () => {
    const { state: restState } = useRestaurant();
    const { state: authState, logout } = useAuth();
    const { planLimits, allowedFeatures } = restState;
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Definição das Abas do Módulo Financeiro
    const tabs = [
        { 
            path: '/finance', 
            label: 'Caixa & Despesas', 
            icon: DollarSign, 
            exact: true, 
            featureKeys: ['fin_cashier'],
            description: 'Fluxo de caixa e controle financeiro',
            color: 'emerald'
        },
        { 
            path: '/finance/dre', 
            label: 'DRE Gerencial', 
            icon: PieChart, 
            required: 'allowReports', 
            featureKeys: ['fin_dre'],
            description: 'Demonstração de resultados',
            color: 'blue'
        },
        { 
            path: '/finance/bi', 
            label: 'Inteligência BI', 
            icon: TrendingUp, 
            required: 'allowReports', 
            featureKeys: ['fin_bi'],
            description: 'Análises e métricas avançadas',
            color: 'purple'
        },
        { 
            path: '/finance/reports', 
            label: 'Relatórios', 
            icon: FileText, 
            required: 'allowReports', 
            featureKeys: ['fin_reports'],
            description: 'Exportação de dados',
            color: 'orange'
        },
        { 
            path: '/finance/tips', 
            label: 'Dicas & Insights', 
            icon: Lightbulb, 
            required: 'allowReports', 
            featureKeys: ['fin_tips'],
            description: 'Recomendações financeiras',
            color: 'yellow'
        },
    ];

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

    // Update current time
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Filtra abas
    const visibleTabs = tabs.filter(tab => {
        // 1. Checa Limites do Plano
        if (tab.required === 'allowReports' && !planLimits.allowReports) {
            if (allowedFeatures && allowedFeatures.length > 0) {
                const hasFeature = tab.featureKeys.some(key => allowedFeatures.includes(key));
                if (hasFeature) return true;
            }
            return false;
        }
        
        // 2. Checagem de features (Tenant)
        if (allowedFeatures && allowedFeatures.length > 0) {
            const hasFeature = tab.featureKeys.some(key => allowedFeatures.includes(key));
            if (!hasFeature) return false;
        }

        // 3. Permissões do Usuário
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
    const formattedTime = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const getTabColor = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string; active: string }> = {
            emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', active: 'bg-emerald-600' },
            blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', active: 'bg-blue-600' },
            purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500', active: 'bg-purple-600' },
            orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500', active: 'bg-orange-600' },
            yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500', active: 'bg-yellow-600' },
        };
        return colors[color] || colors.emerald;
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden font-sans">
            
            {/* TOP BAR / HEADER */}
            <header className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-xl shrink-0 z-30 relative">
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
                            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm shadow-lg">
                                {restState.theme.logoUrl ? (
                                    <img src={restState.theme.logoUrl} className="h-7 w-7 sm:h-8 sm:w-8 object-contain" alt="Logo" />
                                ) : (
                                    <ChefHat size={20} className="sm:w-6 sm:h-6" />
                                )}
                            </div>
                            
                            {/* Restaurant Info */}
                            <div className="hidden sm:block">
                                <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight">
                                    {restState.theme.restaurantName}
                                </h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                        Financeiro
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Date & Time */}
                            <div className="hidden md:block text-right">
                                <p className="text-xs font-medium text-emerald-300">{formattedDate}</p>
                                <p className="text-sm font-bold text-white">{formattedTime}</p>
                            </div>

                            {/* Help Button */}
                            <Link 
                                to="/manual"
                                target="_blank"
                                className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                                aria-label="Ajuda"
                            >
                                <HelpCircle size={18} />
                            </Link>

                            {/* User Menu */}
                            <div className="relative user-menu">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                                >
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                                        <User size={14} className="sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="hidden sm:inline text-sm font-medium">
                                        {authState.currentUser?.name?.split(' ')[0] || 'Admin'}
                                    </span>
                                    <ChevronRight size={14} className={`hidden sm:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-90' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 animate-fadeIn">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800">{authState.currentUser?.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{authState.currentUser?.email}</p>
                                            <p className="text-[10px] text-emerald-600 mt-1 font-medium">Financeiro</p>
                                        </div>
                                        <Link
                                            to="/manual"
                                            target="_blank"
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <HelpCircle size={16} />
                                            Manual de Ajuda
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                                        >
                                            <LogOut size={16} /> Sair do Sistema
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Modules Button - Desktop */}
                            <button 
                                onClick={handleExitToModules}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                            >
                                <Grid size={16} /> Módulos
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Menu */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden bg-emerald-800/95 backdrop-blur-lg border-t border-emerald-700/50 animate-slideDown">
                            <div className="px-4 py-3 space-y-1">
                                {visibleTabs.map(tab => {
                                    const isActive = tab.exact 
                                        ? location.pathname === tab.path 
                                        : location.pathname.startsWith(tab.path);
                                    const tabColor = getTabColor(tab.color);
                                    
                                    return (
                                        <Link 
                                            key={tab.path}
                                            to={tab.path}
                                            className={`
                                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                                ${isActive 
                                                    ? `${tabColor.active} text-white` 
                                                    : 'text-emerald-100 hover:bg-white/10'}
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
                                
                                <div className="pt-3 mt-2 border-t border-emerald-700/50">
                                    <Link
                                        to="/manual"
                                        target="_blank"
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-emerald-100 hover:bg-white/10 transition-all duration-200"
                                    >
                                        <HelpCircle size={18} />
                                        <span className="font-medium text-sm">Manual de Ajuda</span>
                                    </Link>
                                    <button
                                        onClick={handleExitToModules}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-emerald-100 hover:bg-white/10 transition-all duration-200"
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
                                const tabColor = getTabColor(tab.color);
                                
                                return (
                                    <Link 
                                        key={tab.path}
                                        to={tab.path}
                                        className={`
                                            group relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                                            ${isActive 
                                                ? `text-white bg-white/10 rounded-t-lg` 
                                                : 'text-emerald-200 hover:text-white hover:bg-white/5 rounded-t-lg'}
                                        `}
                                    >
                                        <tab.icon size={18} className={`transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-300' : ''}`} />
                                        <span>{tab.label}</span>
                                        {isActive && (
                                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tabColor.bg} rounded-full`} />
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
                            <currentTab.icon size={16} className="text-emerald-600" />
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
                        <Route path="/" element={<AdminFinance />} />
                        
                        {planLimits.allowReports && (
                            <>
                                <Route path="dre" element={<AdminAccounting />} />
                                <Route path="bi" element={<AdminBusinessIntelligence />} />
                                <Route path="reports" element={<AdminReports />} />
                                <Route path="tips" element={<AdminFinancialTips />} />
                            </>
                        )}

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

// Add these styles to your global CSS or include them in a style tag
const styles = `
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
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(100%);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
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
    
    .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
    }
    
    .animate-slideDown {
        animation: slideDown 0.3s ease-out;
    }
    
    .animate-slideUp {
        animation: slideUp 0.3s ease-out;
    }
    
    .animate-slideInRight {
        animation: slideInRight 0.3s ease-out;
    }
    
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}