import React, { useMemo } from 'react';
import { BrainCircuit, TrendingUp, Users, ShoppingCart, Zap, ArrowRight } from 'lucide-react';


interface InsightProps { data: any; }

export const ManagerInsights: React.FC<InsightProps> = ({ data }) => {
    const insights = useMemo(() => {
        const list = [];
        const cmvPerc = (data.cmv / data.grossRevenue) * 100;
        if (cmvPerc > 35) {
            list.push({ title: "CMV Crítico", desc: `Custo de insumos em ${cmvPerc.toFixed(1)}% (Ideal < 32%).`, action: "Verifique desperdícios ou reajuste preços.", type: "danger", icon: ShoppingCart });
        }
        const personnelPerc = (data.expenses.personnel / data.grossRevenue) * 100;
        if (personnelPerc > 25) {
            list.push({ title: "Custo de Pessoal Alto", desc: `Folha consome ${personnelPerc.toFixed(1)}% da receita.`, action: "Avalie a escala de folgas.", type: "warning", icon: Users });
        }
        if (data.netIncome > 0) {
            list.push({ title: "Operação Lucrativa", desc: `Margem líquida de ${((data.netIncome / data.grossRevenue) * 100).toFixed(1)}%.`, action: "Excelente momento para investir.", type: "success", icon: TrendingUp });
        }
        return list;
    }, [data]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="md:col-span-2 flex items-center gap-2 mb-2">
                <BrainCircuit className="text-purple-600" size={24} />
                <h3 className="text-lg font-black text-slate-800">Insights da IA Flux</h3>
            </div>
            {insights.map((item, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border-l-4 flex gap-4 bg-white shadow-sm border-${item.type === 'danger' ? 'rose' : item.type === 'warning' ? 'amber' : 'emerald'}-500`}>
                    <div className="p-3 bg-slate-50 rounded-xl"><item.icon size={24} /></div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase italic">Sugestão: {item.action}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};