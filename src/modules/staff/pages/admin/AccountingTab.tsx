import React, { useState } from 'react';
import { useStaff } from '@/core/context/StaffContext';
import { 
    FileText, Download, Users, Calculator, 
    Settings, Percent, Briefcase, Filter 
} from 'lucide-react';
import { useUI } from '@/core/context/UIContext';

export const AccountingTab: React.FC = () => {
    const { state } = useStaff();
    const { showAlert } = useUI();
    
    // Filtros de Estado
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Auxiliar: Sanitização para evitar CSV Injection
    const sanitize = (val: any) => {
        const str = String(val === null || val === undefined ? "" : val).replace(/"/g, '""');
        return `"${str}"`;
    };

    // Auxiliar: Gerador de Download de Ficheiro
    const downloadCSV = (filename: string, rows: string[][]) => {
        const csvContent = "\uFEFF" + rows.map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 1. Exportar Cadastro de Funcionários (Geral ou Selecionado)
    const exportEmployees = () => {
        const headers = [
            "Matrícula", "Nome", "CPF", "PIS", "Data Admissão", "Cargo", 
            "Salário Base", "Departamento", "CBO", "Modelo Trabalho", "Status"
        ];

        const employees = selectedStaffId === 'all' 
            ? state.users 
            : state.users.filter(u => u.id === selectedStaffId);

        const rows = employees.map(u => [
            u.registrationNumber, u.name, u.documentCpf, u.pisPasep,
            u.hireDate ? new Date(u.hireDate).toLocaleDateString('pt-BR') : "",
            u.role, u.baseSalary, u.department, u.registrationNumber, u.workModel, u.status
        ].map(sanitize));

        downloadCSV(`contabil_cadastro_${selectedStaffId}.csv`, [headers, ...rows]);
        showAlert({ title: "Exportado", message: "Cadastro de funcionários gerado.", type: "SUCCESS" });
    };

    // 2. Exportar Movimentação Mensal (Folha, Horas e Eventos)
   // 2. Exportar Movimentação Mensal (Folha, Horas e Eventos)
const exportPayrollMovement = async () => {
    const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    
    // 1. Obter o holerite processado para pegar os valores calculados (Reais)
    // Nota: Como o getPayroll é assíncrono no StaffContext, garantimos os dados aqui
    const { payroll } = await state.getPayroll(selectedMonth, selectedYear);

    // 2. Filtrar registos de horas (ponto consolidado)
    const entries = state.payrollEntries.filter(e => 
        e.month === monthStr && (selectedStaffId === 'all' || e.staffId === selectedStaffId)
    );

    // 3. Filtrar eventos variáveis do período
    const events = state.payrollEvents.filter(ev => 
        ev.month === selectedMonth && ev.year === selectedYear && 
        (selectedStaffId === 'all' || ev.staffId === selectedStaffId)
    );

    const headers = [
        "Matrícula", "Funcionário", "Tipo Registro", "Descrição", 
        "Referência (Qtd/%)", "Valor Holerite (R$)", "Período"
    ];
    const rows: string[][] = [];

    // Mapear Horas Extras e Faltas cruzando com o valor calculado no holerite
    entries.forEach(e => {
        const user = state.users.find(u => u.id === e.staffId);
        const userPayroll = payroll.find(p => p.staffId === e.staffId);

        if (e.overtimeHours > 0) {
            // Valor do holerite extraído do detalhamento de horas extras
            const valorCalculado = userPayroll?.overtime50 || 0; 
            rows.push([
                user?.registrationNumber, user?.name, "HORA_EXTRA", "Horas Extras", 
                e.overtimeHours, valorCalculado.toFixed(2), monthStr
            ].map(sanitize));
        }
        
        if (e.missingHours > 0) {
            // Valor de desconto de faltas calculado
            const valorDesconto = userPayroll?.discounts || 0; 
            rows.push([
                user?.registrationNumber, user?.name, "FALTA_ATRASO", "Faltas/Atrasos", 
                e.missingHours, valorDesconto.toFixed(2), monthStr
            ].map(sanitize));
        }
    });

    // Mapear Eventos Variáveis (Ex: Bónus, Adiantamentos)
    events.forEach(ev => {
        const user = state.users.find(u => u.id === ev.staffId);
        const type = state.eventTypes.find(t => t.id === ev.type);
        
        // Aqui enviamos o valor lançado (referência) e o valor final
        // Para eventos simples, o valor costuma ser o mesmo, mas se houver 
        // cálculo de impostos sobre ele, o holerite reflete o líquido
        rows.push([
            user?.registrationNumber, user?.name, "EVENTO", type?.name || ev.description, 
            ev.value, ev.value, monthStr
        ].map(sanitize));
    });

    if (rows.length === 0) {
        showAlert({ title: "Sem dados", message: "Não foram encontrados movimentos processados para este período.", type: "WARNING" });
        return;
    }

    downloadCSV(`contabil_movimentacao_${monthStr}.csv`, [headers, ...rows]);
    showAlert({ title: "Exportado", message: "Movimentação com valores de referência e holerite gerada.", type: "SUCCESS" });
};
    // 3. Exportar Configurações, Impostos e Eventos Cadastrados
    const exportSystemSettings = () => {
        const rows: string[][] = [];
        
        // Dados do Empregador e Encargos
        rows.push(["--- CONFIGURAÇÕES DO EMPREGADOR (eSocial/Impostos) ---"].map(sanitize));
        rows.push(["Salário Mínimo", state.legalSettings?.minWage].map(sanitize));
        rows.push(["Teto INSS", state.legalSettings?.inssCeiling].map(sanitize));
        rows.push(["Alíquota FGTS (%)", state.legalSettings?.fgtsRate].map(sanitize));
        rows.push(["CNAE Preponderante", state.legalSettings?.esocialCnae].map(sanitize));
        rows.push(["FAP", state.legalSettings?.esocialFap].map(sanitize));
        rows.push(["RAT (%)", state.legalSettings?.esocialRat].map(sanitize));
        rows.push(["FPAS", state.legalSettings?.esocialFpas].map(sanitize));
        rows.push([""]);

        // Tabelas de Impostos Progressivos
        rows.push(["--- TABELA INSS PROGRESSIVO ---"].map(sanitize));
        rows.push(["Vigência Inicial", "Faixa Inicial", "Faixa Final", "Alíquota (%)"].map(sanitize));
        state.inssBrackets.forEach(b => rows.push([b.validFrom, b.minValue, b.maxValue || "Teto", b.rate].map(sanitize)));
        rows.push([""]);

        rows.push(["--- TABELA IRRF ---"].map(sanitize));
        rows.push(["Faixa Inicial", "Faixa Final", "Alíquota (%)", "Dedução"].map(sanitize));
        state.irrfBrackets.forEach(b => rows.push([b.minValue, b.maxValue || "Acima", b.rate, b.deduction].map(sanitize)));
        rows.push([""]);

        // Eventos do Sistema
        rows.push(["--- EVENTOS E RUBRICAS CADASTRADAS ---"].map(sanitize));
        rows.push(["Nome Evento", "Operação", "Tipo Cálculo", "Cód. eSocial"].map(sanitize));
        state.eventTypes.forEach(t => rows.push([t.name, t.operation, t.calculationType, t.esocialCode || "N/A"].map(sanitize)));

        downloadCSV(`configuracoes_sistema_rh.csv`, rows);
        showAlert({ title: "Exportado", message: "Configurações e impostos exportados.", type: "SUCCESS" });
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Briefcase className="text-pink-600" size={22} /> Exportação para Contabilidade Externa
                    </h3>
                </div>

                {/* Filtros Ativos */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Filtrar por Colaborador</label>
                        <select 
                            className="w-full border p-2 rounded-lg mt-1 text-sm bg-white"
                            value={selectedStaffId}
                            onChange={e => setSelectedStaffId(e.target.value)}
                        >
                            <option value="all">Todos os colaboradores (Geral)</option>
                            {state.users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.registrationNumber})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Mês/Ano de Referência</label>
                        <div className="flex gap-2 mt-1">
                            <select className="flex-1 border p-2 rounded-lg text-sm bg-white" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <input type="number" className="w-20 border p-2 rounded-lg text-sm bg-white" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg text-[10px] font-bold flex items-center gap-1 w-full justify-center border border-blue-100">
                            <Filter size={12}/> FILTRO SELECIONADO
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={exportEmployees} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-pink-200 hover:shadow-md transition-all group">
                        <div className="p-4 bg-white rounded-full text-pink-600 group-hover:scale-110 transition-transform shadow-sm">
                            <Users size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-slate-700">Dados Cadastrais</span>
                            <span className="text-xs text-slate-500">PIS, CBO, Cargo e Admissão</span>
                        </div>
                        <Download size={18} className="mt-2 text-slate-300 group-hover:text-pink-500" />
                    </button>

                    <button onClick={exportPayrollMovement} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-pink-200 hover:shadow-md transition-all group">
                        <div className="p-4 bg-white rounded-full text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                            <Calculator size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-slate-700">Movimento da Folha</span>
                            <span className="text-xs text-slate-500">Horas extras, faltas e bónus</span>
                        </div>
                        <Download size={18} className="mt-2 text-slate-300 group-hover:text-blue-500" />
                    </button>

                    <button onClick={exportSystemSettings} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-pink-200 hover:shadow-md transition-all group">
                        <div className="p-4 bg-white rounded-full text-purple-600 group-hover:scale-110 transition-transform shadow-sm">
                            <Settings size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-slate-700">Impostos e Eventos</span>
                            <span className="text-xs text-slate-500">Tabelas legais e configurações</span>
                        </div>
                        <Download size={18} className="mt-2 text-slate-300 group-hover:text-purple-500" />
                    </button>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4">
                <Percent className="text-amber-600 shrink-0" size={24}/>
                <div>
                    <h4 className="font-bold text-amber-900 mb-1 text-sm">Informação Técnica para o Contador</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Os ficheiros são gerados em formato <strong>CSV com delimitador ";" (ponto e vírgula)</strong>. 
                        A codificação inclui o caractere BOM para compatibilidade direta com o Microsoft Excel. 
                        A coluna "Matrícula" deve ser utilizada como chave de importação nos sistemas contábeis.
                    </p>
                </div>
            </div>
        </div>
    );
};