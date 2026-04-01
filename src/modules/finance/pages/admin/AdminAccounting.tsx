import React, { useState, useCallback, useEffect } from 'react';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useFinance } from '@/core/context/FinanceContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { supabase } from '@/core/api/supabaseClient';
import { DREReportPrint } from '@/modules/finance/components/reports/DREReportPrint';
import { ManagerInsights } from './ManagerInsights';
import { 
    Loader2, RefreshCcw, Printer, Settings, 
    TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, 
    Calendar, AlertCircle, FileText, Download, FileSpreadsheet,
    ArrowUpCircle, ArrowDownCircle, BarChart3
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { formatCurrency } from '@/core/utils/currency';

export const AdminAccounting: React.FC = () => {
  const { state: restState } = useRestaurant();
  const { showAlert } = useUI();
  
  const [dateStart, setDateStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  const [config, setConfig] = useState({
      accountingMethod: 'COMPETENCE' as 'COMPETENCE' | 'CASH',
      taxRate: restState.businessInfo.taxPercentage ?? 6.0,
      fees: {
          credit: restState.businessInfo.paymentMethods?.find(p => p.type === 'CREDIT')?.feePercentage ?? 3.99,
          debit: restState.businessInfo.paymentMethods?.find(p => p.type === 'DEBIT')?.feePercentage ?? 1.99,
          pix: restState.businessInfo.paymentMethods?.find(p => p.type === 'PIX')?.feePercentage ?? 0.0,
          voucher: restState.businessInfo.paymentMethods?.find(p => p.type === 'MEAL_VOUCHER')?.feePercentage ?? 4.5
      }
  });

  const [data, setData] = useState<any>({
      grossRevenue: 0, saloonSales: 0, posSales: 0, 
      taxes: 0, cardFees: 0, netRevenue: 0,
      cmv: 0, grossProfit: 0, 
      expenses: { fixed: 0, variable: 0, personnel: 0, financial: 0, total: 0, byCategory: [] as any[] },
      ebitda: 0, netIncome: 0, losses: 0, hasData: false
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getAV = (value: number) => {
      if (data.grossRevenue === 0) return '0.0%';
      return `${((value / data.grossRevenue) * 100).toFixed(1)}%`;
  };

  const fetchDRE = useCallback(async () => {
      if (!restState.tenantId) return;
      setLoading(true);
      try {
          const start = dateStart + ' 00:00:00';
          const end = dateEnd + ' 23:59:59';
          const [transRes, itemsRes, expsRes, cancelledRes] = await Promise.all([
            supabase.from('transactions').select('*').eq('tenant_id', restState.tenantId).gte('created_at', start).lte('created_at', end).neq('status', 'CANCELLED'),
            supabase.from('order_items').select('quantity, product_cost_price, orders!inner(is_paid, created_at, status)').eq('tenant_id', restState.tenantId).eq('orders.is_paid', true).gte('orders.created_at', start).lte('orders.created_at', end),
            supabase.from('expenses').select('*').eq('tenant_id', restState.tenantId).gte(config.accountingMethod === 'CASH' ? 'paid_date' : 'due_date', start).lte(config.accountingMethod === 'CASH' ? 'paid_date' : 'due_date', end),
            supabase.from('orders').select('total_amount').eq('tenant_id', restState.tenantId).eq('status', 'CANCELLED').gte('created_at', start).lte('created_at', end)
          ]);

          let grossRev = 0, saloonSales = 0, posSales = 0, fees = 0;
          transRes.data?.forEach((t: any) => {
              const amt = Number(t.amount) || 0;
              grossRev += amt;
              if (t.items_summary?.includes('Mesa')) saloonSales += amt; else posSales += amt;
              let rate = t.method === 'CREDIT' ? config.fees.credit : t.method === 'DEBIT' ? config.fees.debit : 0;
              fees += amt * (rate / 100);
          });

          const cmv = itemsRes.data?.reduce((acc, i) => acc + (Number(i.quantity) * Number(i.product_cost_price)), 0) || 0;
          const taxes = grossRev * (config.taxRate / 100);
          const netRevenue = grossRev - taxes - fees;
          const losses = cancelledRes.data?.reduce((acc, c) => acc + (Number(c.total_amount) || 0), 0) || 0;

          let personnel = 0, fixed = 0, variable = 0, financial = 0;
          const categoryMap: Record<string, number> = {};
          expsRes.data?.forEach((e: any) => {
              const amt = Number(e.amount) || 0;
              categoryMap[e.category] = (categoryMap[e.category] || 0) + amt;
              if (['Pessoal', 'Salário', 'Encargos'].includes(e.category)) personnel += amt;
              else if (['Financeiro', 'Taxas', 'Juros'].includes(e.category)) financial += amt;
              else if (['Fixa', 'Aluguel', 'Sistema'].includes(e.category)) fixed += amt;
              else variable += amt;
          });

          const expensesByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

          setData({
              grossRevenue: grossRev, saloonSales, posSales, taxes, cardFees: fees, netRevenue,
              cmv, grossProfit: netRevenue - cmv,
              expenses: { personnel, fixed, variable, financial, total: personnel + fixed + variable + financial, byCategory: expensesByCategory },
              ebitda: (netRevenue - cmv) - (personnel + fixed + variable),
              netIncome: ((netRevenue - cmv) - (personnel + fixed + variable)) - financial,
              losses, hasData: true
          });
      } catch (err) {
          showAlert({ title: "Erro", message: "Falha ao processar dados.", type: "ERROR" });
      } finally { setLoading(false); }
  }, [restState.tenantId, dateStart, dateEnd, config, showAlert]);

  useEffect(() => { if (restState.tenantId) fetchDRE(); }, [fetchDRE]);

  const chartData = [
    { name: 'Receita Líquida', valor: data.netRevenue, fill: '#3B82F6' },
    { name: 'CMV', valor: data.cmv, fill: '#F59E0B' },
    { name: 'Despesas Op.', valor: data.expenses.total - data.expenses.financial, fill: '#EF4444' },
    { name: 'Lucro Líquido', valor: data.netIncome, fill: '#10B981' },
  ];

  return (
    <div className="p-6 space-y-6 pb-24 animate-fade-in bg-slate-50 min-h-screen">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4 print:hidden">
            <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <BarChart3 className="text-blue-600"/> Inteligência Contábil
                </h2>
                <p className="text-sm text-gray-500 font-medium">Análise visual de performance e resultado</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs font-bold">
                    <Calendar size={14} className="text-slate-400" />
                    <input type="date" className="bg-transparent outline-none" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                    <span className="text-slate-300">até</span>
                    <input type="date" className="bg-transparent outline-none" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                </div>
                <Button variant="outline" onClick={() => window.print()} className="bg-white"><Printer size={18}/></Button>
                <Button onClick={fetchDRE} disabled={loading} className="shadow-lg shadow-blue-200">
                    {loading ? <Loader2 className="animate-spin" /> : <RefreshCcw size={18}/>}
                </Button>
                <Button variant="secondary" onClick={() => setShowConfig(!showConfig)}><Settings size={20}/></Button>
            </div>
        </div>

        {data.hasData && (
            <>
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp size={48} className="text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Líquido</span>
                        <h4 className={`text-2xl font-black mt-1 ${data.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(data.netIncome)}</h4>
                        <div className="mt-2 flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">{getAV(data.netIncome)} da receita</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CMV (Insumos)</span>
                        <h4 className="text-2xl font-black text-orange-500 mt-1">{getAV(data.cmv)}</h4>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3">
                            <div className="bg-orange-500 h-full rounded-full" style={{ width: getAV(data.cmv) }}></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ponto de Equilíbrio</span>
                        <h4 className="text-2xl font-black text-blue-600 mt-1">{formatCurrency((data.expenses.total) / (data.grossProfit / data.grossRevenue || 1))}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold italic">Meta mínima de vendas</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Perdas Totais</span>
                        <h4 className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(data.losses)}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Pedidos cancelados no período</p>
                    </div>
                </div>

                {/* VISUAL CHARTS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Estrutura de Custos (Pie Chart) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                            <PieChartIcon size={16} className="text-purple-500" /> Composição de Gastos
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.expenses.byCategory}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.expenses.byCategory.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comparativo de Margem (Bar Chart) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500" /> Fluxo de Valor
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                                    <YAxis hide />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="valor" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* DETAILED DRE TABLE */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-widest">Demonstrativo de Resultado</h3>
                            <p className="text-xs text-slate-400 font-bold">{restState.businessInfo.name}</p>
                        </div>
                        <div className="text-right border-l border-slate-700 pl-6">
                            <p className="text-[10px] font-bold opacity-50 uppercase">Período</p>
                            <p className="text-sm font-bold font-mono">{dateStart} a {dateEnd}</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-3">
                        <div className="flex justify-between font-bold border-b pb-2 text-slate-800">
                            <span>(+) RECEITA BRUTA TOTAL</span>
                            <div className="text-right">
                                <span>{formatCurrency(data.grossRevenue)}</span>
                                <span className="text-[10px] ml-4 text-slate-400">100%</span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between text-sm text-slate-500 pl-4 italic">
                            <span>(-) Impostos Fiscais ({config.taxRate}%)</span>
                            <span>{formatCurrency(data.taxes)}</span>
                        </div>

                        <div className="flex justify-between font-black bg-slate-50 p-4 rounded-xl border-y border-slate-100 my-4">
                            <span className="text-blue-600">(=) RECEITA LÍQUIDA</span>
                            <div className="text-right">
                                <span className="text-blue-600">{formatCurrency(data.netRevenue)}</span>
                                <span className="text-[10px] ml-4 text-slate-400">{getAV(data.netRevenue)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold text-orange-600 pl-4">
                            <span>(-) CMV (Custo de Mercadoria)</span>
                            <div className="text-right">
                                <span>{formatCurrency(data.cmv)}</span>
                                <span className="text-[10px] ml-4 text-slate-400">{getAV(data.cmv)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-black text-xl pt-6 border-t-4 border-double border-slate-200 mt-6">
                            <span className={data.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                {data.netIncome >= 0 ? 'LUCRO LÍQUIDO FINAL' : 'PREJUÍZO APURADO'}
                            </span>
                            <div className="text-right">
                                <span className={data.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                    {formatCurrency(data.netIncome)}
                                </span>
                                <span className="text-xs ml-4 text-slate-400">{getAV(data.netIncome)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <ManagerInsights data={data} />
            </>
        )}

        {/* PRINTABLE COMPONENT */}
        <div className="hidden print:block fixed inset-0 z-[9999] bg-white w-full h-full">
            <DREReportPrint 
                data={data} 
                dateStart={dateStart} 
                dateEnd={dateEnd} 
                businessInfo={restState.businessInfo} 
                theme={restState.theme} 
                config={config} 
            />
        </div>
    </div>
  );
};