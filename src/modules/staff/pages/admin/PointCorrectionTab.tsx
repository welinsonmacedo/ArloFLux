// src/modules/staff/pages/admin/PointCorrectionTab.tsx
import React, { useState } from 'react';
import { useStaff } from '@/core/context/StaffContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { Check, X, AlertTriangle, Clock } from 'lucide-react';
import { Modal } from '@/modules/common/components/Modal';

export const PointCorrectionTab: React.FC = () => {
    const { state: staffState, updateTimeEntry } = useStaff();
    const { showAlert } = useUI();
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [correctionReason, setCorrectionReason] = useState('');

    // Filtra apenas pontos que requerem atenção do RH
    const pendingEntries = staffState.timeEntries?.filter(e => e.status === 'PENDING' || e.status === 'NEEDS_CORRECTION') || [];

    const handleApprove = async (entry: any) => {
        try {
            await updateTimeEntry({ ...entry, status: 'APPROVED' });
            showAlert({ title: "Sucesso", message: "Ponto aprovado.", type: "SUCCESS" });
        } catch (e) {
            showAlert({ title: "Erro", message: "Erro ao aprovar ponto.", type: "ERROR" });
        }
    };

    const handleCorrection = async () => {
        if (!correctionReason) return showAlert({ title: "Atenção", message: "Insira uma justificativa para a correção.", type: "WARNING" });
        try {
            await updateTimeEntry({ ...selectedEntry, status: 'CORRECTED', correctionReason });
            showAlert({ title: "Sucesso", message: "Ponto corrigido com sucesso.", type: "SUCCESS" });
            setSelectedEntry(null);
            setCorrectionReason('');
        } catch (e) {
            showAlert({ title: "Erro", message: "Erro ao corrigir ponto.", type: "ERROR" });
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Tratamento de Ponto</h3>
                    <p className="text-sm text-gray-500">Aprove divergências ou corrija esquecimentos de marcação.</p>
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-orange-200">
                    <AlertTriangle size={18}/> {pendingEntries.length} Pendências
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b">
                        <tr>
                            <th className="p-4">Data</th>
                            <th className="p-4">Colaborador</th>
                            <th className="p-4">Entrada</th>
                            <th className="p-4">Saída</th>
                            <th className="p-4">Divergência</th>
                            <th className="p-4 text-right">Ação RH</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {pendingEntries.map(entry => {
                            const user = staffState.users.find(u => u.id === entry.staffId);
                            return (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono font-bold text-slate-700">
                                        {new Date(entry.entryDate).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 font-bold text-slate-800">{user?.name}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <Clock size={14}/> 
                                            {entry.clockIn ? new Date(entry.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <Clock size={14}/> 
                                            {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-orange-600 text-xs font-bold">
                                        {entry.justification || 'Falta de marcação de saída / Atraso'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setSelectedEntry(entry)} className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">Corrigir</button>
                                            <button onClick={() => handleApprove(entry)} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"><Check size={14}/> Aprovar</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {pendingEntries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-gray-400">Tudo certo! Nenhuma pendência de ponto.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title="Ajuste Manual de Ponto" onSave={handleCorrection}>
                <div className="space-y-4 pt-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-4 border border-blue-200">
                        Você está alterando o registro original. A justificativa inserida abaixo fará parte do espelho de ponto do funcionário (Exigência Portaria 671).
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Motivo da Correção Administrativa</label>
                        <textarea 
                            className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none h-24 text-sm" 
                            placeholder="Ex: Sistema offline, funcionário esqueceu de bater, ajuste de banco de horas..."
                            value={correctionReason}
                            onChange={e => setCorrectionReason(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};