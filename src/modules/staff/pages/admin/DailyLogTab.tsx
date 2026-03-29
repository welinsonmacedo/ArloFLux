import React, { useState } from 'react';
import { useStaff } from '@/core/context/StaffContext';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { Button } from '@/modules/common/components/Button';
import { TimeEntry } from '@/types';
import { Search, Calendar, Plus, Upload, ChevronDown, ChevronUp, Printer, ArrowRight } from 'lucide-react';
import { TimeEntryModal } from '@/modules/common/components/modals/TimeEntryModal';
import { SummaryModal } from '@/modules/common/components/modals/SummaryModal';
import { ImportAFDModal } from '@/modules/common/components/modals/ImportAFDModal';
import { printHtml } from '@/core/print/printHelper';

export const DailyLogTab: React.FC = () => {
    const { state: staffState } = useStaff();
    const { state: restState } = useRestaurant();
    
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<TimeEntry | null>(null);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [summary, setSummary] = useState({ overtime: 0, missingHours: 0, bankHours: 0 });
    
    const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
    
    const settings = staffState.legalSettings;
    const pointClosingDay = settings?.pointClosingDay || 30;
    const isBankOfHours = settings?.overtimePolicy === 'BANK_OF_HOURS';
    const deductDelays = settings?.deductDelaysFromOvertime || false;

    const isDateInPayrollMonth = (date: Date, filterMonthStr: string) => {
        const [yearStr, monthStr] = filterMonthStr.split('-');
        const pYear = parseInt(yearStr, 10);
        const pMonth = parseInt(monthStr, 10);

        const entryYear = date.getUTCFullYear();
        const entryMonth = date.getUTCMonth() + 1;
        const entryDay = date.getUTCDate();

        const isCurrentMonth = entryYear === pYear && entryMonth === pMonth && entryDay <= pointClosingDay;
        const prevMonth = pMonth === 1 ? 12 : pMonth - 1;
        const prevYear = pMonth === 1 ? pYear - 1 : pYear;
        const isPrevMonth = entryYear === prevYear && entryMonth === prevMonth && entryDay > pointClosingDay;

        return isCurrentMonth || isPrevMonth;
    };

    const monthlyEntries = staffState.timeEntries.filter(entry => {
        return isDateInPayrollMonth(entry.entryDate, filterMonth);
    });

    const staffSummaries = staffState.users
        .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(user => {
            const userEntries = monthlyEntries.filter(e => e.staffId === user.id);
            
            let totalHours = 0;
            let rawOvertime = 0;
            let rawMissing = 0;
            
            const shift = staffState.shifts.find(s => s.id === user.shiftId);
            let dailyTarget = 8; 
            let breakHours = 1;
            
            if (shift && shift.startTime && shift.endTime) {
                const sTime = new Date(`1970-01-01T${shift.startTime}Z`);
                const eTime = new Date(`1970-01-01T${shift.endTime}Z`);
                let diff = (eTime.getTime() - sTime.getTime()) / 3600000;
                if (diff < 0) diff += 24; 
                breakHours = (shift.breakMinutes || 0) / 60;
                dailyTarget = diff - breakHours;
            }

            userEntries.forEach(entry => {
                if ((entry.status as any) === 'CORRECTED') return;

                if (entry.clockIn && entry.clockOut) {
                    let worked = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / 3600000;
                    
                    if (entry.breakStart && entry.breakEnd) {
                        worked -= (new Date(entry.breakEnd).getTime() - new Date(entry.breakStart).getTime()) / 3600000;
                    } else {
                        worked -= breakHours;
                    }
                    
                    totalHours += worked;
                    const diff = worked - dailyTarget;
                    
                    if (diff > 0.16) rawOvertime += diff;
                    else if (diff < -0.16) rawMissing += Math.abs(diff);
                } else if ((entry.status as any) === 'ABSENT') {
                    rawMissing += dailyTarget;
                }
            });

            let finalOvertime = rawOvertime;
            let finalMissing = rawMissing;
            
            if (deductDelays) {
                const net = finalOvertime - finalMissing;
                if (net >= 0) {
                    finalOvertime = net;
                    finalMissing = 0;
                } else {
                    finalOvertime = 0;
                    finalMissing = Math.abs(net);
                }
            }

            const bankChange = finalOvertime - finalMissing;

            return {
                user,
                entries: userEntries.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()),
                totalHours,
                rawOvertime,
                rawMissing,
                finalOvertime,
                finalMissing,
                bankChange,
                bankBalance: user.bankHoursBalance || 0,
                dailyTarget,
                breakHours
            };
        });

    const handlePrintEspelho = (staffId: string, month: string) => {
        const summary = staffSummaries.find(s => s.user.id === staffId);
        if (!summary) return;

        const staff = summary.user;
        const entries = summary.entries;
        const dailyTarget = summary.dailyTarget;
        const breakHours = summary.breakHours;

        const formatDate = (d: Date) => {
            const date = new Date(d);
            const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
            const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' });
            return `${day}<br/><span style="font-size: 9px; color: #666; text-transform: capitalize;">${weekday}</span>`;
        };
        const formatTime = (d?: Date) => d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

        let policySummaryHtml = '';
        if (isBankOfHours) {
            policySummaryHtml = `
                <div class="summary-item">
                    <strong>Horas Geradas p/ Banco</strong>
                    ${summary.bankChange > 0 ? '+' : ''}${summary.bankChange.toFixed(2)}h
                </div>
                <div class="summary-item">
                    <strong>Saldo Atual do Banco</strong>
                    ${summary.bankBalance.toFixed(2)}h
                </div>
            `;
        } else {
            policySummaryHtml = `
                <div class="summary-item">
                    <strong>A Pagar em Folha</strong>
                    ${summary.finalOvertime.toFixed(2)}h
                </div>
                <div class="summary-item">
                    <strong>A Descontar em Folha</strong>
                    ${summary.finalMissing.toFixed(2)}h
                </div>
            `;
        }

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Espelho de Ponto - ${staff.name}</title>
                    <style>
                        body { font-family: sans-serif; padding: 30px; color: #333; }
                        h1 { font-size: 18px; margin-bottom: 5px; text-transform: uppercase; }
                        .header { margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; text-align: center; }
                        th, td { border: 1px solid #ddd; padding: 4px 2px; font-size: 10px; }
                        th { background: #f5f5f5; font-weight: bold; }
                        .corrected { color: #999; text-decoration: line-through; background: #fafafa; }
                        .summary { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #eee; }
                        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }
                        .summary-item { font-size: 14px; }
                        .summary-item strong { display: block; font-size: 9px; text-transform: uppercase; color: #666; margin-bottom: 4px; }
                        .footer { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                        .signature { border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 12px; }
                        .manual { color: #1d4ed8; font-weight: bold; }
                        .absence { color: #dc2626; font-weight: bold; }
                        .green { color: #16a34a; }
                        .red { color: #dc2626; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>Espelho de Ponto Individual</h1>
                            <div style="font-size: 14px; font-weight: bold; margin-top: 10px;">${staff.name.toUpperCase()}</div>
                            <div style="font-size: 12px; color: #555;">CPF: ${staff.documentCpf || '-'}</div>
                            <div style="font-size: 12px; color: #555;">Cargo: ${staff.role || '-'} - Departamento: ${staff.department || '-'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px;"><strong>Status:</strong> ${staff.status} • ${entries.length} registros</div>
                            <div style="font-size: 12px; margin-top: 5px;"><strong>Período:</strong> ${month}</div>
                        </div>
                    </div>

                    <h3 style="font-size: 12px; margin-bottom: 10px;">REGISTROS DIÁRIOS</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Entrada</th>
                                <th>Início Int.</th>
                                <th>Fim Int.</th>
                                <th>Saída</th>
                                <th>Trabalhado</th>
                                <th>Extras</th>
                                <th>Faltas</th>
                                <th>Origem</th>
                                <th>Justificativa</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${entries.map(e => {
                                let worked = 0;
                                let diff = 0;
                                let extras = 0;
                                let faltas = 0;
                                
                                if (e.clockIn && e.clockOut) {
                                    worked = (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime()) / 3600000;
                                    if (e.breakStart && e.breakEnd) {
                                        worked -= (new Date(e.breakEnd).getTime() - new Date(e.breakStart).getTime()) / 3600000;
                                    } else {
                                        worked -= breakHours;
                                    }
                                    diff = worked - dailyTarget;
                                    if (diff > 0.16) extras = diff;
                                    else if (diff < -0.16) faltas = Math.abs(diff);
                                } else if ((e.status as any) === 'ABSENT') {
                                    faltas = dailyTarget;
                                }

                                const isCorrected = (e.status as any) === 'CORRECTED';
                                const isManual = e.entryType === 'MANUAL';
                                const isAbsent = (e.status as any) === 'ABSENT';
                                
                                let originText = isManual ? '<span class="manual">MANUAL ✎</span>' : 'DIGITAL';
                                if(isAbsent) originText = '-';

                                let justificationText = '<span style="color: #16a34a; font-size: 12px;">✔</span>';
                                if (isManual && e.justification) {
                                    justificationText = `<span style="font-size: 9px; color: #333;">Corrigido: ${e.justification}</span>`;
                                } else if (isAbsent) {
                                    justificationText = '<span class="absence">FALTA</span>';
                                } else if (isCorrected) {
                                    justificationText = '<span style="font-size: 9px; color: #999;">Desconsiderado</span>';
                                }

                                return `
                                <tr class="${isCorrected ? 'corrected' : ''}">
                                    <td>${formatDate(e.entryDate)}</td>
                                    <td>${formatTime(e.clockIn)}</td>
                                    <td>${formatTime(e.breakStart)}</td>
                                    <td>${formatTime(e.breakEnd)}</td>
                                    <td>${formatTime(e.clockOut)}</td>
                                    <td style="font-weight: bold;">${worked > 0 ? worked.toFixed(1) + 'h' : '0.0h'}</td>
                                    <td class="${extras > 0 ? 'green' : ''}">${extras > 0 ? '+' + extras.toFixed(1) + 'h' : '0.0h'}</td>
                                    <td class="${faltas > 0 ? 'red' : ''}">${faltas > 0 ? '-' + faltas.toFixed(1) + 'h' : '-0.0h'}</td>
                                    <td>${originText}</td>
                                    <td>${justificationText}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <div class="summary">
                        <h3 style="margin-top: 0; font-size: 14px;">Resumo Baseado nas Regras do Mês</h3>
                        <p style="font-size: 11px; color: #666; margin-bottom: 15px;">
                            Política: ${isBankOfHours ? 'Banco de Horas' : 'Pagamento em Folha'} | Abater Atrasos: ${deductDelays ? 'Sim' : 'Não'}
                        </p>
                        <div class="summary-grid">
                            <div class="summary-item">
                                <strong>Horas Trabalhadas</strong>
                                ${(summary.totalHours || 0).toFixed(2)}h
                            </div>
                            <div class="summary-item">
                                <strong>Extras (Bruto)</strong>
                                ${(summary.rawOvertime || 0).toFixed(2)}h
                            </div>
                            <div class="summary-item">
                                <strong>Faltas (Bruto)</strong>
                                ${(summary.rawMissing || 0).toFixed(2)}h
                            </div>
                            ${policySummaryHtml}
                        </div>
                    </div>

                    <div class="footer">
                        <div class="signature">Assinatura do Colaborador</div>
                        <div class="signature">Assinatura do Empregador (${restState.businessInfo?.restaurantName || 'Empresa'})</div>
                    </div>
                </body>
            </html>
        `;

        printHtml(html);
    };

    const handleNewEntry = () => {
        setEntryToEdit(null);
        if (expandedStaffId) setSelectedStaffId(expandedStaffId);
        setIsEntryModalOpen(true);
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                         <input className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500" placeholder="Buscar colaborador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                        <Calendar size={18} className="text-gray-400 ml-2"/>
                        <input type="month" className="bg-transparent text-sm font-bold text-gray-700 outline-none p-1" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
                    </div>
                    <Button onClick={handleNewEntry} className="bg-pink-600 hover:bg-pink-700 text-white border-transparent shadow-pink-200">
                        <Plus size={18}/> <span className="hidden sm:inline">Lançar Manual</span>
                    </Button>
                    <Button onClick={() => setIsImportModalOpen(true)} variant="secondary" className="bg-white text-slate-600 border-slate-200 hover:bg-slate-50">
                        <Upload size={18} className="mr-2"/> Importar AFD
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {staffSummaries.map(({ user, entries, totalHours, rawOvertime, rawMissing, finalOvertime, finalMissing, bankChange, bankBalance }) => (
                    <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div 
                            className="p-4 flex flex-col xl:flex-row xl:items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors gap-4"
                            onClick={() => setExpandedStaffId(expandedStaffId === user.id ? null : user.id)}
                        >
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                                    <p className="text-xs text-slate-500">{user.role} • {entries.length} registros</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 flex-wrap xl:flex-nowrap ml-14 xl:ml-0">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Trabalhadas</p>
                                    <p className="font-mono font-bold text-slate-700">{(totalHours || 0).toFixed(1)}h</p>
                                </div>
                                
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Bruto (Ext/Fal)</p>
                                    <p className="font-mono text-[11px] text-slate-500 mt-1">
                                        <span className="text-green-600">+{rawOvertime.toFixed(1)}h</span> / <span className="text-red-500">-{rawMissing.toFixed(1)}h</span>
                                    </p>
                                </div>

                                <ArrowRight size={14} className="text-slate-300 hidden md:block" />

                                <div className="text-right bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                    <p className="text-[10px] uppercase font-black text-blue-600">
                                        {isBankOfHours ? 'Resultado p/ Banco' : 'Resultado p/ Folha'}
                                    </p>
                                    {isBankOfHours ? (
                                        <p className={`font-mono font-black ${bankChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {bankChange > 0 ? '+' : ''}{bankChange.toFixed(1)}h
                                        </p>
                                    ) : (
                                        <p className="font-mono font-black text-slate-700">
                                            <span className="text-green-600">+{finalOvertime.toFixed(1)}h</span> 
                                            <span className="text-gray-300 mx-1">|</span> 
                                            <span className="text-red-600">-{finalMissing.toFixed(1)}h</span>
                                        </p>
                                    )}
                                </div>

                                <div className="text-right pl-2">
                                    <p className="text-[10px] uppercase font-bold text-purple-500">Saldo Atual (Banco)</p>
                                    <p className="font-mono font-bold text-purple-600">{(bankBalance || 0).toFixed(1)}h</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handlePrintEspelho(user.id, filterMonth); }}
                                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-all"
                                        title="Imprimir Espelho"
                                    >
                                        <Printer size={20}/>
                                    </button>
                                    {expandedStaffId === user.id ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                                </div>
                            </div>
                        </div>

                        {expandedStaffId === user.id && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 uppercase font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="pb-2 pl-2">Data</th>
                                            <th className="pb-2">Entrada</th>
                                            <th className="pb-2">Intervalo</th>
                                            <th className="pb-2">Saída</th>
                                            <th className="pb-2">Total</th>
                                            <th className="pb-2 text-center">Status</th>
                                            <th className="pb-2 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {entries.length === 0 ? (
                                            <tr><td colSpan={7} className="p-4 text-center text-gray-400 italic">Sem registros neste mês.</td></tr>
                                        ) : (
                                            entries.map(entry => {
                                                const hoursValue = entry.clockIn && entry.clockOut 
                                                    ? ((new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / 3600000)
                                                    : null;
                                                const hours = (hoursValue !== null && hoursValue !== undefined) ? hoursValue.toFixed(1) : '-';
                                                
                                                return (
                                                    <tr key={entry.id} className="hover:bg-white transition-colors">
                                                        <td className="p-3 pl-2 font-mono text-slate-600">
                                                            {new Date(entry.entryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} <span className="text-xs text-slate-400">({new Date(entry.entryDate).toLocaleDateString('pt-BR', {weekday: 'short', timeZone: 'UTC'})})</span>
                                                        </td>
                                                        <td className="p-3 font-mono text-slate-600">{entry.clockIn ? new Date(entry.clockIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                                                        <td className="p-3 font-mono text-xs text-slate-500">
                                                            {entry.breakStart && entry.breakEnd ? 
                                                                `${new Date(entry.breakStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(entry.breakEnd).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` 
                                                                : '--:--'}
                                                        </td>
                                                        <td className="p-3 font-mono text-slate-600">{entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                                                        <td className="p-3 font-bold text-slate-700">{hours}h</td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase border ${
                                                                    (entry.status as any) === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                                    (entry.status as any) === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                    (entry.status as any) === 'ABSENT' ? 'bg-red-500 text-white border-red-600' :
                                                                    (entry.status as any) === 'JUSTIFIED_ABSENCE' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                    (entry.status as any) === 'CORRECTED' ? 'bg-gray-100 text-gray-500 border-gray-200 line-through' : 
                                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                                }`}>
                                                                    {(entry.status as any) === 'CORRECTED' ? 'Corrigido' : 
                                                                    (entry.status as any) === 'ABSENT' ? 'Falta' :
                                                                    (entry.status as any) === 'JUSTIFIED_ABSENCE' ? 'Justificada' :
                                                                    entry.status}
                                                                </span>
                                                                {entry.entryType === 'MANUAL' && (
                                                                    <span className="text-[8px] font-bold text-amber-600 uppercase">Manual</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {entry.status === 'CORRECTED' && (
                                                                <span className="text-[10px] text-slate-400 italic">Antigo</span>
                                                            )}
                                                            {entry.originalEntryId && (
                                                                <span className="text-[10px] text-blue-500 font-bold">Corrigido</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
                
                {staffSummaries.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        Nenhum colaborador encontrado.
                    </div>
                )}
            </div>

            <TimeEntryModal 
                isOpen={isEntryModalOpen} 
                onClose={() => setIsEntryModalOpen(false)} 
                entryToEdit={entryToEdit}
                staffId={selectedStaffId || (staffState.users.length > 0 ? staffState.users[0].id : '')}
            />
            
            <SummaryModal 
                isOpen={isSummaryModalOpen} 
                onClose={() => setIsSummaryModalOpen(false)} 
                summary={summary}
                onSave={(newSummary) => setSummary(newSummary)}
            />

            <ImportAFDModal 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)} 
            />
        </div>
    );
};