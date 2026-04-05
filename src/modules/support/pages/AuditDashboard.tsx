import React, { useEffect, useState, useCallback, useMemo } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { supabase } from '@/core/api/supabaseClient';
import { 
    Shield, Search, Printer, Calendar, 
    Activity, Grid, LogOut, FileText,
    Package, DollarSign, Users, Settings, ChefHat, Store,
    Eye, Menu, X, ChevronRight, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import { GlobalLoading } from '@/modules/common/components/GlobalLoading';
import { Modal } from '@/modules/common/components/Modal';
import { Role } from '@/types';

interface AuditLogEntry {
    id: string;
    created_at: string;
    user_name: string;
    module: string;
    action: string;
    details: any;
}

// Estilos CSS injetados dinamicamente
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('audit-menu-styles')) {
    const style = document.createElement('style');
    style.id = 'audit-menu-styles';
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

export const AuditDashboard: React.FC = () => {
    const { state: restState } = useRestaurant();
    const { state: authState, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    // Injetar estilos ao montar componente
    useEffect(() => {
        injectStyles();
    }, []);

    // Definição dos itens do menu
    const menuItems = [
        { 
            path: '/audit', 
            label: 'AUDITORIA', 
            icon: Shield, 
            exact: true,
            featureKeys: ['audit_logs'],
            description: 'Logs do sistema'
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

    // ✨ Filtro inteligente: Só mostra a aba se o módulo estiver no plano (ou se for a aba "Todos")
    const activeModuleTabs = useMemo(() => {
        const allModules = [
            { id: 'ALL', label: 'Todos', icon: Activity },
            { id: 'INVENTORY', label: 'Estoque', icon: Package },
            { id: 'FINANCE', label: 'Financeiro', icon: DollarSign },
            { id: 'HR', label: 'RH', icon: Users },
            { id: 'RESTAURANT', label: 'Restaurante', icon: ChefHat },
            { id: 'COMMERCE', label: 'Varejo', icon: Store },
            { id: 'CONFIG', label: 'Configurações', icon: Settings },
        ];

        const allowed = restState.allowedModules || [];

        return allModules.filter(mod => 
            mod.id === 'ALL' || allowed.includes(mod.id as any)
        );
    }, [restState.allowedModules]);

    useEffect(() => {
        fetchLogs();
    }, [restState.tenantId]);

    const fetchLogs = async () => {
        if (!restState.tenantId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('tenant_id', restState.tenantId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error("Erro ao buscar logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesTab = activeTab === 'ALL' || log.module === activeTab;
            const matchesSearch = log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 log.action?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDate = !dateFilter || log.created_at.startsWith(dateFilter);
            return matchesTab && matchesSearch && matchesDate;
        });
    }, [logs, activeTab, searchTerm, dateFilter]);

    const handlePrint = () => {
        window.print();
    };

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
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
            
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
            <header className="bg-transparent relative z-30">
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
                                    <p className="text-xs text-slate-300">Auditoria</p>
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
            {!menuOpen && (
                <div className="lg:hidden bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
                    <FileText size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">LOGS DE AUDITORIA</span>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col p-1 md:p-2">
                <div className="flex-1 flex flex-col gap-4  p-4">
                    
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
                        <div className="flex flex-wrap gap-2">
                            {/* Renderizando apenas as abas ativas do plano */}
                            {activeModuleTabs.map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => setActiveTab(mod.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        activeTab === mod.id 
                                        ? 'bg-slate-900 text-white shadow-lg' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    <mod.icon size={14} />
                                    {mod.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar usuário ou ação..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input 
                                    type="date" 
                                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                                    value={dateFilter}
                                    onChange={e => setDateFilter(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handlePrint}
                                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                                title="Imprimir"
                            >
                                <Printer size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data & Hora</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Módulo</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ação</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <AnimatePresence mode="popLayout">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <GlobalLoading message="Carregando logs..." />
                                                </td>
                                            </tr>
                                        ) : filteredLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <FileText className="text-slate-200" size={48} />
                                                        <p className="text-slate-400 font-bold text-sm">Nenhum log encontrado para os filtros aplicados.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLogs.map((log) => (
                                                <motion.tr 
                                                    key={log.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="hover:bg-slate-50 transition-colors group"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700">
                                                                {new Date(log.created_at).toLocaleDateString('pt-BR')}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                                                                {log.user_name?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-600">{log.user_name || 'Sistema'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                                                            {log.module}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-slate-700">{log.action}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="max-w-xs truncate text-xs text-slate-400 italic flex-1" title={JSON.stringify(log.details)}>
                                                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                                            </div>
                                                            <button
                                                                onClick={() => setSelectedLog(log)}
                                                                className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors"
                                                                title="Ver Detalhes"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(`
                @media print {
                    @page { margin: 2cm; }
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 10px; }
                    .flex-1 { overflow: visible !important; }
                    main { padding: 0 !important; }
                    .rounded-3xl { border-radius: 0 !important; }
                    .shadow-xl { box-shadow: none !important; }
                }
            `)}} />

            {/* Modal de Detalhes do Log */}
            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Detalhes do Log de Auditoria"
                variant="dialog"
                maxWidth="2xl"
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data & Hora</p>
                                <p className="text-sm font-medium text-slate-800">
                                    {new Date(selectedLog.created_at).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Usuário</p>
                                <p className="text-sm font-medium text-slate-800">
                                    {selectedLog.user_name || 'Sistema'}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Módulo</p>
                                <p className="text-sm font-medium text-slate-800">
                                    {selectedLog.module}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ação</p>
                                <p className="text-sm font-medium text-slate-800">
                                    {selectedLog.action}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Evento (JSON)</p>
                            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};