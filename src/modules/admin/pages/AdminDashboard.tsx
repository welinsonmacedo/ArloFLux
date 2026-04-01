import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { 
    LayoutDashboard, Utensils, QrCode, Activity,
    LogOut, Grid, ChefHat, BookOpen, Package,
    Menu, X, ChevronRight, User, Settings,
    DollarSign, Users, Network, ShieldCheck
} from 'lucide-react';

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

export const AdminDashboard: React.FC = () => {
    const { state: restState } = useRestaurant();
    const { state: authState, logout } = useAuth();
    const { planLimits } = restState;
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Definição das Abas do Gestor Atualizada
    const tabs = [
        { 
            path: '/admin', 
            label: 'Visão Geral', 
            icon: LayoutDashboard, 
            exact: true, 
            featureKeys: ['admin_overview'],
            description: 'Dashboard principal'
        },
        { 
            path: '/admin/monitoring', 
            label: 'Monitoramento', 
            icon: Activity, 
            featureKeys: ['admin_monitoring'],
            description: 'Atividade em tempo real'
        }, 
        { 
            path: '/admin/products', 
            label: 'Cardápio', 
            icon: Utensils, 
            featureKeys: ['admin_products'],
            description: 'Gerenciar produtos'
        },
        { 
            path: '/admin/inventory', 
            label: 'Estoque', 
            icon: Package, 
            featureKeys: ['admin_inventory'],
            description: 'Controle de insumos'
        },
        { 
            path: '/admin/finance', 
            label: 'Financeiro', 
            icon: DollarSign, 
            featureKeys: ['admin_finance'],
            description: 'Fluxo de caixa e DRE'
        },
        { 
            path: '/admin/payroll', 
            label: 'RH & Folha', 
            icon: Users, 
            featureKeys: ['admin_staff'],
            description: 'Gestão de pagamentos'
        },
        { 
            path: '/admin/esocial', 
            label: 'e-Social', 
            icon: Network, 
            featureKeys: ['admin_staff'],
            description: 'Arquivos XML'
        },
        { 
            path: '/admin/tables', 
            label: 'Mesas & QR', 
            icon: QrCode, 
            featureKeys: ['admin_tables'], 
            required: 'allowTableMgmt',
            description: 'Layout e QR Codes'
        },
        { 
            path: '/admin/settings', 
            label: 'Empresa', 
            icon: Settings, 
            featureKeys: ['admin_settings'],
            description: 'Dados da unidade'
        },
    ];

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isUserMenuOpen && !(event.target as Element).closest('.user-menu')) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isUserMenuOpen]);

    const visibleTabs = tabs.filter(tab => {
        if (tab.required === 'allowTableMgmt' && !planLimits.allowTableMgmt) return false;
        
        if (restState.allowedFeatures && restState.allowedFeatures.length > 0) {
            const hasFeature = tab.featureKeys.some(key => restState.allowedFeatures!.includes(key));
            if (!hasFeature) return false;
        }

        if (authState.currentUser?.role !== 'ADMIN' && authState.currentUser?.customRoleId) {
            const userFeatures = authState.currentUser.allowedFeatures || [];
            const hasUserFeature = tab.featureKeys.some(key => userFeatures.includes(key));
            if (!hasUserFeature) return false;
        }

        return true;
    });

    const handleExitToModules = () => navigate('/modules');
    const handleLogout = () => logout();

    const currentTab = visibleTabs.find(tab => 
        tab.exact ? location.pathname === tab.path : location.pathname.startsWith(tab.path)
    ) || visibleTabs[0];

    return (
        <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''} overflow-hidden font-sans`}>
            
            {/* TOP BAR */}
            <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl shrink-0 z-30 relative">
                <div className="w-full mx-auto">
                    <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-all focus:outline-none"
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>

                            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                                {restState.theme.logoUrl ? (
                                    <img src={restState.theme.logoUrl} className="h-7 w-7 object-contain" alt="Logo" />
                                ) : (
                                    <ChefHat size={20} />
                                )}
                            </div>
                            
                            <div className="hidden sm:block">
                                <h1 className="font-bold text-base leading-tight">
                                    {restState.theme.restaurantName}
                                </h1>
                                <span className="text-[10px] font-bold bg-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Unidade Gestora
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative user-menu">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                                        <User size={16} />
                                    </div>
                                    <span className="hidden sm:inline text-sm font-medium">
                                        {authState.currentUser?.name?.split(' ')[0] || 'Admin'}
                                    </span>
                                    <ChevronRight size={14} className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-90' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 text-slate-800">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold">{authState.currentUser?.name}</p>
                                            <p className="text-xs text-gray-500">{authState.currentUser?.email}</p>
                                        </div>
                                        <Link to="/manual" target="_blank" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"><BookOpen size={16} /> Manual</Link>
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"><LogOut size={16} /> Sair</button>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleExitToModules}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase bg-white/10 hover:bg-white/20 border border-white/20"
                            >
                                <Grid size={16} /> Módulos
                            </button>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:block px-8">
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                            {visibleTabs.map(tab => {
                                const isActive = tab.exact ? location.pathname === tab.path : location.pathname.startsWith(tab.path);
                                return (
                                    <Link 
                                        key={tab.path}
                                        to={tab.path}
                                        className={`group relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${isActive ? 'text-white bg-white/10 rounded-t-lg' : 'text-slate-400 hover:text-white hover:bg-white/5 rounded-t-lg'}`}
                                    >
                                        <tab.icon size={18} className={`${isActive ? 'text-purple-400' : ''}`} />
                                        <span>{tab.label}</span>
                                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Navigation */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-72 h-full bg-slate-900 shadow-2xl p-6 space-y-4 animate-slideInLeft" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-black text-white text-xl tracking-tighter">ArloFlux <span className="text-purple-500">Gestor</span></h2>
                            <X className="text-slate-400" onClick={() => setIsMobileMenuOpen(false)}/>
                        </div>
                        {visibleTabs.map(tab => {
                            const isActive = tab.exact ? location.pathname === tab.path : location.pathname.startsWith(tab.path);
                            return (
                                <Link 
                                    key={tab.path} to={tab.path}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                >
                                    <tab.icon size={20} />
                                    <span className="font-bold">{tab.label}</span>
                                </Link>
                            );
                        })}
                        <div className="pt-8 border-t border-slate-800 mt-auto">
                            <button onClick={handleExitToModules} className="w-full flex items-center gap-3 p-3 text-slate-400 font-bold"><Grid size={20}/> Todos os Módulos</button>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-500 font-bold"><LogOut size={20}/> Sair do Sistema</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
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
                        <Route path="*" element={<Navigate to="" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};