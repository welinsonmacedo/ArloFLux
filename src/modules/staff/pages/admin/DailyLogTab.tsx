// src/modules/staff/pages/admin/DailyLogTab.tsx
import React, { useState } from 'react';
import { useStaff } from '@/core/context/StaffContext';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { Button } from '@/modules/common/components/Button';
import { TimeEntry } from '@/types';
import { 
    Search, Calendar, Plus, Upload, ChevronDown, 
    ChevronUp, Printer, ArrowRight, Shield 
} from 'lucide-react';
import { TimeEntryModal } from '@/modules/common/components/modals/TimeEntryModal';
import { ImportAFDModal } from '@/modules/common/components/modals/ImportAFDModal';
import { printHtml } from '@/core/print/printHelper';

export const DailyLogTab: React.FC = () => {
    const { state: staffState } = useStaff();
    const { state: restState } = useRestaurant();
    
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    const settings = staffState.legalSettings;
    const pointClosingDay = settings?.pointClosingDay || 30;
    const isBankOfHours = settings?.overtimePolicy === 'BANK_OF_HOURS';

    // Lógica de competência de datas
    const monthlyEntries = staffState.timeEntries.filter(entry => {
        const date = new Date(entry.entryDate);
        const [y, m] = filterMonth.split('-').map(Number);
        const isCurrent = date.getUTCFullYear() === y && (date.getUTCMonth() + 1) === m && date.getUTCDate() <= pointClosingDay;
        const isPrev = (m === 1 ? date.getUTCFullYear() === y - 1 : date.getUTCFullYear() === y) && 
                       (m === 1 ? date.getUTCMonth() + 1 === 12 : date.getUTCMonth() + 1 === m - 1) && 
                       date.getUTCDate() > pointClosingDay;
        return isCurrent || isPrev;
    });

    const staffSummaries = staffState.users
        .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(user => {
            const isExempt = user.requires_time_tracking === false; // IDENTIFICAÇÃO DO CARGO DE CONFIANÇA
            const userEntries = monthlyEntries.filter(e => e.staffId === user.id);
            
            // Se for isento, zeramos cálculos de horas e variâncias
            if (isExempt) {
                return { 
                    user, 
                    entries: userEntries, 
                    totalHours: 0, 
                    rawOvertime: 0, 
                    rawMissing: 0, 
                    bankChange: 0, 
                    isExempt: true 
                };
            }

            // Lógica normal para quem bate ponto
            let total = 0;
            let overtime = 0;
            let missing = 0;
            const shift = staffState.shifts.find(s => s.id === user.shiftId);
            const dailyTarget = 8; // Ideal buscar do shift dinamicamente

            userEntries.forEach(e => {
                if (e.clockIn && e.clockOut) {
                    const worked = (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime()) / 3600000;
                    total += worked;
                    const diff = worked - dailyTarget;
                    if (diff > 0.16) overtime += diff;
                    else if (diff < -0.16) missing += Math.abs(diff);
                } else if ((e.status as any) === 'ABSENT') {
                    missing += dailyTarget;
                }
            });

            return { 
                user, 
                entries: userEntries.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()), 
                totalHours: total, 
                rawOvertime: overtime,
                rawMissing: missing,
                bankChange: overtime - missing,
                isExempt: false 
            };
        });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative md:w-64">
                         <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                         <input className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <input type="month" className="border rounded-xl px-3 py-2 text-sm font-bold" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
                    <Button onClick={() => setIsEntryModalOpen(true)} className="bg-pink-600 text-white"><Plus size={18} className="mr-2"/> Lançar Manual</Button>
                </div>
            </div>

            <div className="space-y-4">
                {staffSummaries.map((s) => (
                    <div key={s.user.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => setExpandedStaffId(expandedStaffId === s.user.id ? null : s.user.id)}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">{s.user.name.charAt(0)}</div>
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {s.user.name} 
                                        {s.isExempt && <Shield size={14} className="text-blue-500" title="Cargo de Confiança" />}
                                    </h3>
                                    <p className="text-xs text-slate-500">{s.user.role}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {s.isExempt ? (
                                    <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Isento (Art. 62 CLT)</p>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Horas no Mês</p>
                                        <p className="font-mono font-bold text-slate-700">{s.totalHours.toFixed(1)}h</p>
                                    </div>
                                )}
                                {expandedStaffId === s.user.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </div>
                        </div>

                        {expandedStaffId === s.user.id && (
                            <div className="p-4 border-t bg-slate-50/30">
                                {s.isExempt ? (
                                    <div className="text-center py-6">
                                        <Shield className="mx-auto text-slate-300 mb-2" size={32} />
                                        <p className="text-slate-500 text-sm font-medium">Este colaborador ocupa um cargo de confiança.</p>
                                        <p className="text-slate-400 text-[11px] uppercase">Não há obrigatoriedade de registo ou controlo de jornada.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr className="text-slate-400 uppercase font-bold border-b">
                                                <th className="pb-2">Data</th>
                                                <th className="pb-2">Entrada</th>
                                                <th className="pb-2">Saída</th>
                                                <th className="pb-2 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {s.entries.map(e => (
                                                <tr key={e.id}>
                                                    <td className="py-2">{new Date(e.entryDate).toLocaleDateString()}</td>
                                                    <td className="py-2 font-mono">{e.clockIn ? new Date(e.clockIn).toLocaleTimeString() : '--:--'}</td>
                                                    <td className="py-2 font-mono">{e.clockOut ? new Date(e.clockOut).toLocaleTimeString() : '--:--'}</td>
                                                    <td className="py-2 text-center">{e.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <TimeEntryModal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} staffId={staffState.users[0]?.id} />
        </div>
    );
};