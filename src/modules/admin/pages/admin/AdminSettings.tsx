import React, { useState, useEffect } from "react"
import { useRestaurant } from "@/core/context/RestaurantContext"
import { useUI } from "@/core/context/UIContext"
import { useStaff } from '@/core/context/StaffContext'
import { Button } from "@/modules/common/components/Button"
import { Modal } from '@/modules/common/components/Modal'
import { 
  Building2, Save, MapPin, Phone, Mail, Globe, Hash, 
  CreditCard, Tags, Plus, Trash2, Truck, Palette, ShieldCheck, 
  Clock, Bell, Lock, Loader2, FileText, Users, Edit, Bike, AlertTriangle
} from "lucide-react"

// Importando sub-componentes se existirem
import { AdminMenuAppearance } from './AdminMenuAppearance';

type SettingsTab = 'COMPANY' | 'RULES' | 'DELIVERY' | 'FINANCE' | 'APPEARANCE' | 'SECURITY';

export const AdminSettings: React.FC = () => {
  const { state, updateBusinessInfo } = useRestaurant()
  const { state: staffState, saveLegalSettings } = useStaff()
  const { showAlert, showConfirm } = useUI()
  
  const { planLimits } = state; // Limites do Plano vindo do Contexto
  const [loading, setLoading] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('COMPANY')

  // Estado unificado do formulário
  const [form, setForm] = useState({
    restaurantName: "",
    ownerName: "",
    cnpj: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    address: { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
    orderGracePeriodMinutes: 2,
    adminPin: "",
    waiterNotificationMode: 'ALL',
    strictWaiterNotification: false,
    taxRegime: 'SIMPLES_NACIONAL',
    taxPercentage: 6.0,
    deliverySettings: [] as any[],
    paymentMethods: [] as any[],
    expenseCategories: [] as any[]
  })

  // Modais
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [methodForm, setMethodForm] = useState<any>({ id: '', name: '', type: 'OWN', feeType: 'FIXED', feeValue: 0, feeBehavior: 'ADD_TO_TOTAL', isActive: true, estimatedTimeMin: 30, estimatedTimeMax: 45 })
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState<any>({ id: '', name: '', type: 'CREDIT', feePercentage: 0, isActive: true })
  const [newCategoryName, setNewCategoryName] = useState('')

  // Sincronização de dados do banco para o formulário local
  useEffect(() => {
    if (state.businessInfo) {
      setForm(prev => ({
        ...prev,
        ...state.businessInfo,
        address: state.businessInfo.address || prev.address,
        deliverySettings: state.businessInfo.deliverySettings || [],
        paymentMethods: state.businessInfo.paymentMethods || [],
        expenseCategories: state.businessInfo.expenseCategories || []
      }))
    }
  }, [state.businessInfo])

  // --- Definição de Abas permitidas pelo Plano ---
  const availableTabs = [
    { id: 'COMPANY', label: 'Empresa', icon: Building2, allowed: true },
    { id: 'RULES', label: 'Regras', icon: Clock, allowed: true },
    { id: 'DELIVERY', label: 'Delivery', icon: Truck, allowed: planLimits?.allowCashier },
    { id: 'FINANCE', label: 'Financeiro', icon: CreditCard, allowed: planLimits?.allowExpenses },

    { id: 'SECURITY', label: 'Segurança', icon: Lock, allowed: true },
  ].filter(tab => tab.allowed);

  // --- Lógica de Ações ---
  const handleSaveAll = async () => {
    setLoading(true)
    try {
      await updateBusinessInfo(form)
      showAlert({ title: 'Sucesso', message: 'Configurações atualizadas!', type: 'SUCCESS' })
    } catch (e) {
      showAlert({ title: 'Erro', message: 'Erro ao salvar dados.', type: 'ERROR' })
    } finally {
      setLoading(false)
    }
  }

  const handleCepBlur = async () => {
    const cep = form.address?.cep?.replace(/\D/g, '');
    if (cep && cep.length === 8) {
        setLoadingCep(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setForm(prev => ({...prev, address: {...prev.address, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf}}));
            }
        } catch (e) { console.error(e); } finally { setLoadingCep(false); }
    }
  }

  const formatCNPJ = (val: string) => val.replace(/\D/g, '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").slice(0, 18);
  const formatPhone = (val: string) => val.replace(/\D/g, '').replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").slice(0, 15);
  const formatCEP = (val: string) => val.replace(/\D/g, '').replace(/^(\d{5})(\d{3})/, "$1-$2").slice(0, 9);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      
      {/* Menu de Abas Superior Filtrado pelo Plano */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        {availableTabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingsTab)} 
            className={`flex flex-col items-center gap-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all 
              ${activeTab === tab.id 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' 
                : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <tab.icon size={18}/> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200">
        
        {/* --- ABA EMPRESA --- */}
        {activeTab === 'COMPANY' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="text-xs font-black text-blue-800 uppercase mb-4 flex items-center gap-2"><FileText size={16}/> Regime Tributário</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm bg-white font-bold" value={form.taxRegime} onChange={e => setForm({...form, taxRegime: e.target.value})}>
                        <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                        <option value="MEI">MEI (Microempreendedor Individual)</option>
                        <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                    </select>
                    <div className="relative">
                        <input type="number" step="0.01" className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm bg-white font-bold" value={form.taxPercentage} onChange={e => setForm({...form, taxPercentage: parseFloat(e.target.value)})}/>
                        <span className="absolute right-4 top-3.5 text-blue-400 font-bold">%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Razão Social</label><input className="w-full border-2 p-3 rounded-xl mt-1" value={form.restaurantName} onChange={e => setForm({...form, restaurantName: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Nome Responsável</label><input className="w-full border-2 p-3 rounded-xl mt-1" value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">CNPJ</label><input className="w-full border-2 p-3 rounded-xl mt-1" value={form.cnpj} onChange={e => setForm({...form, cnpj: formatCNPJ(e.target.value)})} maxLength={18} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Telefone</label><input className="w-full border-2 p-3 rounded-xl mt-1" value={form.phone} onChange={e => setForm({...form, phone: formatPhone(e.target.value)})} maxLength={15} /></div>
            </div>

            <div className="pt-6 border-t space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><MapPin size={18} className="text-emerald-500"/> Localização</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <input placeholder="CEP" className="w-full border-2 p-3 rounded-xl" value={form.address.cep} onChange={e => setForm({...form, address: {...form.address, cep: formatCEP(e.target.value)}})} onBlur={handleCepBlur} maxLength={9} />
                        {loadingCep && <Loader2 size={16} className="absolute right-3 top-4 animate-spin text-emerald-500"/>}
                    </div>
                    <input placeholder="Rua" className="md:col-span-2 border-2 p-3 rounded-xl bg-slate-50" value={form.address.street} readOnly />
                    <input placeholder="Nº" className="border-2 p-3 rounded-xl" value={form.address.number} onChange={e => setForm({...form, address: {...form.address, number: e.target.value}})} />
                    <input placeholder="Bairro" className="border-2 p-3 rounded-xl bg-slate-50" value={form.address.neighborhood} readOnly />
                    <input placeholder="Cidade" className="md:col-span-2 border-2 p-3 rounded-xl bg-slate-50" value={form.address.city} readOnly />
                    <input placeholder="UF" className="border-2 p-3 rounded-xl bg-slate-50 text-center uppercase" value={form.address.state} readOnly maxLength={2} />
                </div>
            </div>
          </div>
        )}

        {/* --- ABA REGRAS --- */}
        {activeTab === 'RULES' && (
          <div className="space-y-8 animate-fade-in">
             <div className="bg-slate-50 p-6 rounded-2xl border-2 border-blue-100">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Clock className="text-blue-500"/> Carência de Cancelamento</h4>
                <p className="text-xs text-slate-500 mb-6">Tempo que o cliente pode cancelar o pedido sozinho pelo celular.</p>
                <div className="flex items-center gap-6">
                    <input type="range" min="0" max="10" step="1" className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none accent-blue-600" value={form.orderGracePeriodMinutes} onChange={e => setForm({...form, orderGracePeriodMinutes: parseInt(e.target.value)})} />
                    <span className="text-2xl font-black text-blue-600 w-16 text-center">{form.orderGracePeriodMinutes}m</span>
                </div>
             </div>

             <div className="bg-slate-50 p-6 rounded-2xl border-2 border-orange-100">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Bell className="text-orange-500"/> Notificação de Garçom</h4>
                <div className="space-y-4">
                    <select className="w-full border-2 p-3 rounded-xl bg-white font-bold" value={form.waiterNotificationMode} onChange={e => setForm({...form, waiterNotificationMode: e.target.value})}>
                        <option value="ALL">Notificar Todos (Padrão)</option>
                        <option value="OPENER">Apenas quem abriu o atendimento</option>
                        <option value="ASSIGNED">Apenas garçons atribuídos à mesa</option>
                    </select>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
                        <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={form.strictWaiterNotification} onChange={e => setForm({...form, strictWaiterNotification: e.target.checked})} />
                        <span className="text-sm font-bold text-slate-600">Bloquear chamadas sem garçom atribuído</span>
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* --- ABA DELIVERY --- */}
        {activeTab === 'DELIVERY' && planLimits?.allowCashier && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Bike className="text-emerald-500"/> Taxas de Entrega</h3>
                <Button onClick={() => { setMethodForm({ id: Math.random().toString(36).substr(2, 9), name: '', type: 'OWN', feeType: 'FIXED', feeValue: 0, feeBehavior: 'ADD_TO_TOTAL', isActive: true, estimatedTimeMin: 30, estimatedTimeMax: 45 }); setIsDeliveryModalOpen(true); }}><Plus size={16}/> Novo Método</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.deliverySettings.map((method: any) => (
                    <div key={method.id} className="p-5 border-2 rounded-2xl bg-white flex justify-between items-start">
                        <div>
                            <h5 className="font-black text-slate-800">{method.name}</h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{method.type === 'OWN' ? 'Frota Própria' : 'App Externo'}</p>
                            <p className="text-lg font-black text-emerald-600 mt-2">R$ {method.feeValue.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => { setMethodForm(method); setIsDeliveryModalOpen(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit size={16}/></button>
                            <button onClick={() => setForm({...form, deliverySettings: form.deliverySettings.filter((m:any) => m.id !== method.id)})} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- ABA FINANCEIRO --- */}
        {activeTab === 'FINANCE' && planLimits?.allowExpenses && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard size={18} className="text-blue-500"/> Meios de Recebimento</h4>
                    <Button onClick={() => { setPaymentForm({ id: Math.random().toString(36).substr(2, 9), name: '', type: 'CREDIT', feePercentage: 0, isActive: true }); setIsPaymentModalOpen(true); }} size="sm"><Plus size={16}/></Button>
                </div>
                <div className="bg-white border rounded-2xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400">
                            <tr><th className="p-4">Método</th><th className="p-4 text-center">Taxa Operadora</th><th className="p-4 text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {form.paymentMethods.map((pm: any) => (
                                <tr key={pm.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-700">{pm.name} <span className="text-[10px] text-slate-400 ml-2">({pm.type})</span></td>
                                    <td className="p-4 text-center font-mono text-blue-600 font-black">{pm.feePercentage}%</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => { setPaymentForm(pm); setIsPaymentModalOpen(true); }} className="text-blue-500 mr-2"><Edit size={16}/></button>
                                        <button onClick={() => setForm({...form, paymentMethods: form.paymentMethods.filter((p:any) => p.id !== pm.id)})} className="text-red-400"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
                <h4 className="font-bold text-slate-800 flex items-center gap-2"><Tags size={18} className="text-purple-500"/> Categorias de Gasto</h4>
                <div className="flex gap-2">
                    <input className="flex-1 border-2 p-3 rounded-xl" placeholder="Nova categoria..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    <Button onClick={() => { if(newCategoryName) { setForm({...form, expenseCategories: [...form.expenseCategories, {id: Math.random().toString(), name: newCategoryName}]}); setNewCategoryName(''); } }}>Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {form.expenseCategories.map((cat: any) => (
                        <div key={cat.id} className="bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 flex items-center gap-3">
                            {cat.name}
                            <button onClick={() => setForm({...form, expenseCategories: form.expenseCategories.filter((c:any) => c.id !== cat.id)})} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border-2 border-emerald-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-emerald-900 flex items-center gap-2"><Users size={18}/> Integração com RH</h4>
                    <p className="text-xs text-emerald-700">Lançar automaticamente a folha de pagamento como despesa no financeiro.</p>
                </div>
                <button 
                    onClick={() => saveLegalSettings({ integrateFinance: !staffState.legalSettings?.integrateFinance })}
                    className={`w-14 h-7 rounded-full transition-all relative ${staffState.legalSettings?.integrateFinance ? 'bg-green-600' : 'bg-slate-300'}`}
                >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${staffState.legalSettings?.integrateFinance ? 'left-8' : 'left-1'}`} />
                </button>
            </div>
          </div>
        )}

       

        {/* --- ABA SEGURANÇA --- */}
        {activeTab === 'SECURITY' && (
            <div className="bg-white p-8 rounded-2xl border-2 border-red-100 animate-fade-in">
                <h3 className="font-black text-red-600 uppercase flex items-center gap-2 mb-6"><Lock size={20}/> Segurança e Controles</h3>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <label className="block text-xs font-black text-red-800 uppercase mb-2">PIN Master (Cancelamento no Caixa)</label>
                    <input type="text" className="w-full border-2 border-red-200 p-4 rounded-xl text-2xl font-black text-red-600 tracking-[1em] text-center" maxLength={4} value={form.adminPin} onChange={e => setForm({...form, adminPin: e.target.value.replace(/\D/g, '')})} />
                    <p className="text-[10px] text-red-400 mt-3 font-bold">Mantenha em sigilo. Código exigido para cancelamento de pedidos.</p>
                </div>
            </div>
        )}

        {/* MENSAGEM DE PLANO LIMITADO */}
        {!availableTabs.find(t => t.id === activeTab) && (
            <div className="py-20 text-center animate-fade-in">
                <Lock size={64} className="mx-auto text-slate-200 mb-6" />
                <h2 className="text-2xl font-black text-slate-800">FUNCIONALIDADE BLOQUEADA</h2>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">Esta aba faz parte de um módulo avançado não disponível no seu plano atual.</p>
                <Button className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black">DAR UPGRADE NO PLANO</Button>
            </div>
        )}

        {/* Botão Salvar Geral */}
        {activeTab !== 'APPEARANCE' && availableTabs.find(t => t.id === activeTab) && (
          <div className="mt-12 pt-8 border-t flex justify-end">
            <Button disabled={loading} onClick={handleSaveAll} className="bg-slate-900 hover:bg-black text-white px-12 py-5 rounded-2xl shadow-xl font-black text-lg">
              {loading ? "Salvando..." : <><Save size={20} className="mr-2"/> Gravar Tudo</>}
            </Button>
          </div>
        )}
      </div>

      {/* MODAL DELIVERY */}
      <Modal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} title="Configurar Logística" onSave={() => { setForm({...form, deliverySettings: [...form.deliverySettings.filter((m:any) => m.id !== methodForm.id), methodForm]}); setIsDeliveryModalOpen(false); }}>
          <div className="space-y-4 pt-4">
              <label className="text-xs font-bold text-slate-500">Nome (Ex: Motoboy Próprio)</label>
              <input className="w-full border-2 p-3 rounded-xl" value={methodForm.name} onChange={e => setMethodForm({...methodForm, name: e.target.value})} />
              <label className="text-xs font-bold text-slate-500">Tipo</label>
              <select className="w-full border-2 p-3 rounded-xl bg-white" value={methodForm.type} onChange={e => setMethodForm({...methodForm, type: e.target.value})}>
                  <option value="OWN">Frota Própria</option>
                  <option value="APP">App Parceiro (iFood/Rappi)</option>
                  <option value="PICKUP">Retirada no Local</option>
              </select>
              <label className="text-xs font-bold text-slate-500">Taxa Fixa (R$)</label>
              <input type="number" step="0.01" className="w-full border-2 p-3 rounded-xl" value={methodForm.feeValue} onChange={e => setMethodForm({...methodForm, feeValue: parseFloat(e.target.value)})} />
          </div>
      </Modal>

      {/* MODAL PAGAMENTO */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Meio de Recebimento" onSave={() => { setForm({...form, paymentMethods: [...form.paymentMethods.filter((p:any) => p.id !== paymentForm.id), paymentForm]}); setIsPaymentModalOpen(false); }}>
          <div className="space-y-4 pt-4">
              <label className="text-xs font-bold text-slate-500">Nome (Ex: Visa Crédito)</label>
              <input className="w-full border-2 p-3 rounded-xl" value={paymentForm.name} onChange={e => setPaymentForm({...paymentForm, name: e.target.value})} />
              <label className="text-xs font-bold text-slate-500">Taxa da Operadora (%)</label>
              <div className="relative">
                  <input type="number" step="0.01" className="w-full border-2 p-3 rounded-xl" value={paymentForm.feePercentage} onChange={e => setPaymentForm({...paymentForm, feePercentage: parseFloat(e.target.value)})} />
                  <span className="absolute right-4 top-3.5 font-bold text-slate-400">%</span>
              </div>
          </div>
      </Modal>
    </div>
  )
}