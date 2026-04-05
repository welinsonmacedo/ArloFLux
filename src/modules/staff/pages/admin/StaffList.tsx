// src/modules/staff/pages/admin/StaffList.tsx
import React, { useState } from 'react';
import { useStaff } from '@/core/context/StaffContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { User, EmployeeStatus } from '@/types';
import { 
    Edit, Trash2, UserPlus, Building2, Calendar, 
    BadgeCheck, AlertCircle, Search, Filter, 
    ChevronDown, MoreVertical, Mail, Phone, 
    MapPin, DollarSign, Clock, UserCheck, UserX,
    Briefcase, CreditCard
} from 'lucide-react';
import { StaffFormModal } from '@/modules/common/components/modals/StaffFormModal';

export const StaffList: React.FC = () => {
    const { state: staffState, deleteUser } = useStaff();
    const { showConfirm } = useUI();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);

    // Função para calcular o status em tempo real baseado no banco de dados
    const getDynamicStatus = (user: User): EmployeeStatus => {
        const termination = staffState.terminations?.find(t => t.staffId === user.id && t.status === 'APPROVED');
        if (termination || user.status === 'TERMINATED') return 'TERMINATED';

        const today = new Date();
        const activeVacation = staffState.vacationSchedules?.find(v => {
            const start = new Date(v.startDate);
            const end = new Date(v.endDate);
            return v.staffId === user.id && v.status === 'APPROVED' && today >= start && today <= end;
        });
        if (activeVacation) return 'VACATION';

        return user.status || 'ACTIVE';
    };

    const getStatusStyle = (status: EmployeeStatus) => {
        switch(status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'ON_LEAVE': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'TERMINATED': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'VACATION': return 'bg-sky-50 text-sky-700 border-sky-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status: EmployeeStatus) => {
        switch(status) {
            case 'ACTIVE': return <UserCheck size={12} />;
            case 'ON_LEAVE': return <Clock size={12} />;
            case 'TERMINATED': return <UserX size={12} />;
            case 'VACATION': return <Calendar size={12} />;
            default: return null;
        }
    };

    const translateStatus = (status: EmployeeStatus) => {
        switch(status) {
            case 'ACTIVE': return 'Ativo';
            case 'ON_LEAVE': return 'Afastado';
            case 'TERMINATED': return 'Desligado';
            case 'VACATION': return 'Em Férias';
            default: return status;
        }
    };

    // Obter departamentos únicos para filtro
    const departments = ['all', ...new Set(staffState.users.map(u => u.department).filter(Boolean))];

    const filteredUsers = staffState.users.filter(user => {
        const dynamicStatus = getDynamicStatus(user);
        
        // Filtro por status
        if (activeTab === 'ACTIVE') {
            if (dynamicStatus === 'TERMINATED') return false;
        } else {
            if (dynamicStatus !== 'TERMINATED') return false;
        }

        // Filtro por busca
        if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !user.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !user.registrationNumber?.includes(searchTerm)) {
            return false;
        }

        // Filtro por departamento
        if (selectedDepartment !== 'all' && user.department !== selectedDepartment) {
            return false;
        }

        return true;
    });

    // Estatísticas rápidas
    const stats = {
        total: staffState.users.filter(u => getDynamicStatus(u) !== 'TERMINATED').length,
        active: staffState.users.filter(u => getDynamicStatus(u) === 'ACTIVE').length,
        vacation: staffState.users.filter(u => getDynamicStatus(u) === 'VACATION').length,
        onLeave: staffState.users.filter(u => getDynamicStatus(u) === 'ON_LEAVE').length,
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header com estatísticas */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                            Diretório de Colaboradores
                            <span className="text-sm font-normal bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {stats.total}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Gestão completa do quadro de funcionários.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setActiveTab('ACTIVE')}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                                    activeTab === 'ACTIVE' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <UserCheck size={16} />
                                <span className="hidden xs:inline">Ativos</span>
                                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                    {stats.active + stats.vacation + stats.onLeave}
                                </span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('INACTIVE')}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                                    activeTab === 'INACTIVE' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <UserX size={16} />
                                <span className="hidden xs:inline">Inativos</span>
                            </button>
                        </div>
                        
                        <Button 
                            onClick={() => { setEditingUser(null); setIsModalOpen(true); }} 
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-transparent shadow-lg hover:shadow-xl transition-all"
                        >
                            <UserPlus size={18} /> 
                            <span className="hidden sm:inline">Novo Colaborador</span>
                            <span className="sm:hidden">Novo</span>
                        </Button>
                    </div>
                </div>

                {/* Cards de estatísticas (mobile) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100">
                    <div className="bg-emerald-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <UserCheck size={18} className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-600">Ativos</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</p>
                    </div>
                    <div className="bg-sky-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <Calendar size={18} className="text-sky-600" />
                            <span className="text-xs font-bold text-sky-600">Férias</span>
                        </div>
                        <p className="text-2xl font-black text-sky-700 mt-1">{stats.vacation}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <Clock size={18} className="text-amber-600" />
                            <span className="text-xs font-bold text-amber-600">Afastados</span>
                        </div>
                        <p className="text-2xl font-black text-amber-700 mt-1">{stats.onLeave}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <UserX size={18} className="text-rose-600" />
                            <span className="text-xs font-bold text-rose-600">Desligados</span>
                        </div>
                        <p className="text-2xl font-black text-rose-700 mt-1">
                            {staffState.users.filter(u => getDynamicStatus(u) === 'TERMINATED').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Barra de busca e filtros */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, e-mail ou matrícula..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1 sm:flex-initial">
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            >
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>
                                        {dept === 'all' ? 'Todos os departamentos' : dept}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors lg:hidden"
                        >
                            <Filter size={18} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de colaboradores */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Versão Desktop - Tabela */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b">
                            <tr>
                                <th className="p-4">Matrícula</th>
                                <th className="p-4">Colaborador</th>
                                <th className="p-4">Cargo (CBO)</th>
                                <th className="p-4">Departamento</th>
                                <th className="p-4">Admissão & Contrato</th>
                                <th className="p-4">Salário Base</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => {
                                const status = getDynamicStatus(user);
                                const hrRole = staffState.hrJobRoles.find(r => r.id === user.hrJobRoleId);
                                
                                return (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 font-mono font-bold text-blue-600">
                                            {user.registrationNumber || '-'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Mail size={10} />
                                                        {user.email || 'Sem e-mail'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-700">
                                                {hrRole ? hrRole.title : (user.customRoleName || 'Não definido')}
                                            </div>
                                            {hrRole?.cboCode && (
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                    CBO: {hrRole.cboCode}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-gray-400"/>
                                                {user.department || '-'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Calendar size={12} className="text-gray-400"/>
                                                    {user.hireDate ? new Date(user.hireDate).toLocaleDateString() : '-'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <BadgeCheck size={12} className="text-blue-500"/>
                                                    {user.contractType || 'CLT'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-slate-700">
                                            <div className="flex items-center gap-1">
                                                <DollarSign size={14} className="text-emerald-500" />
                                                {(user.baseSalary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${getStatusStyle(status)}`}>
                                                {getStatusIcon(status)}
                                                {translateStatus(status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }} 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit size={16}/>
                                                </button>
                                                <button 
                                                    onClick={() => showConfirm({ 
                                                        title: 'Excluir Colaborador', 
                                                        message: 'Confirma exclusão? O histórico financeiro será mantido, mas o acesso será revogado.', 
                                                        onConfirm: () => deleteUser(user.id) 
                                                    })} 
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <UserX size={48} className="text-gray-300" />
                                            <p className="text-gray-400 font-medium">Nenhum colaborador encontrado</p>
                                            <p className="text-sm text-gray-400">Tente ajustar os filtros ou adicionar um novo colaborador</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Versão Mobile - Cards */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {filteredUsers.map(user => {
                        const status = getDynamicStatus(user);
                        const hrRole = staffState.hrJobRoles.find(r => r.id === user.hrJobRoleId);
                        const isMenuOpen = mobileMenuOpen === user.id;
                        
                        return (
                            <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                                                <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${getStatusStyle(status)}`}>
                                                    {getStatusIcon(status)}
                                                    {translateStatus(status)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={10} className="text-gray-400" />
                                                    <span>{hrRole ? hrRole.title : (user.customRoleName || 'Cargo não definido')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail size={10} className="text-gray-400" />
                                                    <span className="truncate">{user.email || 'Sem e-mail'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CreditCard size={10} className="text-gray-400" />
                                                    <span className="font-mono font-bold">
                                                        R$ {(user.baseSalary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <button
                                            onClick={() => setMobileMenuOpen(isMenuOpen ? null : user.id)}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical size={18} className="text-gray-500" />
                                        </button>
                                        
                                        {isMenuOpen && (
                                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 min-w-[140px]">
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setIsModalOpen(true);
                                                        setMobileMenuOpen(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                >
                                                    <Edit size={14} /> Editar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setMobileMenuOpen(null);
                                                        showConfirm({ 
                                                            title: 'Excluir Colaborador', 
                                                            message: 'Confirma exclusão?', 
                                                            onConfirm: () => deleteUser(user.id) 
                                                        });
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} /> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <Calendar size={12} />
                                        <span>Admissão: {user.hireDate ? new Date(user.hireDate).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <BadgeCheck size={12} />
                                        <span>{user.contractType || 'CLT'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <Building2 size={12} />
                                        <span>{user.department || 'Sem departamento'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500 font-mono">
                                        <span>Matrícula: {user.registrationNumber || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {filteredUsers.length === 0 && (
                        <div className="p-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <UserX size={48} className="text-gray-300" />
                                <p className="text-gray-400 font-medium">Nenhum colaborador encontrado</p>
                                <p className="text-sm text-gray-400">Tente ajustar os filtros</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <StaffFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userToEdit={editingUser} variant="RH" />
        </div>
    );
};