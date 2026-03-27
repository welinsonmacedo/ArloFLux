import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useFinance } from '@/core/context/FinanceContext';
import { useStaff } from '@/core/context/StaffContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { Modal } from '@/modules/common/components/Modal'; 
import { ExpenseFormModal } from '@/modules/common/components/modals/ExpenseFormModal';
import { CashBleedModal } from '@/modules/common/components/modals/CashBleedModal';
import { supabase } from '@/core/api/supabaseClient';
import { Expense, CashSession, Transaction, CashMovement } from '@/types';
import { 
    Plus, CheckSquare, Trash2, Wallet, Banknote, ArrowDown, Repeat, 
    Archive, User, ChevronRight, LayoutDashboard, List, DollarSign, 
    Edit, Lock, Settings, TrendingUp, TrendingDown, Calendar, 
    AlertCircle, Filter, Download, Printer, X, ChevronDown,
    PieChart, CreditCard, Home, Briefcase, ShoppingBag, Coffee
} from 'lucide-react';
import { GlobalLoading } from '@/modules/common/components/GlobalLoading';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, 
    Pie, Cell, Legend
} from 'recharts';

export const AdminFinance: React.FC = () => {
    const { state: restState } = useRestaurant();
    const { state: finState, updateExpense, deleteExpense } = useFinance();
    const { state: staffState, saveLegalSettings } = useStaff();
    const { showAlert } = useUI();
    
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SESSIONS' | 'EXPENSES'>('OVERVIEW');
    const [expenseFilter, setExpenseFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
    const [expenseCategory, setExpenseCategory] = useState<string>('ALL');
    
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isBleedModalOpen, setIsBleedModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    
    const [payModal, setPayModal] = useState<{ isOpen: boolean, expense: Expense | null }>({ isOpen: false, expense: null });
    const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'CASH'>('BANK');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, expenseId: string | null }>({ isOpen: false, expenseId: null });
    const [adminPin, setAdminPin] = useState('');
    
    const [sessionsHistory, setSessionsHistory] = useState<CashSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);
    const [sessionDetails, setSessionDetails] = useState<{ transactions: Transaction[], movements: CashMovement[] } | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [sessionFilter, setSessionFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

    // Fetch Sessions History
    useEffect(() => {
        if (activeTab === 'SESSIONS' && restState.tenantId) {
            const fetchSessions = async () => {
                setLoadingSessions(true);
                const { data } = await supabase
                    .from('cash_sessions')
                    .select('*')
                    .eq('tenant_id', restState.tenantId)
                    .order('opened_at', { ascending: false })
                    .limit(50);

                if (data) {
                    const mappedSessions = data.map((s: any) => ({
                        id: s.id,
                        openedAt: new Date(s.opened_at),
                        initialAmount: s.initial_amount,
                        status: s.status,
                        operatorName: s.operator_name,
                        closedAt: s.closed_at ? new Date(s.closed_at) : undefined,
                        finalAmount: s.final_amount
                    }));
                    setSessionsHistory(mappedSessions);
                }
                setLoadingSessions(false);
            };
            fetchSessions();
        }
    }, [activeTab, restState.tenantId]);

    // Handle View Session Details
    const handleViewSession = useCallback(async (session: CashSession) => {
        setSelectedSession(session);
        setSessionDetails(null);
        setLoadingDetails(true);

        try {
            const startTime = session.openedAt.toISOString();
            const endTime = session.closedAt ? session.closedAt.toISOString() : new Date().toISOString();

            const { data: transData } = await supabase
                .from('transactions')
                .select('*')
                .eq('tenant_id', restState.tenantId)
                .gte('created_at', startTime)
                .lte('created_at', endTime)
                .order('created_at', { ascending: false });

            const mappedTrans = (transData || []).map((t: any) => ({
                id: t.id,
                tableId: t.table_id || '',
                tableNumber: t.table_number || 0,
                amount: t.amount,
                method: t.method,
                timestamp: new Date(t.created_at),
                itemsSummary: t.items_summary || '',
                cashierName: t.cashier_name || '',
                status: t.status || 'COMPLETED'
            }));

            const { data: moveData } = await supabase
                .from('cash_movements')
                .select('*')
                .eq('session_id', session.id)
                .order('created_at', { ascending: false });
                
            const mappedMoves = (moveData || []).map((m: any) => ({
                id: m.id,
                sessionId: m.session_id,
                type: m.type,
                amount: m.amount,
                reason: m.reason,
                timestamp: new Date(m.created_at),
                userName: m.user_name
            }));

            setSessionDetails({
                transactions: mappedTrans,
                movements: mappedMoves
            });
        } catch (error) {
            console.error("Erro ao buscar detalhes da sessão:", error);
            showAlert({ title: "Erro", message: "Não foi possível carregar os detalhes.", type: "ERROR" });
        } finally {
            setLoadingDetails(false);
        }
    }, [restState.tenantId, showAlert]);

    // Filtered Sessions
    const filteredSessions = useMemo(() => {
        if (sessionFilter === 'ALL') return sessionsHistory;
        return sessionsHistory.filter(s => 
            sessionFilter === 'OPEN' ? s.status === 'OPEN' : s.status === 'CLOSED'
        );
    }, [sessionsHistory, sessionFilter]);

    // Calculations (Overview Tab)
    const activeTransactions = useMemo(() => 
        finState.transactions.filter(t => t.status !== 'CANCELLED'),
        [finState.transactions]
    );

    const totalRevenue = useMemo(() => 
        activeTransactions.reduce((acc, t) => acc + t.amount, 0),
        [activeTransactions]
    );

    const totalExpensesPaid = useMemo(() => 
        finState.expenses.filter(e => e.isPaid).reduce((acc, e) => acc + e.amount, 0),
        [finState.expenses]
    );

    const absoluteBalance = totalRevenue - totalExpensesPaid;

    const activeSessionInitial = finState.activeCashSession?.initialAmount || 0;
    
    const sessionCashSales = useMemo(() => 
        activeTransactions
            .filter(t => t.method === 'CASH' && finState.activeCashSession && new Date(t.timestamp) >= finState.activeCashSession.openedAt)
            .reduce((acc, t) => acc + t.amount, 0),
        [activeTransactions, finState.activeCashSession]
    );
        
    const sessionBleeds = useMemo(() => 
        finState.cashMovements
            .filter(m => m.type === 'BLEED' && finState.activeCashSession && m.sessionId === finState.activeCashSession.id)
            .reduce((acc, m) => acc + m.amount, 0),
        [finState.cashMovements, finState.activeCashSession]
    );
    
    const sessionSupplies = useMemo(() => 
        finState.cashMovements
            .filter(m => m.type === 'SUPPLY' && finState.activeCashSession && m.sessionId === finState.activeCashSession.id)
            .reduce((acc, m) => acc + m.amount, 0),
        [finState.cashMovements, finState.activeCashSession]
    );
    
    const sessionCashExpenses = useMemo(() => 
        finState.expenses
            .filter(e => e.isPaid && e.paymentMethod === 'CASH' && finState.activeCashSession && e.paidDate && new Date(e.paidDate) >= finState.activeCashSession.openedAt)
            .reduce((acc, e) => acc + e.amount, 0),
        [finState.expenses, finState.activeCashSession]
    );

    const drawerBalance = finState.activeCashSession 
        ? (activeSessionInitial + sessionCashSales + sessionSupplies - sessionBleeds - sessionCashExpenses)
        : 0;

    const bankBalance = absoluteBalance - drawerBalance;
    const totalExpectedBalance = absoluteBalance;

    const currentMonthExpenses = useMemo(() => 
        finState.expenses
            .filter(e => new Date(e.dueDate).getMonth() === new Date().getMonth())
            .reduce((acc, e) => acc + e.amount, 0),
        [finState.expenses]
    );

    const pendingExpenses = useMemo(() => 
        finState.expenses.filter(e => !e.isPaid).reduce((acc, e) => acc + e.amount, 0),
        [finState.expenses]
    );

    // Expenses filtering
    const filteredExpenses = useMemo(() => {
        let filtered = finState.expenses;
        
        if (expenseFilter === 'PENDING') {
            filtered = filtered.filter(e => !e.isPaid);
        } else if (expenseFilter === 'PAID') {
            filtered = filtered.filter(e => e.isPaid);
        }
        
        if (expenseCategory !== 'ALL') {
            filtered = filtered.filter(e => e.category === expenseCategory);
        }
        
        return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [finState.expenses, expenseFilter, expenseCategory]);

    // Chart data
    const weeklySales = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        }).reverse();
        
        return last7Days.map(day => {
            const daySales = activeTransactions
                .filter(t => new Date(t.timestamp).toLocaleDateString('pt-BR', { weekday: 'short' }) === day)
                .reduce((acc, t) => acc + t.amount, 0);
            return { day, sales: daySales };
        });
    }, [activeTransactions]);

    const expensesByCategory = useMemo(() => {
        const categories: Record<string, number> = {};
        finState.expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount;
        });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [finState.expenses]);

    const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec489a'];

    // Handlers
    const openPayModal = useCallback((expense: Expense) => {
        setPayModal({ isOpen: true, expense });
        setPaymentMethod(expense.paymentMethod || 'BANK');
        setPaymentDate(new Date().toISOString().split('T')[0]);
    }, []);

    const handleConfirmPay = useCallback(async () => {
        if (!payModal.expense) return;
        try {
            await updateExpense({
                ...payModal.expense,
                isPaid: true,
                paidDate: new Date(paymentDate),
                paymentMethod: paymentMethod
            });
            showAlert({ title: "Sucesso", message: "Pagamento registrado.", type: 'SUCCESS' });
            setPayModal({ isOpen: false, expense: null });
        } catch (error) {
            showAlert({ title: "Erro", message: "Erro ao registrar pagamento.", type: 'ERROR' });
        }
    }, [payModal.expense, paymentDate, paymentMethod, updateExpense, showAlert]);

    const openDeleteModal = useCallback((id: string) => {
        setDeleteModal({ isOpen: true, expenseId: id });
        setAdminPin('');
    }, []);

    const handleConfirmDelete = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deleteModal.expenseId) return;

        try {
            await deleteExpense(deleteModal.expenseId, adminPin);
            setDeleteModal({ isOpen: false, expenseId: null });
            setAdminPin('');
            showAlert({ title: "Excluído", message: "Despesa removida com sucesso.", type: 'SUCCESS' });
        } catch (error: any) {
            showAlert({ title: "Erro", message: error.message || "Erro ao excluir despesa.", type: 'ERROR' });
        }
    }, [deleteModal.expenseId, adminPin, deleteExpense, showAlert]);

    const handleEditExpense = useCallback((expense: Expense) => {
        setEditingExpense(expense);
        setIsExpenseModalOpen(true);
    }, []);

    const StatBox = useCallback(({ title, value, icon: Icon, color, trend, subtitle }: any) => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '50').replace('700', '50')} group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className={color} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-black text-gray-800">{value}</p>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
        </div>
    ), []);

    const TabButton = useCallback(({ id, label, icon: Icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`px-5 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === id 
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50' 
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    ), [activeTab]);

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                <DollarSign size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Fluxo de Caixa</h2>
                                <p className="text-sm text-gray-500">Controle operacional do dinheiro e despesas</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsSettingsModalOpen(true)} 
                            className="flex items-center gap-2"
                        >
                            <Settings size={16} />
                            Configurações
                        </Button>
                        {activeTab === 'EXPENSES' && (
                            <Button onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}>
                                <Plus size={16} className="mr-2" />
                                Nova Despesa
                            </Button>
                        )}
                        {activeTab === 'OVERVIEW' && finState.activeCashSession && (
                            <Button 
                                variant="outline"
                                onClick={() => setIsBleedModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <ArrowDown size={16} />
                                Sangria
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto gap-1 mt-6 border-b">
                    <TabButton id="OVERVIEW" label="Visão Geral" icon={LayoutDashboard} />
                    <TabButton id="SESSIONS" label="Histórico de Caixas" icon={Archive} />
                    <TabButton id="EXPENSES" label="Despesas" icon={List} />
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                
                {/* OVERVIEW TAB */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatBox 
                                title="Valor Total" 
                                value={`R$ ${totalExpectedBalance.toFixed(2)}`} 
                                icon={DollarSign} 
                                color="text-emerald-600"
                                subtitle="Soma de Cofre/Banco + Dinheiro"
                            />
                            <StatBox 
                                title="Saldo Financeiro" 
                                value={`R$ ${bankBalance.toFixed(2)}`} 
                                icon={Banknote} 
                                color="text-blue-600"
                                subtitle="Cofre e Contas Bancárias"
                            />
                            <StatBox 
                                title="Dinheiro em Caixa" 
                                value={`R$ ${drawerBalance.toFixed(2)}`} 
                                icon={Wallet} 
                                color="text-green-600"
                                subtitle={finState.activeCashSession ? "Gaveta do Caixa Aberto" : "Caixa Fechado"}
                            />
                            <StatBox 
                                title="Despesas do Mês" 
                                value={`R$ ${currentMonthExpenses.toFixed(2)}`} 
                                icon={ArrowDown} 
                                color="text-red-600"
                                subtitle={`${pendingExpenses.toFixed(2)} pendentes`}
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Weekly Sales Chart */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800">Vendas da Semana</h3>
                                        <p className="text-xs text-gray-500 mt-1">Evolução diária de vendas</p>
                                    </div>
                                    <TrendingUp size={18} className="text-gray-400" />
                                </div>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={weeklySales}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                                            <YAxis stroke="#94a3b8" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                                formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                                            />
                                            <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Expenses by Category Chart */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800">Despesas por Categoria</h3>
                                        <p className="text-xs text-gray-500 mt-1">Distribuição das despesas</p>
                                    </div>
                                    <PieChart size={18} className="text-gray-400" />
                                </div>
                                <div className="h-64">
                                    {expensesByCategory.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={expensesByCategory}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {expensesByCategory.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                                />
                                                <Legend />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-gray-400 text-sm">Nenhuma despesa registrada</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Active Cash Session Info */}
                        {finState.activeCashSession && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-green-100 rounded-xl">
                                        <Wallet size={20} className="text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap justify-between items-start gap-4">
                                            <div>
                                                <h4 className="font-bold text-green-800">Caixa Ativo</h4>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Aberto por {finState.activeCashSession.operatorName} em {finState.activeCashSession.openedAt.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-green-600">Fundo Inicial</p>
                                                <p className="text-xl font-bold text-green-800">R$ {activeSessionInitial.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-green-200">
                                            <div>
                                                <p className="text-[10px] text-green-600 uppercase">Vendas em Dinheiro</p>
                                                <p className="font-bold text-green-800">R$ {sessionCashSales.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-green-600 uppercase">Suprimentos</p>
                                                <p className="font-bold text-green-800">+ R$ {sessionSupplies.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-green-600 uppercase">Sangrias</p>
                                                <p className="font-bold text-red-600">- R$ {sessionBleeds.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-green-600 uppercase">Despesas em Caixa</p>
                                                <p className="font-bold text-red-600">- R$ {sessionCashExpenses.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SESSIONS TAB */}
                {activeTab === 'SESSIONS' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Filter Bar */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter size={16} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-600">Filtrar por status:</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setSessionFilter('ALL')}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                sessionFilter === 'ALL' 
                                                    ? 'bg-blue-500 text-white' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setSessionFilter('OPEN')}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                sessionFilter === 'OPEN' 
                                                    ? 'bg-green-500 text-white' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            Abertos
                                        </button>
                                        <button
                                            onClick={() => setSessionFilter('CLOSED')}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                sessionFilter === 'CLOSED' 
                                                    ? 'bg-gray-500 text-white' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            Fechados
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {filteredSessions.length} {filteredSessions.length === 1 ? 'sessão encontrada' : 'sessões encontradas'}
                                </div>
                            </div>
                        </div>

                        {/* Sessions Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b text-xs font-black text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Abertura</th>
                                            <th className="p-4">Fechamento</th>
                                            <th className="p-4">Operador</th>
                                            <th className="p-4 text-right">Fundo Inicial</th>
                                            <th className="p-4 text-right">Valor Final</th>
                                            <th className="p-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {loadingSessions ? (
                                            <tr><td colSpan={7} className="p-8 text-center"><GlobalLoading message="Carregando histórico..." /></td></tr>
                                        ) : filteredSessions.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhum caixa registrado.</td></tr>
                                        ) : (
                                            filteredSessions.map(session => (
                                                <tr 
                                                    key={session.id} 
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => handleViewSession(session)}
                                                >
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                                                            session.status === 'OPEN' 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${session.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                            {session.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-700 font-medium">
                                                        {session.openedAt.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-gray-500">
                                                        {session.closedAt ? session.closedAt.toLocaleString() : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <User size={14} className="text-gray-400" />
                                                            <span className="font-medium text-gray-700">{session.operatorName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-gray-600">
                                                        R$ {session.initialAmount.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-gray-800">
                                                        {session.finalAmount !== undefined && session.finalAmount !== null 
                                                            ? `R$ ${session.finalAmount.toFixed(2)}` 
                                                            : '-'
                                                        }
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <ChevronRight size={16} className="text-gray-400" />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* EXPENSES TAB */}
                {activeTab === 'EXPENSES' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Filter Bar */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} className="text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600">Status:</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setExpenseFilter('ALL')}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                    expenseFilter === 'ALL' 
                                                        ? 'bg-gray-500 text-white' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => setExpenseFilter('PENDING')}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                    expenseFilter === 'PENDING' 
                                                        ? 'bg-yellow-500 text-white' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                Pendentes
                                            </button>
                                            <button
                                                onClick={() => setExpenseFilter('PAID')}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                    expenseFilter === 'PAID' 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                Pagas
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={16} className="text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600">Categoria:</span>
                                        <select
                                            value={expenseCategory}
                                            onChange={e => setExpenseCategory(e.target.value)}
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:border-blue-500 outline-none"
                                        >
                                            <option value="ALL">Todas</option>
                                            <option value="Aluguel">Aluguel</option>
                                            <option value="Funcionários">Funcionários</option>
                                            <option value="Insumos">Insumos</option>
                                            <option value="Utilidades">Utilidades</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 uppercase">Total Pendente</p>
                                        <p className="text-sm font-bold text-yellow-600">R$ {pendingExpenses.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expenses Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b text-xs font-black text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Vencimento</th>
                                            <th className="p-4">Descrição</th>
                                            <th className="p-4">Categoria</th>
                                            <th className="p-4">Origem</th>
                                            <th className="p-4 text-right">Valor</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {filteredExpenses.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhuma despesa encontrada.</td></tr>
                                        ) : (
                                            filteredExpenses.map(expense => {
                                                const isOverdue = !expense.isPaid && new Date(expense.dueDate) < new Date();
                                                return (
                                                    <tr key={expense.id} className={`hover:bg-gray-50 transition-colors ${expense.isPaid ? 'bg-gray-50/30' : ''}`}>
                                                        <td className="p-4">
                                                            <div>
                                                                <span className={`font-bold text-sm ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                                                    {new Date(expense.dueDate).toLocaleDateString()}
                                                                </span>
                                                                {expense.isRecurring && (
                                                                    <span className="flex items-center gap-1 text-[9px] text-blue-600 font-bold mt-0.5">
                                                                        <Repeat size={8} /> Recorrente
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="font-medium text-gray-800">{expense.description}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-xs text-gray-500">{expense.category}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                                                expense.paymentMethod === 'CASH' 
                                                                    ? 'bg-green-100 text-green-700' 
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {expense.paymentMethod === 'CASH' ? 'Dinheiro' : 'Banco'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right font-black text-gray-800">
                                                            R$ {expense.amount.toFixed(2)}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {expense.isPaid ? (
                                                                <div className="flex flex-col items-center">
                                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Pago</span>
                                                                    <span className="text-[9px] text-gray-400 mt-0.5">
                                                                        {expense.paidDate ? new Date(expense.paidDate).toLocaleDateString() : '-'}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                    isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                    {isOverdue && <AlertCircle size={10} />}
                                                                    {isOverdue ? 'Atrasada' : 'Pendente'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {!expense.isPaid && (
                                                                    <>
                                                                        <button 
                                                                            onClick={() => handleEditExpense(expense)} 
                                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                            title="Editar"
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => openPayModal(expense)} 
                                                                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                                                            title="Dar Baixa"
                                                                        >
                                                                            <CheckSquare size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button 
                                                                    onClick={() => openDeleteModal(expense.id)} 
                                                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            
            {/* Payment Confirmation Modal */}
            <Modal isOpen={payModal.isOpen} onClose={() => setPayModal({ isOpen: false, expense: null })} title="Confirmar Pagamento" variant="dialog" maxWidth="sm">
                <div className="space-y-5">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">Despesa selecionada</p>
                        <p className="font-bold text-gray-800">{payModal.expense?.description}</p>
                        <p className="text-2xl font-black text-blue-600 mt-2">R$ {payModal.expense?.amount.toFixed(2)}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-2 text-gray-700">Origem do Pagamento</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('BANK')}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                    paymentMethod === 'BANK' 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                            >
                                <CreditCard size={18} />
                                <span className="text-sm font-medium">Banco</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('CASH')}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                    paymentMethod === 'CASH' 
                                        ? 'border-green-500 bg-green-50 text-green-700' 
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                            >
                                <Wallet size={18} />
                                <span className="text-sm font-medium">Dinheiro</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-2 text-gray-700">Data do Pagamento</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                            value={paymentDate} 
                            onChange={e => setPaymentDate(e.target.value)} 
                        />
                    </div>

                    <Button onClick={handleConfirmPay} className="w-full py-3 font-bold">Confirmar Baixa</Button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, expenseId: null })} title="Excluir Despesa" variant="dialog" maxWidth="sm">
                <form onSubmit={handleConfirmDelete} className="space-y-5">
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex items-start gap-3">
                        <Lock size={18} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-red-800">Ação irreversível</p>
                            <p className="text-xs text-red-600 mt-1">Esta ação não pode ser desfeita. Insira a senha mestra para continuar.</p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold mb-2 text-gray-700">Senha Mestra (Admin)</label>
                        <input 
                            type="password" 
                            autoFocus 
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center tracking-[0.3em] font-mono text-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all" 
                            placeholder="****" 
                            value={adminPin} 
                            onChange={e => setAdminPin(e.target.value)} 
                            maxLength={4}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={() => setDeleteModal({ isOpen: false, expenseId: null })} className="flex-1">Cancelar</Button>
                        <Button type="submit" variant="danger" className="flex-1">Confirmar Exclusão</Button>
                    </div>
                </form>
            </Modal>

            {/* Session Details Modal */}
            <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} title="Detalhes da Sessão" variant="dialog" maxWidth="lg">
                <div className="h-full flex flex-col max-h-[80vh]">
                    {loadingDetails ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-5 overflow-y-auto custom-scrollbar pr-1">
                            {/* Session Summary */}
                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Abertura</p>
                                        <p className="font-bold text-gray-800">{selectedSession?.openedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        <p className="text-[9px] text-gray-400">{selectedSession?.openedAt.toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Fechamento</p>
                                        <p className="font-bold text-gray-800">
                                            {selectedSession?.closedAt ? selectedSession.closedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Em Aberto'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Fundo Inicial</p>
                                        <p className="font-bold text-emerald-600">R$ {selectedSession?.initialAmount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Valor Final</p>
                                        <p className="font-bold text-blue-600">
                                            {selectedSession?.finalAmount ? `R$ ${selectedSession.finalAmount.toFixed(2)}` : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Operations Timeline */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Clock size={16}  />
                                    Extrato de Operações
                                </h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {[...(sessionDetails?.transactions || []), ...(sessionDetails?.movements || [])]
                                        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                        .map((item: any) => {
                                            const isSale = item.itemsSummary !== undefined;
                                            const isBleed = item.type === 'BLEED';
                                            return (
                                                <div key={item.id} className={`flex justify-between items-center p-3 rounded-xl border-l-4 ${
                                                    isSale ? 'bg-white border-green-500' : 
                                                    isBleed ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'
                                                } shadow-sm`}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            {isSale ? <ShoppingBag size={12} className="text-green-600" /> : 
                                                             isBleed ? <ArrowDown size={12} className="text-red-600" /> : 
                                                             <TrendingUp size={12} className="text-blue-600" />}
                                                            <p className="text-xs font-bold text-gray-800">
                                                                {isSale ? 'Venda' : (isBleed ? 'Sangria' : 'Suprimento')}
                                                            </p>
                                                            <span className="text-[10px] text-gray-400">
                                                                {new Date(item.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            {isSale 
                                                                ? `${item.itemsSummary || 'Itens'} - ${item.method}` 
                                                                : item.reason
                                                            }
                                                        </p>
                                                    </div>
                                                    <span className={`font-mono font-bold text-sm ${isBleed ? 'text-red-600' : 'text-green-600'}`}>
                                                        {isBleed ? '-' : '+'} R$ {item.amount.toFixed(2)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    {(!sessionDetails?.transactions?.length && !sessionDetails?.movements?.length) && (
                                        <p className="text-center py-6 text-gray-400 italic text-sm">Nenhuma operação registrada nesta sessão.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Global Modals */}
            <ExpenseFormModal 
                isOpen={isExpenseModalOpen} 
                onClose={() => setIsExpenseModalOpen(false)} 
                expenseToEdit={editingExpense} 
            />

            <CashBleedModal 
                isOpen={isBleedModalOpen} 
                onClose={() => setIsBleedModalOpen(false)}
                userRole="Admin" 
            />

            {/* Settings Modal */}
            <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Configurações Financeiras" variant="dialog" maxWidth="md">
                <div className="space-y-6">
                    {restState.allowedModules?.includes('FINANCE') && (
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                <User size={18} /> Integração com RH
                            </h4>
                            <p className="text-sm text-blue-600 mb-4">
                                Configure como o módulo financeiro interage com a folha de pagamento.
                            </p>
                            
                            <div className="bg-white rounded-xl p-4 border border-blue-100 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Lançar Folha como Despesa</p>
                                    <p className="text-xs text-gray-500 mt-1">Ao fechar uma folha no RH, criar automaticamente uma despesa a pagar.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${staffState.legalSettings?.integrateFinance ? 'text-green-600' : 'text-gray-400'}`}>
                                        {staffState.legalSettings?.integrateFinance ? 'ATIVADO' : 'DESATIVADO'}
                                    </span>
                                    <button 
                                        onClick={() => saveLegalSettings({ integrateFinance: !staffState.legalSettings?.integrateFinance })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${staffState.legalSettings?.integrateFinance ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${staffState.legalSettings?.integrateFinance ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end">
                        <Button onClick={() => setIsSettingsModalOpen(false)}>Fechar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Helper component for Clock icon
const Clock = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);