// src/modules/staff/pages/admin/SendToPayrollTab.tsx
import React, { useState } from 'react';
import { useStaff } from '@/core/context/StaffContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { Send, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export const SendToPayrollTab: React.FC = () => {
    const { state: staffState, exportPointsToPayroll } = useStaff();
    const { showAlert, showConfirm } = useUI();
    const [month, setMonth] = useState(new Date().getMonth().toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);

    // LOGICA CRUCIAL: Só consideramos pendências de quem é OBRIGADO a bater ponto
    const hasPending = staffState.timeEntries?.some(e => {
        const user = staffState.users.find(u => u.id === e.staffId);
        
        // Se o utilizador é isento (cargo de confiança), ignoramos qualquer "falta" ou pendência dele
        if (user?.requires_time_tracking === false) return false;

        return (e.status === 'PENDING' || e.status === 'NEEDS_CORRECTION') && 
               new Date(e.entryDate).getMonth().toString() === month &&
               new Date(e.entryDate).getFullYear().toString() === year;
    });

    const handleExport = async () => {
        if (hasPending) {
            return showAlert({ 
                title: "Existem Pendências", 
                message: "Atenção: Há colaboradores com registros incompletos ou não tratados. Resolva as divergências antes de exportar.", 
                type: "WARNING" 
            });
        }

        showConfirm({
            title: "Fechar Período de Ponto?",
            message: "Isto enviará os totalizadores para a Folha. Cargos de confiança serão exportados com variância zero (0.00h).",
            confirmText: "Consolidar e Enviar",
            onConfirm: async () => {
                setLoading(true);
                try {
                    await exportPointsToPayroll(parseInt(month), parseInt(year));
                    showAlert({ title: "Sucesso", message: "Dados enviados para a Folha com sucesso!", type: "SUCCESS" });
                } catch (error: any) {
                    showAlert({ title: "Erro", message: "Erro ao exportar: " + error.message, type: "ERROR" });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-3xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Exportar para Folha de Pagamento</h3>
            <p className="text-sm text-gray-500 mb-8">Esta acção consolida as horas extras e faltas para o cálculo do salário.</p>

            <div className="flex gap-4 mb-10">
                <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Mês</label>
                    <select className="w-full border-2 p-3 rounded-xl bg-slate-50 font-bold" value={month} onChange={e => setMonth(e.target.value)}>
                        {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="w-32">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Ano</label>
                    <select className="w-full border-2 p-3 rounded-xl bg-slate-50 font-bold" value={year} onChange={e => setYear(e.target.value)}>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3 mb-10">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Resumo de Colaboradores</h4>
                {staffState.users.map(u => {
                    const isExempt = u.requires_time_tracking === false;
                    return (
                        <div key={u.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                {isExempt ? <Shield size={16} className="text-blue-500"/> : <CheckCircle2 size={16} className="text-slate-300"/>}
                                <span className="text-sm font-bold text-slate-700">{u.name}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isExempt ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                {isExempt ? 'CONFIANÇA' : 'PADRÃO'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {hasPending ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-start mb-6">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20}/>
                    <p className="text-sm text-red-700 font-medium">Existem pontos não tratados. Verifique a aba "Correção de Ponto".</p>
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex gap-3 items-center mb-6">
                    <CheckCircle2 className="text-emerald-500" size={20}/>
                    <p className="text-sm text-emerald-800 font-medium">Todos os registros obrigatórios foram conferidos.</p>
                </div>
            )}

            <Button 
                onClick={handleExport} 
                disabled={hasPending || loading} 
                className={`w-full py-4 text-white font-bold text-lg shadow-lg ${hasPending ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {loading ? 'A processar...' : 'Consolidar e Enviar para Folha'}
            </Button>
        </div>
    );
};