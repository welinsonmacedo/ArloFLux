// src/modules/staff/pages/admin/SendToPayrollTab.tsx
import React, { useState } from 'react';
import { useStaff } from '@/core/context/StaffContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const SendToPayrollTab: React.FC = () => {
    const { state: staffState, exportPointsToPayroll } = useStaff();
    const { showAlert, showConfirm } = useUI();
    const [month, setMonth] = useState(new Date().getMonth().toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);

    // Verifica se há pendências no mês selecionado
    const hasPending = staffState.timeEntries?.some(e => 
        (e.status === 'PENDING' || e.status === 'NEEDS_CORRECTION') && 
        new Date(e.entryDate).getMonth().toString() === month &&
        new Date(e.entryDate).getFullYear().toString() === year
    );

    const handleExport = async () => {
        if (hasPending) {
            return showAlert({ title: "Ação Bloqueada", message: "Resolva todas as pendências e divergências de ponto antes de enviar para a folha.", type: "WARNING" });
        }

        showConfirm({
            title: "Consolidar e Enviar?",
            message: "Isso irá calcular todas as horas extras, faltas e atrasos do período e enviar para a Folha de Pagamento. Deseja prosseguir?",
            confirmText: "Enviar para Folha",
            onConfirm: async () => {
                setLoading(true);
                try {
                    // Chama a função do contexto que faz o math e salva em rh_payroll_entries
                    await exportPointsToPayroll(parseInt(month), parseInt(year));
                    showAlert({ title: "Sucesso", message: "Horas consolidadas enviadas para a Folha de Pagamento com sucesso!", type: "SUCCESS" });
                } catch (error: any) {
                    showAlert({ title: "Erro", message: "Falha ao exportar: " + error.message, type: "ERROR" });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-3xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Exportar para Folha de Pagamento</h3>
            <p className="text-sm text-gray-500 mb-6">Feche o período de ponto e envie os totalizadores (Horas Extras, Adicional Noturno, Faltas) para o cálculo automático da folha.</p>

            <div className="flex gap-4 mb-8">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mês de Referência</label>
                    <select className="w-full border-2 p-3 rounded-xl bg-slate-50" value={month} onChange={e => setMonth(e.target.value)}>
                        {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ano</label>
                    <select className="w-full border-2 p-3 rounded-xl bg-slate-50" value={year} onChange={e => setYear(e.target.value)}>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>

            {hasPending ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-start mb-6">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20}/>
                    <div>
                        <h4 className="font-bold text-red-800 text-sm">Existem pontos pendentes</h4>
                        <p className="text-sm text-red-600 mt-1">Vá até a aba "Correção de Ponto" e trate todas as divergências deste período antes de exportar os totalizadores.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex gap-3 items-center mb-6">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={20}/>
                    <div className="text-sm text-emerald-800 font-medium">Todos os pontos do período estão tratados e prontos para consolidação.</div>
                </div>
            )}

            <Button 
                onClick={handleExport} 
                disabled={hasPending || loading} 
                className={`w-full py-4 text-white font-bold text-lg shadow-sm ${hasPending ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {loading ? 'Processando...' : <><Send className="mr-2" size={20}/> Consolidar e Enviar para Folha</>}
            </Button>
        </div>
    );
};