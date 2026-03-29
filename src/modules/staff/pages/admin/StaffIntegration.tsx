import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useStaff } from '@/core/context/StaffContext';
import { Button } from '@/modules/common/components/Button';
import { Modal } from '@/modules/common/components/Modal';
import { Network, Download, FileCode2, CheckCircle, AlertTriangle, User as UserIcon, Building2 } from 'lucide-react';
import { supabase } from '@/core/api/supabaseClient';
import { GlobalLoading } from '@/modules/common/components/GlobalLoading';
import { useUI } from '@/core/context/UIContext';
import { User } from '@/types';

export const StaffIntegration: React.FC = () => {
    const { state: restState } = useRestaurant();
    const { state: staffState } = useStaff();
    const { showAlert } = useUI();
    
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const { data, error } = await supabase
                    .from('global_settings')
                    .select('settings')
                    .eq('id', 'default')
                   .maybeSingle();

                if (error) throw error;

                if (data?.settings?.esocialTemplates) {
                    const parsed = typeof data.settings.esocialTemplates === 'string' 
                        ? JSON.parse(data.settings.esocialTemplates) 
                        : data.settings.esocialTemplates;
                    
                    if (Array.isArray(parsed)) {
                        setTemplates(parsed);
                    } else {
                        const arr = Object.entries(parsed).map(([code, tData]: [string, any]) => ({
                            id: tData.id || Math.random().toString(36).substr(2, 9),
                            code,
                            name: tData.name || code,
                            xmlTemplate: tData.xmlTemplate || tData
                        }));
                        setTemplates(arr);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch esocial templates", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    const openGenerateModal = (template: any) => {
        setSelectedTemplate(template);
        setSelectedStaffId('');
        setIsGenerateModalOpen(true);
    };

    const replaceVariables = (xml: string, staff?: User) => {
        const company = restState.businessInfo;
        const settings = staffState.legalSettings;
        let content = xml;

        // 1. Variáveis da Empresa (Empregador - S-1000)
        content = content.replace(/\{\{empresa_razaoSocial\}\}/g, company?.restaurantName || '');
        content = content.replace(/\{\{empresa_cnpj\}\}/g, (company?.cnpj || '').replace(/\D/g, ''));
        content = content.replace(/\{\{empresa_cnae\}\}/g, (settings?.esocialCnae || '').replace(/\D/g, ''));
        content = content.replace(/\{\{empresa_fpas\}\}/g, (settings?.esocialFpas || '').replace(/\D/g, ''));
        content = content.replace(/\{\{empresa_rat\}\}/g, (settings?.esocialRat || 1).toString());
        content = content.replace(/\{\{empresa_fap\}\}/g, (settings?.esocialFap || 1).toString());

        // 2. Variáveis do Trabalhador (S-2200, S-2230, S-2299, S-1200)
        if (staff) {
            const hrRole = staffState.hrJobRoles.find(r => r.id === staff.hrJobRoleId);
            const cbo = hrRole?.cboCode || '';
            const hireDate = staff.hireDate ? new Date(staff.hireDate).toISOString().split('T')[0] : '';
            const birthDate = staff.birthDate ? new Date(staff.birthDate).toISOString().split('T')[0] : '';

            content = content.replace(/\{\{cpf\}\}/g, (staff.documentCpf || '').replace(/\D/g, ''));
            content = content.replace(/\{\{nis\}\}/g, (staff.pisPasep || '').replace(/\D/g, ''));
            content = content.replace(/\{\{nome\}\}/g, staff.name || '');
            content = content.replace(/\{\{matricula\}\}/g, staff.registrationNumber || '');
            content = content.replace(/\{\{data_nascimento\}\}/g, birthDate);
            content = content.replace(/\{\{data_admissao\}\}/g, hireDate);
            content = content.replace(/\{\{cbo\}\}/g, cbo.replace(/\D/g, ''));
            content = content.replace(/\{\{salario_base\}\}/g, (staff.baseSalary || 0).toFixed(2));
            content = content.replace(/\{\{nome_mae\}\}/g, staff.mothersName || '');
            
            // Endereço
            content = content.replace(/\{\{cep\}\}/g, (staff.addressZip || '').replace(/\D/g, ''));
            content = content.replace(/\{\{logradouro\}\}/g, staff.addressStreet || '');
            content = content.replace(/\{\{numero\}\}/g, staff.addressNumber || '');
            content = content.replace(/\{\{bairro\}\}/g, staff.addressNeighborhood || '');
            content = content.replace(/\{\{cidade\}\}/g, staff.addressCity || '');
            content = content.replace(/\{\{uf\}\}/g, staff.addressState || '');
        }

        // 3. Remover tags vazias residuais caso o campo não exista
        return content;
    };

    const handleDownloadXML = () => {
        if (!selectedTemplate) return;

        // Se o molde NÃO for o S-1000 (Empresa), exige um colaborador
        const isCompanyEvent = selectedTemplate.code.includes('S-1000') || selectedTemplate.code.includes('S-1005');
        
        let staffToInject: User | undefined;
        
        if (!isCompanyEvent) {
            if (!selectedStaffId) {
                return showAlert({ title: "Atenção", message: "Selecione um colaborador para gerar este evento.", type: "WARNING" });
            }
            staffToInject = staffState.users.find(u => u.id === selectedStaffId);
        }

        try {
            const finalXML = replaceVariables(selectedTemplate.xmlTemplate, staffToInject);
            
            const blob = new Blob([finalXML], { type: 'application/xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const fileNameId = isCompanyEvent ? 'EMPRESA' : (staffToInject?.documentCpf || 'COLABORADOR').replace(/\D/g, '');
            a.download = `eSocial_${selectedTemplate.code}_${fileNameId}_${new Date().getTime()}.xml`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showAlert({ title: "Sucesso", message: "Ficheiro XML gerado com sucesso!", type: "SUCCESS" });
            setIsGenerateModalOpen(false);
        } catch (error) {
            showAlert({ title: "Erro", message: "Falha ao gerar o ficheiro XML.", type: "ERROR" });
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
            {/* Cabeçalho */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
                <div className="bg-blue-100 p-4 rounded-full text-blue-600 shrink-0">
                    <Network size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Integração e-Social (Mensageria)</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Gere os ficheiros XML obrigatórios para envio ao Governo. O sistema injeta automaticamente os dados do RH, Contratos e Tabelas Legais nos moldes oficiais.
                    </p>
                </div>
            </div>

            {/* Avisos de Configuração */}
            {(!staffState.legalSettings?.esocialCnae || !restState.businessInfo?.cnpj) && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-amber-800 text-sm">Dados da Empresa Incompletos</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            Faltam dados essenciais para os eventos do eSocial (CNPJ da empresa no Perfil ou CNAE/RAT nas Configurações Legais do RH). Os XMLs podem ser gerados com erros.
                        </p>
                    </div>
                </div>
            )}

            {/* Lista de Moldes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <FileCode2 size={18} className="text-blue-500" />
                        Eventos Disponíveis (Layout S-1.2)
                    </h3>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {templates.length} moldes prontos
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-12"><GlobalLoading message="Carregando moldes oficias do Governo..." /></div>
                ) : templates.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <AlertTriangle size={48} className="text-slate-300 mb-4" />
                        <p className="font-bold text-slate-600">Nenhum molde configurado</p>
                        <p className="text-sm mt-1">A administração do sistema ainda não injetou os esquemas XSD/XML.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {templates.map(t => {
                            const isCompanyEvent = t.code.includes('S-1000') || t.code.includes('S-1005');
                            return (
                            <div key={t.id} className="p-5 hover:bg-blue-50/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 font-mono font-black text-xs px-2 py-1 rounded border ${isCompanyEvent ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                        {t.code}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{t.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            {isCompanyEvent ? <Building2 size={12}/> : <UserIcon size={12}/>}
                                            {isCompanyEvent ? 'Evento de Empregador (Empresa)' : 'Evento de Trabalhador (Requer Colaborador)'}
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={() => openGenerateModal(t)} variant="outline" className="shrink-0 bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 opacity-0 group-hover:opacity-100 transition-all">
                                    <Download size={16} className="mr-2" /> Gerar XML
                                </Button>
                            </div>
                        )})}
                    </div>
                )}
            </div>

            {/* Modal de Geração */}
            <Modal 
                isOpen={isGenerateModalOpen} 
                onClose={() => setIsGenerateModalOpen(false)} 
                title={`Gerar Evento: ${selectedTemplate?.code}`}
                onSave={handleDownloadXML}
                saveText="Gerar e Descarregar XML"
            >
                <div className="space-y-6 pt-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-800">{selectedTemplate?.name}</h4>
                        <p className="text-xs text-blue-600 mt-1">O sistema vai preencher automaticamente as tags XML com os dados do banco de dados.</p>
                    </div>

                    {/* Exibe o selector de funcionário se não for um evento da empresa (S-1000) */}
                    {selectedTemplate && !selectedTemplate.code.includes('S-1000') && !selectedTemplate.code.includes('S-1005') ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Vincular a qual Colaborador?</label>
                            <select 
                                className="w-full border-2 p-3 rounded-xl bg-white focus:border-blue-500 outline-none text-sm"
                                value={selectedStaffId}
                                onChange={e => setSelectedStaffId(e.target.value)}
                            >
                                <option value="">Selecione um funcionário CLT...</option>
                                {staffState.users.filter(u => ['CLT', 'TEMPORARY', 'INTERN'].includes(u.contractType || '')).map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} - CPF: {user.documentCpf || 'Sem CPF'}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-2 italic">Apenas funcionários com vínculo ativo (CLT, Estágio ou Temporário) são listados para o eSocial.</p>
                        </div>
                    ) : (
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-3">
                            <Building2 className="text-purple-600" size={24}/>
                            <div>
                                <h5 className="font-bold text-purple-800 text-sm">Evento Matriz da Empresa</h5>
                                <p className="text-xs text-purple-600">Este evento puxará os dados globais configurados no seu CNPJ e Tabelas Legais.</p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};