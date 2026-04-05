import React, { useState, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { useStaff } from '@/core/context/StaffContext';

// Register inline styles for Quill to ensure proper printing
const AlignStyle = Quill.import('attributors/style/align');
Quill.register(AlignStyle, true);
import { useUI } from '@/core/context/UIContext';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { replaceContractVariables } from '@/core/print/printContract';
import { Button } from '@/modules/common/components/Button';
import { 
    AlertTriangle, User as LucideUser, Printer, Edit3, Eye, Trash2, 
    FileText, History, CheckCircle, XCircle, Clock, ChevronRight,
    Search, Filter, Calendar, Download, Send, MessageSquare, Award
} from 'lucide-react';

export const StaffWarnings: React.FC = () => {
    const { state, addStaffWarning, deleteStaffWarning } = useStaff();
    const { state: restState } = useRestaurant();
    const { showAlert, showConfirm } = useUI();

    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [warningType, setWarningType] = useState<'VERBAL' | 'FORMAL'>('FORMAL');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
    const [historySearch, setHistorySearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState<'ALL' | 'VERBAL' | 'FORMAL'>('ALL');
    const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);

    const warningTemplates = state.contractTemplates.filter(t => t.isActive && t.type === 'WARNING');
    const selectedStaff = state.users.find(u => u.id === selectedStaffId);
    
    // Filtrar histórico
    const filteredWarnings = state.warnings.filter(w => {
        if (selectedStaffId && w.staffId !== selectedStaffId) return false;
        if (historyFilter !== 'ALL' && w.type !== historyFilter) return false;
        if (historySearch) {
            const staff = state.users.find(u => u.id === w.staffId);
            const staffName = staff?.name?.toLowerCase() || '';
            return staffName.includes(historySearch.toLowerCase());
        }
        return true;
    });

    useEffect(() => {
        if (selectedTemplateId) {
            const template = warningTemplates.find(t => t.id === selectedTemplateId);
            if (template) {
                setContent(template.content);
            }
        }
    }, [selectedTemplateId]);

    const handleSaveAndPrint = async () => {
        if (!selectedStaffId || !content) {
            return showAlert({ title: "Campos Obrigatórios", message: "Selecione um colaborador e preencha o conteúdo.", type: "WARNING" });
        }

        try {
            setIsSaving(true);
            
            await addStaffWarning({
                staffId: selectedStaffId,
                type: warningType,
                content: content
            });

            const company = restState.businessInfo;
            const role = state.hrJobRoles.find(r => r.id === selectedStaff?.hrJobRoleId);
            const roleName = role ? role.title : (selectedStaff?.customRoleName || '');
            const shift = state.shifts.find(s => s.id === selectedStaff?.shiftId);
            const shiftName = shift ? shift.name : '';
            
            let rendered = replaceContractVariables(content, selectedStaff as any, company, roleName, shiftName)
                .replace(/\{\{\s*data\s*\}\}/g, new Date().toLocaleDateString('pt-BR'))
                .replace(/\{\{\s*tipo_advertencia\s*\}\}/g, warningType === 'VERBAL' ? 'VERBAL' : 'ESCRITA/FORMAL');

            const cleanRendered = DOMPurify.sanitize(rendered);

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const htmlContent = `
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                            .content { margin-bottom: 40px; }
                            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
                            .sig-box { width: 45%; border-top: 1px solid #000; padding-top: 10px; text-align: center; }
                            @media print { body { padding: 20px; } .signatures { page-break-inside: avoid; } }
                        </style>
                    </head>
                    <body>
                        <div class="content">${cleanRendered}</div>
                        <div class="signatures">
                            <div class="sig-box">Testemunha 1:</div>
                            <div class="sig-box">Testemunha 2:<br/></div>
                        </div>
                        <div class="signatures">
                            <div class="sig-box">Assinatura do Empregador</div>
                            <div class="sig-box">Assinatura do Colaborador<br/>${selectedStaff?.name}</div>
                        </div>
                        <script>window.onload = function() { window.print(); }</script>
                    </body>
                </html>
            `;

            const doc = iframe.contentWindow?.document || iframe.contentDocument;
            if (doc) {
                doc.open();
                doc.write(htmlContent);
                doc.close();
                setTimeout(() => {
                    if (document.body.contains(iframe)) document.body.removeChild(iframe);
                }, 2000);
            }
            
            showAlert({ title: "Sucesso", message: "Advertência registrada e enviada para impressão.", type: "SUCCESS" });
            
            setSelectedTemplateId('');
            setContent('');
        } catch (error) {
            console.error(error);
            showAlert({ title: "Erro", message: "Não foi possível salvar a advertência.", type: "ERROR" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWarning = (id: string) => {
        showConfirm({
            title: "Excluir Registro",
            message: "Tem certeza que deseja excluir este registro do histórico? Esta ação não pode ser desfeita.",
            onConfirm: async () => {
                try {
                    await deleteStaffWarning(id);
                    showAlert({ title: "Sucesso", message: "Registro excluído.", type: "SUCCESS" });
                } catch (error) {
                    showAlert({ title: "Erro", message: "Erro ao excluir registro.", type: "ERROR" });
                }
            }
        });
    };

    const handleViewWarning = (warning: any) => {
        const staff = state.users.find(u => u.id === warning.staffId);
        const company = restState.businessInfo;
        const role = state.hrJobRoles.find(r => r.id === staff?.hrJobRoleId);
        const roleName = role ? role.title : (staff?.customRoleName || '');
        const shift = state.shifts.find(s => s.id === staff?.shiftId);
        const shiftName = shift ? shift.name : '';
        
        let rendered = replaceContractVariables(warning.content, staff as any, company, roleName, shiftName)
            .replace(/\{\{\s*data\s*\}\}/g, new Date(warning.createdAt).toLocaleDateString('pt-BR'))
            .replace(/\{\{\s*tipo_advertencia\s*\}\}/g, warning.type === 'VERBAL' ? 'VERBAL' : 'ESCRITA/FORMAL');

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                        .content { margin-bottom: 40px; }
                        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
                        .sig-box { width: 45%; border-top: 1px solid #000; padding-top: 10px; text-align: center; }
                        @media print { body { padding: 20px; } }
                    </style>
                </head>
                <body>
                    <div class="content">${rendered}</div>
                    <div class="signatures">
                        <div class="sig-box">Testemunha 1:</div>
                        <div class="sig-box">Testemunha 2:<br/></div>
                    </div>
                    <div class="signatures">
                        <div class="sig-box">Assinatura do Empregador</div>
                        <div class="sig-box">Assinatura do Colaborador<br/>${staff?.name}</div>
                    </div>
                    <script>window.onload = function() { window.print(); }</script>
                </body>
            </html>
        `;

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
            doc.open();
            doc.write(htmlContent);
            doc.close();
            setTimeout(() => {
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
            }, 2000);
        }
    };

    // Estatísticas
    const stats = {
        total: state.warnings.length,
        verbal: state.warnings.filter(w => w.type === 'VERBAL').length,
        formal: state.warnings.filter(w => w.type === 'FORMAL').length,
        lastMonth: state.warnings.filter(w => new Date(w.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in pb-20">
            {/* Header com estatísticas */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" size={24} /> 
                            Advertências & Avisos
                            <span className="text-sm font-normal bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {stats.total}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Emissão de medidas disciplinares e registros verbais.</p>
                    </div>
                </div>

                {/* Cards de estatísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100">
                    <div className="bg-amber-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <FileText size={18} className="text-amber-600" />
                            <span className="text-xs font-bold text-amber-600">Total</span>
                        </div>
                        <p className="text-2xl font-black text-amber-700 mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <MessageSquare size={18} className="text-orange-600" />
                            <span className="text-xs font-bold text-orange-600">Verbais</span>
                        </div>
                        <p className="text-2xl font-black text-orange-700 mt-1">{stats.verbal}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <Award size={18} className="text-red-600" />
                            <span className="text-xs font-bold text-red-600">Formais</span>
                        </div>
                        <p className="text-2xl font-black text-red-700 mt-1">{stats.formal}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <Calendar size={18} className="text-blue-600" />
                            <span className="text-xs font-bold text-blue-600">Último mês</span>
                        </div>
                        <p className="text-2xl font-black text-blue-700 mt-1">{stats.lastMonth}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200">
                    <div className="flex gap-1 px-4 pt-4">
                        <button 
                            onClick={() => setActiveTab('NEW')} 
                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                                activeTab === 'NEW' 
                                    ? 'bg-amber-50 text-amber-700 border-t border-l border-r border-slate-200' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Edit3 size={16} />
                            <span className="hidden sm:inline">Nova Advertência</span>
                            <span className="sm:hidden">Nova</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('HISTORY')} 
                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                                activeTab === 'HISTORY' 
                                    ? 'bg-amber-50 text-amber-700 border-t border-l border-r border-slate-200' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <History size={16} />
                            <span className="hidden sm:inline">Histórico</span>
                            <span className="sm:hidden">Histórico</span>
                            {stats.total > 0 && (
                                <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                                    {stats.total}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Nova Advertência */}
                    {activeTab === 'NEW' && (
                        <div className="space-y-6">
                            {/* Painel de Configuração */}
                            <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-slate-600">
                                            Colaborador *
                                        </label>
                                        <div className="relative">
                                            <LucideUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <select 
                                                className="w-full border border-slate-200 pl-9 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                                value={selectedStaffId}
                                                onChange={e => setSelectedStaffId(e.target.value)}
                                            >
                                                <option value="">Selecione um colaborador...</option>
                                                {state.users.filter(u => u.status === 'ACTIVE').map(user => (
                                                    <option key={user.id} value={user.id}>{user.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-slate-600">
                                            Tipo de Advertência
                                        </label>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setWarningType('VERBAL')}
                                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${
                                                    warningType === 'VERBAL' 
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-md' 
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <MessageSquare size={14} />
                                                Verbal
                                            </button>
                                            <button 
                                                onClick={() => setWarningType('FORMAL')}
                                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${
                                                    warningType === 'FORMAL' 
                                                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-700 shadow-md' 
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Award size={14} />
                                                Formal
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-slate-600">
                                            Modelo Base
                                        </label>
                                        <select 
                                            className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            value={selectedTemplateId}
                                            onChange={e => setSelectedTemplateId(e.target.value)}
                                        >
                                            <option value="">Selecione um modelo...</option>
                                            {warningTemplates.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-end">
                                        <Button 
                                            onClick={handleSaveAndPrint}
                                            className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                                            disabled={!selectedStaffId || !content || isSaving}
                                        >
                                            {isSaving ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Salvando...
                                                </div>
                                            ) : (
                                                <>
                                                    <Send size={18} />
                                                    <span className="hidden sm:inline">Lançar e Imprimir</span>
                                                    <span className="sm:hidden">Lançar</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Editor de Conteúdo */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-3">
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setIsPreviewMode(false)}
                                            className={`flex items-center gap-2 text-sm font-bold pb-2 border-b-2 transition-all ${
                                                !isPreviewMode 
                                                    ? 'border-amber-500 text-amber-600' 
                                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                            }`}
                                        >
                                            <Edit3 size={14} /> Editar Texto
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (selectedTemplateId) setIsPreviewMode(true);
                                                else showAlert({ title: "Atenção", message: "Selecione um modelo para visualizar.", type: "WARNING" });
                                            }}
                                            className={`flex items-center gap-2 text-sm font-bold pb-2 border-b-2 transition-all ${
                                                isPreviewMode 
                                                    ? 'border-amber-500 text-amber-600' 
                                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                            } ${!selectedTemplateId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Eye size={14} /> Visualizar
                                        </button>
                                    </div>
                                    {!isPreviewMode && (
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <AlertTriangle size={12} />
                                            Use as variáveis abaixo para personalizar
                                        </div>
                                    )}
                                </div>

                                {!isPreviewMode ? (
                                    <div className="h-[450px] sm:h-[500px] bg-white rounded-2xl shadow-inner overflow-hidden border border-slate-200">
                                        <ReactQuill 
                                            theme="snow"
                                            value={content}
                                            onChange={setContent}
                                            className="h-[400px] sm:h-[450px]"
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, 3, false] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{ 'align': [] }],
                                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                    ['clean']
                                                ]
                                            }}
                                            placeholder="O conteúdo da advertência aparecerá aqui após selecionar um modelo..."
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-[450px] sm:h-[500px] border border-slate-200 p-4 sm:p-8 rounded-2xl bg-white overflow-y-auto shadow-inner prose prose-slate max-w-none">
                                        <div 
                                            dangerouslySetInnerHTML={{ 
                                                __html: (() => {
                                                    const company = restState.businessInfo;
                                                    const role = state.hrJobRoles.find(r => r.id === selectedStaff?.hrJobRoleId);
                                                    const roleName = role ? role.title : (selectedStaff?.customRoleName || '');
                                                    const shift = state.shifts.find(s => s.id === selectedStaff?.shiftId);
                                                    const shiftName = shift ? shift.name : '';
                                                    
                                                    return DOMPurify.sanitize(replaceContractVariables(content, selectedStaff as any, company, roleName, shiftName)
                                                        .replace(/\{\{\s*data\s*\}\}/g, new Date().toLocaleDateString('pt-BR'))
                                                        .replace(/\{\{\s*tipo_advertencia\s*\}\}/g, warningType === 'VERBAL' ? 'VERBAL' : 'ESCRITA/FORMAL'));
                                                })()
                                            }} 
                                        />
                                    </div>
                                )}

                                {/* Variáveis Rápidas */}
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2">
                                        <Download size={12} />
                                        VARIÁVEIS DISPONÍVEIS (clique para inserir)
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                        {[
                                            { label: 'Nome', code: '{{nome}}', icon: LucideUser },
                                            { label: 'CPF', code: '{{cpf}}', icon: CheckCircle },
                                            { label: 'Cargo', code: '{{cargo}}', icon: Briefcase },
                                            { label: 'Data Atual', code: '{{data}}', icon: Calendar },
                                            { label: 'Turno', code: '{{turno}}', icon: Clock },
                                            { label: 'Tipo', code: '{{tipo_advertencia}}', icon: AlertTriangle },
                                            { label: 'Salário', code: '{{salario}}', icon: DollarSign },
                                            { label: 'Data Admissão', code: '{{data_admissao}}', icon: Calendar },
                                        ].map(v => (
                                            <button 
                                                key={v.code}
                                                onClick={() => setContent(prev => prev + v.code)}
                                                className="flex items-center gap-2 text-[10px] sm:text-xs font-medium bg-white hover:bg-amber-50 p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200 transition-all"
                                            >
                                                <v.icon size={12} />
                                                <code className="text-blue-600">{v.code}</code>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Histórico */}
                    {activeTab === 'HISTORY' && (
                        <div className="space-y-6">
                            {/* Filtros */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por colaborador..."
                                        value={historySearch}
                                        onChange={(e) => setHistorySearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="relative sm:w-48">
                                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={historyFilter}
                                        onChange={(e) => setHistoryFilter(e.target.value as any)}
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="ALL">Todos os tipos</option>
                                        <option value="VERBAL">Verbais</option>
                                        <option value="FORMAL">Formais</option>
                                    </select>
                                    <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
                                </div>
                                <div className="relative sm:w-64">
                                    <LucideUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select 
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        value={selectedStaffId}
                                        onChange={e => setSelectedStaffId(e.target.value)}
                                    >
                                        <option value="">Todos os funcionários</option>
                                        {state.users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Versão Desktop - Tabela */}
                            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                                            <th className="p-4 font-bold">Data</th>
                                            <th className="p-4 font-bold">Colaborador</th>
                                            <th className="p-4 font-bold">Tipo</th>
                                            <th className="p-4 font-bold">Conteúdo</th>
                                            <th className="p-4 font-bold text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredWarnings.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <FileText size={48} className="text-gray-300" />
                                                        <p className="text-gray-400 font-medium">Nenhum registro encontrado</p>
                                                        <p className="text-sm text-gray-400">Nenhuma advertência registrada para este filtro.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredWarnings.map(warning => {
                                                const staff = state.users.find(u => u.id === warning.staffId);
                                                return (
                                                    <tr key={warning.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                                                            {new Date(warning.createdAt).toLocaleDateString('pt-BR')}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-xs">
                                                                    {staff?.name?.charAt(0) || '?'}
                                                                </div>
                                                                <span className="font-medium text-slate-800">{staff?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                                                warning.type === 'VERBAL' 
                                                                    ? 'bg-amber-100 text-amber-700' 
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {warning.type === 'VERBAL' ? <MessageSquare size={10} /> : <Award size={10} />}
                                                                {warning.type === 'VERBAL' ? 'Verbal' : 'Formal'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div 
                                                                className="text-sm text-slate-600 line-clamp-2 max-w-md"
                                                                dangerouslySetInnerHTML={{ __html: warning.content.substring(0, 100) + (warning.content.length > 100 ? '...' : '') }}
                                                            />
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => handleViewWarning(warning)} 
                                                                    className="p-2 hover:bg-white rounded-lg text-blue-600 border border-transparent hover:border-blue-200 transition-all"
                                                                    title="Imprimir/Visualizar"
                                                                >
                                                                    <Printer size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteWarning(warning.id)} 
                                                                    className="p-2 hover:bg-white rounded-lg text-red-600 border border-transparent hover:border-red-200 transition-all"
                                                                    title="Excluir Registro"
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

                            {/* Versão Mobile - Cards */}
                            <div className="lg:hidden space-y-3">
                                {filteredWarnings.length === 0 ? (
                                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText size={48} className="text-gray-300" />
                                            <p className="text-gray-400 font-medium">Nenhum registro encontrado</p>
                                        </div>
                                    </div>
                                ) : (
                                    filteredWarnings.map(warning => {
                                        const staff = state.users.find(u => u.id === warning.staffId);
                                        const isMenuOpen = mobileMenuOpen === warning.id;
                                        
                                        return (
                                            <div key={warning.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold">
                                                            {staff?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-800">{staff?.name}</h3>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(warning.createdAt).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setMobileMenuOpen(isMenuOpen ? null : warning.id)}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical size={18} className="text-gray-500" />
                                                        </button>
                                                        
                                                        {isMenuOpen && (
                                                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 min-w-[140px]">
                                                                <button
                                                                    onClick={() => {
                                                                        handleViewWarning(warning);
                                                                        setMobileMenuOpen(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                                >
                                                                    <Printer size={14} /> Visualizar
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleDeleteWarning(warning.id);
                                                                        setMobileMenuOpen(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <Trash2 size={14} /> Excluir
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                                            warning.type === 'VERBAL' 
                                                                ? 'bg-amber-100 text-amber-700' 
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {warning.type === 'VERBAL' ? <MessageSquare size={10} /> : <Award size={10} />}
                                                            {warning.type === 'VERBAL' ? 'Verbal' : 'Formal'}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="text-xs text-slate-600 line-clamp-3"
                                                        dangerouslySetInnerHTML={{ __html: warning.content.substring(0, 150) + (warning.content.length > 150 ? '...' : '') }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Adicione estas importações que faltam
import { Briefcase, DollarSign, MoreVertical } from 'lucide-react';