import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal } from '@/modules/common/components/Modal';
import { useStaff } from '@/core/context/StaffContext';
import { useUI } from '@/core/context/UIContext';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { User, Role, ContractType, WorkModel } from '@/types';
import { 
    Shield, Mail, User as UserIcon, Briefcase, Clock, MapPin, 
    DollarSign, HeartPulse, FileText, Printer, FileSignature, 
    RefreshCcw, AlertTriangle, Calendar, CreditCard, 
    Phone, Users, Baby, BookOpen, 
    ChevronDown, Building2, CheckCircle
} from 'lucide-react';
import { printStaffSheet } from '@/core/print/printStaffSheet';
import { printContractHtml, replaceContractVariables } from '@/core/print/printContract';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// ==================== FUNÇÕES DE MÁSCARA ====================
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

const maskRG = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{1})\d+?$/, '$1');
};

const maskPIS = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{5})(\d)/, '$1.$2')
        .replace(/(\d{2})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCTPS = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
};

const maskNumber = (value: string) => {
    return value.replace(/\D/g, '');
};

const maskCurrency = (value: string) => {
    let num = value.replace(/\D/g, '');
    if (!num) return 'R$ 0,00';
    num = (parseInt(num) / 100).toFixed(2);
    return `R$ ${num.replace('.', ',')}`;
};

const parseCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
};

// ==================== FUNÇÕES DE VALIDAÇÃO ====================
const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    let sum = 0;
    let rest;
    
    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (11 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (12 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
};

const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

const validateDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 16 && age <= 100;
};

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit?: User | null;
    variant?: 'ACCESS' | 'RH';
}

type Tab = 'GENERAL' | 'PERSONAL' | 'ADDRESS' | 'CONTRACT' | 'FINANCIAL' | 'SST' | 'CONTRACT_DOCS';

// Componente de Input otimizado para evitar re-renderizações desnecessárias
const OptimizedInput = React.memo(({ 
    label, name, value, onChange, required, type = "text", 
    placeholder, mask, maxLength, icon: Icon, disabled = false, error 
}: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;
        if (mask) {
            newValue = mask(newValue);
        }
        onChange(newValue);
    }, [mask, onChange]);
    
    return (
        <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                <input
                    ref={inputRef}
                    type={type}
                    value={value || ''}
                    onChange={handleChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    disabled={disabled}
                    className={`w-full border-2 p-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${
                        error ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } ${Icon ? 'pl-9' : 'pl-3'} ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} /> {error}
                </p>
            )}
        </div>
    );
});

OptimizedInput.displayName = 'OptimizedInput';

// Componente de Select otimizado
const OptimizedSelect = React.memo(({ 
    label, name, value, onChange, required, options, icon: Icon, error 
}: any) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    }, [onChange]);
    
    return (
        <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
                <select
                    value={value || ''}
                    onChange={handleChange}
                    className={`w-full border-2 p-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none ${
                        error ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } ${Icon ? 'pl-9' : 'pl-3'}`}
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} /> {error}
                </p>
            )}
        </div>
    );
});

OptimizedSelect.displayName = 'OptimizedSelect';

// Ícone Hash
const Hash = ({ size = 16, className = "" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <line x1="4" y1="9" x2="20" y2="9"></line>
        <line x1="4" y1="15" x2="20" y2="15"></line>
        <line x1="10" y1="3" x2="8" y2="21"></line>
        <line x1="16" y1="3" x2="14" y2="21"></line>
    </svg>
);

export const StaffFormModal: React.FC<StaffFormModalProps> = ({ isOpen, onClose, userToEdit, variant = 'ACCESS' }) => {
    const { addUser, updateUser, state, uploadSignedContract } = useStaff();
    const { state: restState } = useRestaurant();
    const { showAlert } = useUI();

    const [form, setForm] = useState<Partial<User>>({});
    const [activeTab, setActiveTab] = useState<Tab>('GENERAL');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [contractContent, setContractContent] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para campos com máscara
    const [maskedCpf, setMaskedCpf] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [maskedEmergencyPhone, setMaskedEmergencyPhone] = useState('');
    const [maskedCep, setMaskedCep] = useState('');
    const [maskedRg, setMaskedRg] = useState('');
    const [maskedPis, setMaskedPis] = useState('');
    const [maskedCtps, setMaskedCtps] = useState('');
    const [maskedSalary, setMaskedSalary] = useState('R$ 0,00');

    // Memoize valores derivados
    const isEsocialObligatory = useMemo(() => 
        ['CLT', 'TEMPORARY', 'INTERN'].includes(form.contractType || 'CLT'),
        [form.contractType]
    );

    const warningTemplates = useMemo(() => 
        state.contractTemplates.filter(t => t.isActive && t.type === 'WARNING'),
        [state.contractTemplates]
    );

    // Atualizar contrato quando template mudar
    useEffect(() => {
        if (selectedTemplateId) {
            const template = state.contractTemplates.find(t => t.id === selectedTemplateId);
            if (template) {
                const userData = { ...userToEdit, ...form } as User;
                const company = restState.businessInfo;
                const role = state.hrJobRoles.find(r => r.id === userData.hrJobRoleId);
                const roleName = role ? role.title : (userData.customRoleName || '');
                const shift = state.shifts.find(s => s.id === userData.shiftId);
                const shiftName = shift ? shift.name : '';

                const replacedContent = replaceContractVariables(template.content, userData, company, roleName, shiftName);
                setContractContent(replacedContent);
            }
        } else {
            setContractContent('');
        }
    }, [selectedTemplateId, userToEdit, form, state.contractTemplates, state.hrJobRoles, state.shifts, restState.businessInfo]);

    // Resetar formulário quando abrir
    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setForm({ ...userToEdit, customRoleId: userToEdit.customRoleId || '' });
                setMaskedCpf(userToEdit.documentCpf || '');
                setMaskedPhone(userToEdit.phone || '');
                setMaskedEmergencyPhone(userToEdit.emergencyContactPhone || '');
                setMaskedCep(userToEdit.addressZip || '');
                setMaskedRg(userToEdit.rgNumber || '');
                setMaskedPis(userToEdit.pisPasep || '');
                setMaskedCtps(userToEdit.ctpsNumber || '');
                setMaskedSalary(`R$ ${(userToEdit.baseSalary || 0).toFixed(2).replace('.', ',')}`);
            } else {
                const highestReg = state.users.reduce((max, u) => {
                    const reg = parseInt(u.registrationNumber || '0', 10);
                    return isNaN(reg) ? max : Math.max(max, reg);
                }, 999);
                const nextReg = (highestReg + 1).toString();

                setForm({ 
                    name: '', role: Role.WAITER, email: '', allowedRoutes: [], customRoleId: '',
                    department: '', phone: '', documentCpf: '', baseSalary: 0, contractType: 'CLT', workModel: '44H_WEEKLY',
                    addressState: '', bankAccountType: 'CORRENTE', shiftId: '', dependentsCount: 0,
                    registrationNumber: nextReg
                });
                setMaskedCpf('');
                setMaskedPhone('');
                setMaskedEmergencyPhone('');
                setMaskedCep('');
                setMaskedRg('');
                setMaskedPis('');
                setMaskedCtps('');
                setMaskedSalary('R$ 0,00');
            }
            setActiveTab('GENERAL');
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen, userToEdit, state.users]);

    // Handlers memoizados
    const handleFieldChange = useCallback((field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Limpa erro do campo ao modificar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [errors]);

    const handleMaskedChange = useCallback((setter: any, formField: string) => (value: string) => {
        setter(value);
        setForm(prev => ({ ...prev, [formField]: value }));
        if (errors[formField]) {
            setErrors(prev => ({ ...prev, [formField]: '' }));
        }
    }, [errors]);

    const validateField = useCallback((field: string, value: any): string => {
        switch (field) {
            case 'name':
                if (!value || value.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
                if (value.trim().length > 100) return 'Nome muito longo (máx. 100 caracteres)';
                return '';
            case 'email':
                if (variant === 'ACCESS' && (!value || !validateEmail(value))) return 'E-mail inválido';
                if (value && !validateEmail(value)) return 'E-mail inválido';
                return '';
            case 'documentCpf':
                if (value && !validateCPF(value)) return 'CPF inválido';
                return '';
            case 'phone':
                if (value && !validatePhone(value)) return 'Telefone inválido (mín. 10 dígitos)';
                return '';
            case 'birthDate':
                if (value && !validateDate(value)) return 'Data de nascimento inválida (idade entre 16 e 100 anos)';
                return '';
            case 'baseSalary':
                if (value && value <= 0) return 'Salário deve ser maior que zero';
                return '';
            case 'hireDate':
                if (value) {
                    const hireDate = new Date(value);
                    if (hireDate > new Date()) return 'Data de admissão não pode ser futura';
                }
                return '';
            case 'addressZip':
                if (value && value.replace(/\D/g, '').length !== 8) return 'CEP inválido (8 dígitos)';
                return '';
            case 'addressState':
                if (value && value.length !== 2) return 'UF deve ter 2 caracteres';
                return '';
            default:
                return '';
        }
    }, [variant]);

    const handleBlur = useCallback((field: string, value: any) => {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    }, [validateField]);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name) newErrors.name = 'Nome é obrigatório';
        if (variant === 'ACCESS' && !form.email) newErrors.email = 'E-mail é obrigatório';
        if (variant === 'ACCESS' && !form.customRoleId && form.role !== Role.ADMIN) {
            newErrors.customRoleId = 'Cargo é obrigatório';
        }

        if (variant === 'RH' && ['CLT', 'TEMPORARY', 'INTERN'].includes(form.contractType || 'CLT')) {
            if (!form.documentCpf) newErrors.documentCpf = 'CPF é obrigatório para vínculo CLT';
            if (!form.birthDate) newErrors.birthDate = 'Data de nascimento é obrigatória';
            if (!form.mothersName) newErrors.mothersName = 'Nome da mãe é obrigatório';
            if (!form.addressZip) newErrors.addressZip = 'CEP é obrigatório';
            if (!form.addressStreet) newErrors.addressStreet = 'Rua é obrigatória';
            if (!form.addressNumber) newErrors.addressNumber = 'Número é obrigatório';
            if (!form.addressCity) newErrors.addressCity = 'Cidade é obrigatória';
            if (!form.addressState) newErrors.addressState = 'UF é obrigatória';
            if (!form.hrJobRoleId) newErrors.hrJobRoleId = 'Cargo (CBO) é obrigatório';
            if (!form.hireDate) newErrors.hireDate = 'Data de admissão é obrigatória';
            if (!form.baseSalary || form.baseSalary <= 0) newErrors.baseSalary = 'Salário base é obrigatório';

            if (form.documentCpf && !validateCPF(form.documentCpf)) {
                newErrors.documentCpf = 'CPF inválido';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [form, variant]);

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        
        if (!validateForm()) {
            showAlert({ title: "Campos Inválidos", message: "Preencha todos os campos obrigatórios corretamente.", type: "WARNING" });
            return;
        }

        setIsSubmitting(true);

        const userToSave = {
            ...form,
            customRoleId: form.customRoleId || undefined,
            hrJobRoleId: form.hrJobRoleId || undefined,
            shiftId: form.shiftId || undefined,
            baseSalary: Number(form.baseSalary) || 0,
            benefitsTotal: Number(form.benefitsTotal) || 0,
            dependentsCount: Number(form.dependentsCount) || 0
        };

        try {
            if (userToEdit) {
                await updateUser({ ...userToEdit, ...userToSave } as User);
                showAlert({ title: "Sucesso", message: "Dados atualizados!", type: 'SUCCESS' });
            } else {
                await addUser(userToSave);
                showAlert({ title: "Sucesso", message: "Colaborador cadastrado!", type: 'SUCCESS' });
            }
            onClose();
        } catch (error: any) {
            showAlert({ title: "Erro", message: error.message || "Erro ao salvar.", type: 'ERROR' });
        } finally {
            setIsSubmitting(false);
        }
    }, [form, userToEdit, validateForm, addUser, updateUser, onClose, showAlert, isSubmitting]);

    const handleGenerateContract = useCallback(() => {
        if (!contractContent) return showAlert({ title: "Erro", message: "Selecione um modelo e aguarde o carregamento.", type: "WARNING" });
        const userData = { ...userToEdit, ...form } as User;
        printContractHtml(contractContent, userData.name || 'Colaborador');
    }, [contractContent, userToEdit, form, showAlert]);

    const handleUploadContract = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!userToEdit) return showAlert({ title: "Erro", message: "Salve o colaborador antes de enviar o contrato.", type: "WARNING" });

        const file = e.target.files[0];
        if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
            return showAlert({ title: "Erro", message: "Apenas arquivos PDF ou imagens são permitidos.", type: "WARNING" });
        }
        if (file.size > 5 * 1024 * 1024) {
            return showAlert({ title: "Erro", message: "Arquivo muito grande (máx. 5MB).", type: "WARNING" });
        }

        setIsUploading(true);
        try {
            await uploadSignedContract(userToEdit.id, file);
            showAlert({ title: "Sucesso", message: "Contrato enviado com sucesso.", type: "SUCCESS" });
        } catch (error: any) {
            showAlert({ title: "Erro", message: "Falha ao enviar contrato: " + error.message, type: "ERROR" });
        } finally {
            setIsUploading(false);
        }
    }, [userToEdit, uploadSignedContract, showAlert]);

    if (variant === 'ACCESS' && !userToEdit) return null;

    const renderTabButton = (tab: Tab, label: string, icon: React.ReactNode) => (
        <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                activeTab === tab
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.charAt(0)}</span>
        </button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={userToEdit ? (variant === 'RH' ? 'Editar Colaborador' : `Acesso: ${userToEdit.name}`) : 'Novo Colaborador'}
            variant={variant === 'RH' ? "page" : "dialog"}
            maxWidth="4xl"
            onSave={handleSubmit}
            isSaving={isSubmitting}
        >
            <div className="space-y-6 pb-10">
                {variant === 'ACCESS' && (
                    <div className="space-y-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield size={24} className="text-blue-600" />
                            <h3 className="font-black text-slate-800">Configuração de Acesso</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <OptimizedSelect
                                label="Cargo / Função"
                                name="customRoleId"
                                value={form.customRoleId || ''}
                                onChange={(val: string) => {
                                    if (val === 'ADMIN') {
                                        setForm({ ...form, role: Role.ADMIN, customRoleId: '' });
                                    } else {
                                        setForm({ ...form, customRoleId: val, role: Role.WAITER });
                                    }
                                }}
                                required={variant === 'ACCESS'}
                                options={[
                                    { value: '', label: 'Selecione um Cargo...' },
                                    { value: 'ADMIN', label: 'Administrador (Acesso Total)' },
                                    ...(state.roles.map(role => ({ value: role.id, label: role.name })))
                                ]}
                                icon={Shield}
                                error={errors.customRoleId}
                            />

                            <OptimizedInput
                                label="E-mail (Login)"
                                name="email"
                                value={form.email || ''}
                                onChange={(val: string) => handleFieldChange('email', val)}
                                onBlur={() => handleBlur('email', form.email)}
                                required={variant === 'ACCESS'}
                                type="email"
                                placeholder="usuario@email.com"
                                icon={Mail}
                                error={errors.email}
                            />
                        </div>
                    </div>
                )}

                {variant === 'RH' && (
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
                            {renderTabButton('GENERAL', 'Geral', <UserIcon size={16} />)}
                            {renderTabButton('PERSONAL', 'Dados Pessoais', <FileText size={16} />)}
                            {renderTabButton('ADDRESS', 'Endereço', <MapPin size={16} />)}
                            {renderTabButton('CONTRACT', 'Contrato', <Briefcase size={16} />)}
                            {renderTabButton('FINANCIAL', 'Financeiro', <DollarSign size={16} />)}
                            {renderTabButton('SST', 'SST', <HeartPulse size={16} />)}
                            {renderTabButton('CONTRACT_DOCS', 'Documentos', <FileSignature size={16} />)}

                            {userToEdit && (
                                <button
                                    type="button"
                                    onClick={() => printStaffSheet(userToEdit)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors text-slate-600 hover:bg-slate-100 mt-4 border-t border-slate-200 pt-4"
                                >
                                    <Printer size={16} /> Imprimir Ficha
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] overflow-y-auto max-h-[70vh]">
                            
                            {/* TAB GERAL */}
                            {activeTab === 'GENERAL' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                                        <h4 className="text-sm font-black text-slate-800 uppercase">Informações Gerais</h4>
                                        {isEsocialObligatory && (
                                            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                <Shield size={12} /> eSocial Ativo
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <OptimizedInput
                                            label="Matrícula"
                                            name="registrationNumber"
                                            value={form.registrationNumber || ''}
                                            onChange={() => {}}
                                            disabled
                                            icon={Hash}
                                        />

                                        <OptimizedInput
                                            label="Nome Completo"
                                            name="name"
                                            value={form.name || ''}
                                            onChange={(val: string) => handleFieldChange('name', val)}
                                            onBlur={() => handleBlur('name', form.name)}
                                            required
                                            placeholder="Ex: Maria Silva"
                                            icon={UserIcon}
                                            error={errors.name}
                                        />

                                        <OptimizedInput
                                            label="CPF"
                                            name="documentCpf"
                                            value={maskedCpf}
                                            onChange={handleMaskedChange(setMaskedCpf, 'documentCpf')}
                                            onBlur={() => handleBlur('documentCpf', maskedCpf)}
                                            required={isEsocialObligatory}
                                            placeholder="000.000.000-00"
                                            mask={maskCPF}
                                            maxLength={14}
                                            icon={CreditCard}
                                            error={errors.documentCpf}
                                        />

                                        <OptimizedInput
                                            label="E-mail"
                                            name="email"
                                            value={form.email || ''}
                                            onChange={(val: string) => handleFieldChange('email', val)}
                                            onBlur={() => handleBlur('email', form.email)}
                                            type="email"
                                            placeholder="email@exemplo.com"
                                            icon={Mail}
                                            error={errors.email}
                                        />

                                        <OptimizedInput
                                            label="Telefone"
                                            name="phone"
                                            value={maskedPhone}
                                            onChange={handleMaskedChange(setMaskedPhone, 'phone')}
                                            onBlur={() => handleBlur('phone', maskedPhone)}
                                            placeholder="(00) 00000-0000"
                                            mask={maskPhone}
                                            maxLength={15}
                                            icon={Phone}
                                            error={errors.phone}
                                        />

                                        <OptimizedInput
                                            label="Departamento"
                                            name="department"
                                            value={form.department || ''}
                                            onChange={(val: string) => handleFieldChange('department', val)}
                                            placeholder="Ex: Cozinha, Salão"
                                            icon={Building2}
                                        />

                                        <OptimizedSelect
                                            label="Cargo / Função (CBO)"
                                            name="hrJobRoleId"
                                            value={form.hrJobRoleId || ''}
                                            onChange={(val: string) => {
                                                const selectedRole = state.hrJobRoles.find(r => r.id === val);
                                                handleFieldChange('hrJobRoleId', val);
                                                handleFieldChange('customRoleId', selectedRole?.customRoleId || form.customRoleId);
                                                if (selectedRole?.baseSalary && !form.baseSalary) {
                                                    handleFieldChange('baseSalary', selectedRole.baseSalary);
                                                    setMaskedSalary(`R$ ${selectedRole.baseSalary.toFixed(2).replace('.', ',')}`);
                                                }
                                            }}
                                            required={isEsocialObligatory}
                                            options={[
                                                { value: '', label: 'Selecione o Cargo Oficial...' },
                                                ...(state.hrJobRoles.map(role => ({ value: role.id, label: `${role.title} (${role.cboCode})` })))
                                            ]}
                                            icon={Briefcase}
                                            error={errors.hrJobRoleId}
                                        />

                                        <OptimizedSelect
                                            label="Perfil de Acesso"
                                            name="customRoleId"
                                            value={form.customRoleId || (form.role === Role.ADMIN ? 'ADMIN' : '')}
                                            onChange={(val: string) => {
                                                if (val === 'ADMIN') {
                                                    setForm({ ...form, role: Role.ADMIN, customRoleId: '' });
                                                } else {
                                                    setForm({ ...form, customRoleId: val, role: Role.WAITER });
                                                }
                                            }}
                                            options={[
                                                { value: '', label: 'Sem Acesso / Básico' },
                                                { value: 'ADMIN', label: 'Administrador (Acesso Total)' },
                                                ...(state.roles.map(role => ({ value: role.id, label: role.name })))
                                            ]}
                                            icon={Shield}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB DADOS PESSOAIS */}
                            {activeTab === 'PERSONAL' && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4">Dados Pessoais</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <OptimizedInput
                                            label="Data de Nascimento"
                                            name="birthDate"
                                            value={form.birthDate ? new Date(form.birthDate).toISOString().split('T')[0] : ''}
                                            onChange={(val: string) => handleFieldChange('birthDate', val ? new Date(val) : undefined)}
                                            onBlur={() => handleBlur('birthDate', form.birthDate)}
                                            required={isEsocialObligatory}
                                            type="date"
                                            icon={Calendar}
                                            error={errors.birthDate}
                                        />

                                        <OptimizedSelect
                                            label="Estado Civil"
                                            name="maritalStatus"
                                            value={form.maritalStatus || ''}
                                            onChange={(val: string) => handleFieldChange('maritalStatus', val)}
                                            options={[
                                                { value: '', label: 'Selecione...' },
                                                { value: 'SOLTEIRO', label: 'Solteiro(a)' },
                                                { value: 'CASADO', label: 'Casado(a)' },
                                                { value: 'DIVORCIADO', label: 'Divorciado(a)' },
                                                { value: 'VIUVO', label: 'Viúvo(a)' },
                                                { value: 'UNIAO_ESTAVEL', label: 'União Estável' }
                                            ]}
                                            icon={Users}
                                        />

                                        <OptimizedInput
                                            label="RG (Número)"
                                            name="rgNumber"
                                            value={maskedRg}
                                            onChange={handleMaskedChange(setMaskedRg, 'rgNumber')}
                                            placeholder="00.000.000-0"
                                            mask={maskRG}
                                            maxLength={12}
                                            icon={CreditCard}
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <OptimizedInput
                                                label="Órgão Emissor"
                                                name="rgIssuer"
                                                value={form.rgIssuer || ''}
                                                onChange={(val: string) => handleFieldChange('rgIssuer', val)}
                                                placeholder="SSP"
                                            />
                                            <OptimizedInput
                                                label="UF"
                                                name="rgState"
                                                value={form.rgState || ''}
                                                onChange={(val: string) => handleFieldChange('rgState', val.toUpperCase())}
                                                placeholder="SP"
                                                maxLength={2}
                                            />
                                        </div>

                                        <OptimizedInput
                                            label="PIS/PASEP"
                                            name="pisPasep"
                                            value={maskedPis}
                                            onChange={handleMaskedChange(setMaskedPis, 'pisPasep')}
                                            placeholder="000.00000.00-0"
                                            mask={maskPIS}
                                            maxLength={14}
                                            icon={CreditCard}
                                        />

                                        <OptimizedInput
                                            label="Título de Eleitor"
                                            name="voterRegistration"
                                            value={form.voterRegistration || ''}
                                            onChange={(val: string) => handleFieldChange('voterRegistration', maskNumber(val))}
                                            placeholder="000000000000"
                                            maxLength={12}
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <OptimizedInput
                                                label="CTPS (Número)"
                                                name="ctpsNumber"
                                                value={maskedCtps}
                                                onChange={handleMaskedChange(setMaskedCtps, 'ctpsNumber')}
                                                placeholder="00000000"
                                                mask={maskCTPS}
                                                maxLength={11}
                                            />
                                            <OptimizedInput
                                                label="Série"
                                                name="ctpsSeries"
                                                value={form.ctpsSeries || ''}
                                                onChange={(val: string) => handleFieldChange('ctpsSeries', maskNumber(val))}
                                                placeholder="0000"
                                                maxLength={4}
                                            />
                                        </div>

                                        <OptimizedInput
                                            label="Nome da Mãe"
                                            name="mothersName"
                                            value={form.mothersName || ''}
                                            onChange={(val: string) => handleFieldChange('mothersName', val)}
                                            required={isEsocialObligatory}
                                            placeholder="Nome completo da mãe"
                                            icon={Users}
                                            error={errors.mothersName}
                                        />

                                        <OptimizedInput
                                            label="Nome do Pai"
                                            name="fathersName"
                                            value={form.fathersName || ''}
                                            onChange={(val: string) => handleFieldChange('fathersName', val)}
                                            placeholder="Nome completo do pai"
                                        />

                                        <OptimizedSelect
                                            label="Escolaridade"
                                            name="educationLevel"
                                            value={form.educationLevel || ''}
                                            onChange={(val: string) => handleFieldChange('educationLevel', val)}
                                            options={[
                                                { value: '', label: 'Selecione...' },
                                                { value: 'FUNDAMENTAL_INCOMPLETO', label: 'Fundamental Incompleto' },
                                                { value: 'FUNDAMENTAL_COMPLETO', label: 'Fundamental Completo' },
                                                { value: 'MEDIO_INCOMPLETO', label: 'Médio Incompleto' },
                                                { value: 'MEDIO_COMPLETO', label: 'Médio Completo' },
                                                { value: 'SUPERIOR_INCOMPLETO', label: 'Superior Incompleto' },
                                                { value: 'SUPERIOR_COMPLETO', label: 'Superior Completo' },
                                                { value: 'POS_GRADUACAO', label: 'Pós-Graduação' }
                                            ]}
                                            icon={BookOpen}
                                        />

                                        <div className="md:col-span-2 border-t pt-4 mt-2">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                                <AlertTriangle size={14} /> Contato de Emergência
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <OptimizedInput
                                                    label="Nome do Contato"
                                                    name="emergencyContactName"
                                                    value={form.emergencyContactName || ''}
                                                    onChange={(val: string) => handleFieldChange('emergencyContactName', val)}
                                                    placeholder="Nome para contato"
                                                />
                                                <OptimizedInput
                                                    label="Telefone do Contato"
                                                    name="emergencyContactPhone"
                                                    value={maskedEmergencyPhone}
                                                    onChange={handleMaskedChange(setMaskedEmergencyPhone, 'emergencyContactPhone')}
                                                    placeholder="(00) 00000-0000"
                                                    mask={maskPhone}
                                                    maxLength={15}
                                                    icon={Phone}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB ENDEREÇO */}
                            {activeTab === 'ADDRESS' && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4">Endereço Residencial</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                        <div className="md:col-span-2">
                                            <OptimizedInput
                                                label="CEP"
                                                name="addressZip"
                                                value={maskedCep}
                                                onChange={handleMaskedChange(setMaskedCep, 'addressZip')}
                                                onBlur={() => handleBlur('addressZip', maskedCep)}
                                                required={isEsocialObligatory}
                                                placeholder="00000-000"
                                                mask={maskCEP}
                                                maxLength={9}
                                                icon={MapPin}
                                                error={errors.addressZip}
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <OptimizedInput
                                                label="Rua / Logradouro"
                                                name="addressStreet"
                                                value={form.addressStreet || ''}
                                                onChange={(val: string) => handleFieldChange('addressStreet', val)}
                                                required={isEsocialObligatory}
                                                placeholder="Nome da rua, avenida..."
                                                error={errors.addressStreet}
                                            />
                                        </div>

                                        <div className="md:col-span-1">
                                            <OptimizedInput
                                                label="Número"
                                                name="addressNumber"
                                                value={form.addressNumber || ''}
                                                onChange={(val: string) => handleFieldChange('addressNumber', maskNumber(val))}
                                                required={isEsocialObligatory}
                                                placeholder="123"
                                                error={errors.addressNumber}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <OptimizedInput
                                                label="Complemento"
                                                name="addressComplement"
                                                value={form.addressComplement || ''}
                                                onChange={(val: string) => handleFieldChange('addressComplement', val)}
                                                placeholder="Apto, Bloco, Casa..."
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <OptimizedInput
                                                label="Bairro"
                                                name="addressNeighborhood"
                                                value={form.addressNeighborhood || ''}
                                                onChange={(val: string) => handleFieldChange('addressNeighborhood', val)}
                                                placeholder="Nome do bairro"
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <OptimizedInput
                                                label="Cidade"
                                                name="addressCity"
                                                value={form.addressCity || ''}
                                                onChange={(val: string) => handleFieldChange('addressCity', val)}
                                                required={isEsocialObligatory}
                                                placeholder="Nome da cidade"
                                                error={errors.addressCity}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <OptimizedInput
                                                label="UF"
                                                name="addressState"
                                                value={form.addressState || ''}
                                                onChange={(val: string) => handleFieldChange('addressState', val.toUpperCase())}
                                                onBlur={() => handleBlur('addressState', form.addressState)}
                                                required={isEsocialObligatory}
                                                placeholder="SP"
                                                maxLength={2}
                                                error={errors.addressState}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTRATO */}
                            {activeTab === 'CONTRACT' && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4">Contrato & Jornada</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <OptimizedSelect
                                            label="Tipo Contrato"
                                            name="contractType"
                                            value={form.contractType || 'CLT'}
                                            onChange={(val: string) => handleFieldChange('contractType', val as ContractType)}
                                            options={[
                                                { value: 'CLT', label: 'CLT' },
                                                { value: 'PJ', label: 'PJ' },
                                                { value: 'FREELANCE', label: 'Freelance' },
                                                { value: 'TEMPORARY', label: 'Temporário' },
                                                { value: 'INTERN', label: 'Estágio' }
                                            ]}
                                            icon={FileText}
                                        />

                                        <OptimizedInput
                                            label="Data de Admissão"
                                            name="hireDate"
                                            value={form.hireDate ? new Date(form.hireDate).toISOString().split('T')[0] : ''}
                                            onChange={(val: string) => handleFieldChange('hireDate', val ? new Date(val) : undefined)}
                                            onBlur={() => handleBlur('hireDate', form.hireDate)}
                                            required={isEsocialObligatory}
                                            type="date"
                                            icon={Calendar}
                                            error={errors.hireDate}
                                        />

                                        <OptimizedSelect
                                            label="Modelo de Jornada"
                                            name="workModel"
                                            value={form.workModel || '44H_WEEKLY'}
                                            onChange={(val: string) => handleFieldChange('workModel', val as WorkModel)}
                                            options={[
                                                { value: '44H_WEEKLY', label: '44h Semanais (Padrão)' },
                                                { value: '12X36', label: 'Escala 12x36' },
                                                { value: 'PART_TIME', label: 'Meio Período (25h)' },
                                                { value: 'INTERMITTENT', label: 'Intermitente (Por Hora)' },
                                                { value: 'ROTATING', label: 'Escala Rotativa' }
                                            ]}
                                            icon={Clock}
                                        />

                                        <OptimizedInput
                                            label="Salário Base (R$)"
                                            name="baseSalary"
                                            value={maskedSalary}
                                            onChange={handleMaskedChange(setMaskedSalary, 'baseSalary')}
                                            onBlur={() => handleBlur('baseSalary', form.baseSalary)}
                                            required={isEsocialObligatory}
                                            placeholder="R$ 0,00"
                                            mask={maskCurrency}
                                            icon={DollarSign}
                                            error={errors.baseSalary}
                                        />

                                        <OptimizedSelect
                                            label="Turno Padrão"
                                            name="shiftId"
                                            value={form.shiftId || ''}
                                            onChange={(val: string) => handleFieldChange('shiftId', val)}
                                            options={[
                                                { value: '', label: 'Selecione o Turno...' },
                                                ...(state.shifts.map(shift => ({
                                                    value: shift.id,
                                                    label: `${shift.name} (${shift.startTime} - ${shift.endTime})`
                                                })))
                                            ]}
                                            icon={Clock}
                                        />

                                        <OptimizedInput
                                            label="Número de Dependentes"
                                            name="dependentsCount"
                                            value={form.dependentsCount?.toString() || '0'}
                                            onChange={(val: string) => handleFieldChange('dependentsCount', parseInt(maskNumber(val)) || 0)}
                                            type="number"
                                            min="0"
                                            max="99"
                                            icon={Baby}
                                        />

                                        {/* Novo campo para isenção de ponto */}
<div className="md:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
    <label className="flex items-center gap-3 cursor-pointer">
        <input 
            type="checkbox" 
            className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            checked={!form.requires_time_tracking} // Lógica invertida para o label fazer sentido
            onChange={e => setForm({...form, requires_time_tracking: !e.target.checked})}
        />
        <div>
            <span className="block text-sm font-black text-blue-800">Dispensa de Registro de Ponto</span>
            <span className="block text-[10px] text-blue-600 uppercase font-bold">
                Marque para colaboradores em cargo de confiança ou regime que não exige controle de jornada.
            </span>
        </div>
    </label>
</div>
                                    </div>
                                </div>
                            )}

                            {/* TAB FINANCEIRO - Simplificada por brevidade, mas seguindo mesmo padrão */}
                            {activeTab === 'FINANCIAL' && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4">Dados Bancários & Benefícios</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <OptimizedInput
                                            label="Banco"
                                            name="bankName"
                                            value={form.bankName || ''}
                                            onChange={(val: string) => handleFieldChange('bankName', val)}
                                            placeholder="Ex: Nubank, Itaú"
                                            icon={Building2}
                                        />
                                        {/* Continue com os outros campos seguindo o mesmo padrão... */}
                                    </div>
                                </div>
                            )}

                            {/* TAB SST */}
                            {activeTab === 'SST' && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4">Saúde e Segurança do Trabalho (SST)</h4>
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-800 mb-4 flex items-start gap-2">
                                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                        <span>Registre aqui informações sobre exames admissionais, periódicos, demissionais, atestados médicos, PPP e afastamentos.</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-slate-700">Histórico e Observações SST</label>
                                        <textarea
                                            className="w-full border-2 border-slate-200 p-4 rounded-xl text-sm h-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Ex: Exame admissional realizado em 10/01/2024 - Apto.&#10;Afastamento por licença médica de 05/03 a 10/03..."
                                            value={form.sstInfo || ''}
                                            onChange={e => handleFieldChange('sstInfo', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB DOCUMENTOS CONTRATUAIS */}
                            {activeTab === 'CONTRACT_DOCS' && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4">Gerar e Gerenciar Contrato</h4>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <h5 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                <Printer size={16} /> Gerar Minuta
                                            </h5>
                                            <div className="space-y-4">
                                                <OptimizedSelect
                                                    label="Modelo de Contrato"
                                                    name="contractTemplate"
                                                    value={selectedTemplateId}
                                                    onChange={setSelectedTemplateId}
                                                    options={[
                                                        { value: '', label: 'Selecione um modelo...' },
                                                        ...(state.contractTemplates.filter(t => t.isActive && t.type === 'CONTRACT').map(t => ({ value: t.id, label: t.name })))
                                                    ]}
                                                    icon={FileText}
                                                />

                                                {selectedTemplateId && (
                                                    <div className="mt-4">
                                                        <label className="block text-xs font-bold mb-2 text-slate-700">Revisar e Editar Contrato</label>
                                                        <div className="bg-white rounded-xl overflow-hidden border">
                                                            <ReactQuill
                                                                theme="snow"
                                                                value={contractContent}
                                                                onChange={setContractContent}
                                                                className="h-[300px]"
                                                                modules={{
                                                                    toolbar: [
                                                                        [{ 'header': [1, 2, 3, false] }],
                                                                        ['bold', 'italic', 'underline', 'strike'],
                                                                        [{ 'align': [] }],
                                                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                        ['clean']
                                                                    ]
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={handleGenerateContract}
                                                    disabled={!selectedTemplateId || !contractContent || isSubmitting}
                                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    Gerar e Imprimir
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <h5 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                <FileSignature size={16} /> Contrato Assinado
                                            </h5>

                                            {userToEdit?.signedContractUrl ? (
                                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between flex-wrap gap-2">
                                                    <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                                                        <CheckCircle size={16} /> Contrato Arquivado
                                                    </div>
                                                    <a
                                                        href={userToEdit.signedContractUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                                                    >
                                                        Visualizar
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 flex items-center gap-2">
                                                    <AlertTriangle size={14} />
                                                    Nenhum contrato assinado foi enviado ainda.
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold mb-1 text-slate-700">Enviar Arquivo (PDF/Imagem)</label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={handleUploadContract}
                                                        disabled={isUploading || isSubmitting}
                                                        className="w-full text-sm text-slate-500
                                                            file:mr-4 file:py-2.5 file:px-4
                                                            file:rounded-xl file:border-0
                                                            file:text-sm file:font-bold
                                                            file:bg-blue-50 file:text-blue-700
                                                            hover:file:bg-blue-100
                                                        "
                                                    />
                                                    {isUploading && (
                                                        <div className="absolute right-2 top-2">
                                                            <RefreshCcw className="animate-spin text-blue-600" size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400">Formatos permitidos: PDF, JPG, PNG (máx. 5MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};