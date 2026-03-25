import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useInventory } from '@/core/context/InventoryContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { PurchaseItemInput } from '@/types';
import { 
    FileText, Plus, Trash2, ShoppingCart, Save, Calculator, 
    Truck, Receipt, QrCode, Calendar, Percent, DollarSign,
    Package, AlertCircle, CheckCircle, Building, ClipboardList,
    TrendingUp, ChevronRight, Info, ArrowRight, CreditCard,
    BadgeCheck, FileCheck, ListChecks, Wallet, X
} from 'lucide-react';

export const InventoryEntryView: React.FC = () => {
    const { state: invState, processPurchase } = useInventory();
    const { showAlert } = useUI();
    
    const [activeTab, setActiveTab] = useState<'invoice' | 'taxes' | 'items'>('invoice');
    const [entryForm, setEntryForm] = useState({
        supplierId: '', 
        invoiceNumber: '', 
        series: '',
        accessKey: '',
        date: new Date().toISOString().split('T')[0],
        items: [] as PurchaseItemInput[], 
        taxes: { icms: 0, ipi: 0, st: 0, freight: 0, others: 0 },
        distributeTax: true
    });
    
    const [entryTempItem, setEntryTempItem] = useState({ itemId: '', quantity: 1, unitPrice: 0 });
    const [showSuccess, setShowSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<{ invoice: boolean; taxes: boolean; items: boolean }>({
        invoice: false,
        taxes: false,
        items: false
    });

    // Verificar se as abas estão completas
    useEffect(() => {
        setCompletedSteps(prev => ({
            ...prev,
            invoice: !!entryForm.supplierId && !!entryForm.invoiceNumber,
            taxes: true, // Impostos são opcionais
            items: entryForm.items.length > 0
        }));
    }, [entryForm.supplierId, entryForm.invoiceNumber, entryForm.items.length]);

    const calculateTotalTaxes = useCallback(() => {
        const { icms, ipi, st, freight, others } = entryForm.taxes;
        return (Number(icms) || 0) + (Number(ipi) || 0) + (Number(st) || 0) + (Number(freight) || 0) + (Number(others) || 0);
    }, [entryForm.taxes]);

    const subtotalItems = useMemo(() => {
        return entryForm.items.reduce((acc, i) => acc + i.totalPrice, 0);
    }, [entryForm.items]);

    const totalTaxes = useMemo(() => calculateTotalTaxes(), [calculateTotalTaxes]);
    const totalAmount = useMemo(() => subtotalItems + totalTaxes, [subtotalItems, totalTaxes]);

    const handleAddEntryItem = useCallback(() => {
        const item = invState.inventory.find(i => i.id === entryTempItem.itemId);
        if (!item) {
            showAlert({ title: "Item não encontrado", message: "Selecione um item válido.", type: 'WARNING' });
            return;
        }
        if (entryTempItem.quantity <= 0) {
            showAlert({ title: "Quantidade inválida", message: "A quantidade deve ser maior que zero.", type: 'WARNING' });
            return;
        }
        if (entryTempItem.unitPrice <= 0) {
            showAlert({ title: "Preço inválido", message: "O preço unitário deve ser maior que zero.", type: 'WARNING' });
            return;
        }
        
        const newItem: PurchaseItemInput = {
            inventoryItemId: item.id,
            quantity: entryTempItem.quantity,
            unitPrice: entryTempItem.unitPrice,
            totalPrice: entryTempItem.quantity * entryTempItem.unitPrice
        };
        
        setEntryForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setEntryTempItem({ itemId: '', quantity: 1, unitPrice: 0 });
        
        showAlert({ title: "Item adicionado", message: `${item.name} adicionado à nota.`, type: 'SUCCESS' });
    }, [entryTempItem, invState.inventory, showAlert]);

    const handleRemoveItem = useCallback((index: number) => {
        setEntryForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    }, []);

    const handleSubmitEntry = useCallback(async () => {
        if (!entryForm.supplierId) {
            showAlert({ title: "Fornecedor obrigatório", message: "Selecione um fornecedor para a nota.", type: 'WARNING' });
            setActiveTab('invoice');
            return;
        }
        if (!entryForm.invoiceNumber) {
            showAlert({ title: "Número da nota obrigatório", message: "Informe o número da nota fiscal.", type: 'WARNING' });
            setActiveTab('invoice');
            return;
        }
        if (entryForm.items.length === 0) {
            showAlert({ title: "Itens obrigatórios", message: "Adicione pelo menos um item à nota.", type: 'WARNING' });
            setActiveTab('items');
            return;
        }
        
        try {
            await processPurchase({ 
                ...entryForm, 
                date: new Date(entryForm.date), 
                totalAmount: totalAmount, 
                installments: [{ dueDate: new Date(entryForm.date), amount: totalAmount }] 
            });
            
            // Reset form
            setEntryForm({ 
                supplierId: '', invoiceNumber: '', series: '', accessKey: '', 
                date: new Date().toISOString().split('T')[0], items: [], 
                taxes: { icms: 0, ipi: 0, st: 0, freight: 0, others: 0 }, distributeTax: true 
            });
            setActiveTab('invoice');
            
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            
            showAlert({ title: "Nota lançada com sucesso!", message: "Estoque atualizado e contas geradas.", type: 'SUCCESS' });
        } catch (error: any) {
            showAlert({ title: "Erro ao processar", message: error.message || "Erro ao processar nota fiscal.", type: 'ERROR' });
        }
    }, [entryForm, totalAmount, processPurchase, showAlert]);

    const availableItems = useMemo(() => 
        invState.inventory.filter(i => i.type !== 'COMPOSITE'),
        [invState.inventory]
    );

    const getSupplierName = useCallback((supplierId: string) => {
        const supplier = invState.suppliers.find(s => s.id === supplierId);
        return supplier?.name || '';
    }, [invState.suppliers]);

    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 animate-slideInRight">
                    <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
                        <CheckCircle size={20} />
                        <span className="text-sm font-medium">Nota fiscal lançada com sucesso!</span>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto p-3 lg:p-1">
               

                {/* Tabs Navigation */}
                <div className="mb-6">
                    <div className="border-b border-slate-200">
                        
                        <nav className="flex gap-1" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('invoice')}
                                className={`
                                    relative px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
                                    flex items-center gap-2
                                    ${activeTab === 'invoice' 
                                        ? 'text-blue-600 bg-white border-t border-x border-slate-200' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }
                                `}
                            >
                                <FileText size={18} />
                                Dados da Nota
                                {completedSteps.invoice && (
                                    <BadgeCheck size={14} className="text-emerald-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('taxes')}
                                className={`
                                    relative px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
                                    flex items-center gap-2
                                    ${activeTab === 'taxes' 
                                        ? 'text-blue-600 bg-white border-t border-x border-slate-200' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }
                                `}
                            >
                                <Calculator size={18} />
                                Impostos & Custos
                            </button>
                            <button
                                onClick={() => setActiveTab('items')}
                                className={`
                                    relative px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
                                    flex items-center gap-2
                                    ${activeTab === 'items' 
                                        ? 'text-blue-600 bg-white border-t border-x border-slate-200' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }
                                `}
                            >
                                <ShoppingCart size={18} />
                                Itens da Nota
                                {entryForm.items.length > 0 && (
                                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                        {entryForm.items.length}
                                    </span>
                                )}
                            </button>

                        </nav>
                       
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    {/* Tab: Dados da Nota */}
                    {activeTab === 'invoice' && (
                        <div className="p-6 animate-fadeIn">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-500" />
                                    Informações da Nota Fiscal
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Preencha os dados principais da nota fiscal
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Supplier */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-1">
                                        <Building size={16} /> Fornecedor <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                        value={entryForm.supplierId} 
                                        onChange={e => setEntryForm({...entryForm, supplierId: e.target.value})}
                                    >
                                        <option value="">Selecione um fornecedor...</option>
                                        {invState.suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Invoice Number and Series */}
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700">
                                        Número da Nota <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                        value={entryForm.invoiceNumber} 
                                        onChange={e => setEntryForm({...entryForm, invoiceNumber: e.target.value})} 
                                        placeholder="Ex: 123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700">
                                        Série
                                    </label>
                                    <input 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                        value={entryForm.series} 
                                        onChange={e => setEntryForm({...entryForm, series: e.target.value})} 
                                        placeholder="Ex: 1"
                                    />
                                </div>

                                {/* Access Key */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-1">
                                        <QrCode size={16} /> Chave de Acesso
                                    </label>
                                    <input 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white font-mono text-sm" 
                                        value={entryForm.accessKey} 
                                        onChange={e => setEntryForm({...entryForm, accessKey: e.target.value})} 
                                        placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000" 
                                        maxLength={44}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        {entryForm.accessKey.length}/44 caracteres
                                    </p>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-1">
                                        <Calendar size={16} /> Data de Emissão
                                    </label>
                                    <input 
                                        type="date" 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                        value={entryForm.date} 
                                        onChange={e => setEntryForm({...entryForm, date: e.target.value})} 
                                    />
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                                <Button
                                    onClick={() => setActiveTab('taxes')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5"
                                    disabled={!entryForm.supplierId || !entryForm.invoiceNumber}
                                >
                                    Próximo: Impostos
                                    <ArrowRight size={18} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Tab: Impostos e Custos */}
                    {activeTab === 'taxes' && (
                        <div className="p-6 animate-fadeIn">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Calculator size={20} className="text-emerald-500" />
                                    Impostos e Custos Extras
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Informe os impostos e despesas adicionais da nota fiscal
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                        <Percent size={12} /> ICMS ST
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                            value={entryForm.taxes.st} 
                                            onChange={e => setEntryForm({...entryForm, taxes: {...entryForm.taxes, st: parseFloat(e.target.value) || 0}})} 
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                        <Percent size={12} /> IPI
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                            value={entryForm.taxes.ipi} 
                                            onChange={e => setEntryForm({...entryForm, taxes: {...entryForm.taxes, ipi: parseFloat(e.target.value) || 0}})} 
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                        <Percent size={12} /> ICMS Próprio
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                            value={entryForm.taxes.icms} 
                                            onChange={e => setEntryForm({...entryForm, taxes: {...entryForm.taxes, icms: parseFloat(e.target.value) || 0}})} 
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                        <Truck size={12} /> Frete
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                            value={entryForm.taxes.freight} 
                                            onChange={e => setEntryForm({...entryForm, taxes: {...entryForm.taxes, freight: parseFloat(e.target.value) || 0}})} 
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                        <DollarSign size={12} /> Outras Despesas
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                            value={entryForm.taxes.others} 
                                            onChange={e => setEntryForm({...entryForm, taxes: {...entryForm.taxes, others: parseFloat(e.target.value) || 0}})} 
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tax Summary */}
                            <div className="mt-6 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-emerald-700">Total de Impostos e Extras:</span>
                                    <span className="text-2xl font-black text-emerald-800">R$ {totalTaxes.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Distribute Tax Option */}
                            <div className="mt-4">
                                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                                        checked={entryForm.distributeTax} 
                                        onChange={e => setEntryForm({...entryForm, distributeTax: e.target.checked})} 
                                    />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700">Distribuir custo nos itens</span>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Distribui proporcionalmente os impostos entre os itens da nota
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-200">
                                <Button
                                    onClick={() => setActiveTab('invoice')}
                                    variant="secondary"
                                    className="px-6 py-2.5"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    onClick={() => setActiveTab('items')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5"
                                >
                                    Próximo: Itens
                                    <ArrowRight size={18} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Tab: Itens da Nota */}
                    {activeTab === 'items' && (
                        <div className="p-6 animate-fadeIn">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <ShoppingCart size={20} className="text-purple-500" />
                                    Itens da Nota Fiscal
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Adicione os produtos e quantidades da nota fiscal
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Add Item Form */}
                                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-5">
                                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                        <Plus size={18} />
                                        Adicionar Produto
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-blue-700">
                                                Produto / Insumo
                                            </label>
                                            <select 
                                                className="w-full border-2 border-blue-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                                                value={entryTempItem.itemId} 
                                                onChange={e => setEntryTempItem({...entryTempItem, itemId: e.target.value})}
                                            >
                                                <option value="">Selecione um item...</option>
                                                {availableItems.map(i => (
                                                    <option key={i.id} value={i.id}>
                                                        {i.name} ({i.unit})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold mb-2 text-blue-700">
                                                    Quantidade
                                                </label>
                                                <input 
                                                    type="number" 
                                                    step="0.001" 
                                                    className="w-full border-2 border-blue-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white" 
                                                    value={entryTempItem.quantity} 
                                                    onChange={e => setEntryTempItem({...entryTempItem, quantity: parseFloat(e.target.value) || 0})} 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-2 text-blue-700">
                                                    Preço Unitário (R$)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        className="w-full border-2 border-blue-200 rounded-xl pl-8 pr-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white" 
                                                        value={entryTempItem.unitPrice} 
                                                        onChange={e => setEntryTempItem({...entryTempItem, unitPrice: parseFloat(e.target.value) || 0})} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Item Preview */}
                                        {entryTempItem.itemId && entryTempItem.quantity > 0 && entryTempItem.unitPrice > 0 && (
                                            <div className="bg-blue-100 rounded-xl p-3">
                                                <p className="text-xs font-bold text-blue-800 mb-1">Prévia</p>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-blue-700">Subtotal:</span>
                                                    <span className="font-bold text-blue-900">
                                                        R$ {(entryTempItem.quantity * entryTempItem.unitPrice).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <Button 
                                            onClick={handleAddEntryItem} 
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                                            disabled={!entryTempItem.itemId || entryTempItem.quantity <= 0 || entryTempItem.unitPrice <= 0}
                                        >
                                            <Plus size={18} className="mr-2" />
                                            Adicionar à Nota
                                        </Button>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <ClipboardList size={18} className="text-purple-500" />
                                                <span className="font-bold text-slate-700">
                                                    Itens Adicionados ({entryForm.items.length})
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Subtotal</p>
                                                <p className="text-sm font-bold text-slate-800">R$ {subtotalItems.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {entryForm.items.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                    <ShoppingCart size={24} className="text-slate-400" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">Nenhum item adicionado</p>
                                                <p className="text-xs text-slate-400 mt-1 text-center">
                                                    Adicione os produtos da nota fiscal
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {entryForm.items.map((item, idx) => {
                                                    const inventoryItem = invState.inventory.find(i => i.id === item.inventoryItemId);
                                                    return (
                                                        <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <Package size={14} className="text-slate-400" />
                                                                        <span className="font-bold text-slate-800 text-sm">
                                                                            {inventoryItem?.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <span className="text-xs text-slate-500">
                                                                            {item.quantity} {inventoryItem?.unit}
                                                                        </span>
                                                                        <span className="text-xs text-slate-400">×</span>
                                                                        <span className="text-xs text-slate-500">
                                                                            R$ {item.unitPrice.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-slate-800">
                                                                        R$ {item.totalPrice.toFixed(2)}
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => handleRemoveItem(idx)} 
                                                                        className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors mt-1 opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Summary and Submit */}
                            {entryForm.items.length > 0 && (
                                <div className="mt-6 bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Subtotal Itens</p>
                                            <p className="text-lg font-bold text-slate-800">R$ {subtotalItems.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Impostos e Extras</p>
                                            <p className="text-lg font-bold text-slate-800">R$ {totalTaxes.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Total da Nota</p>
                                            <p className="text-2xl font-black text-blue-600">R$ {totalAmount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between gap-3 pt-4 border-t border-slate-200">
                                        <Button
                                            onClick={() => setActiveTab('taxes')}
                                            variant="secondary"
                                            className="px-6 py-2.5"
                                        >
                                            Voltar
                                        </Button>
                                        <Button 
                                            onClick={handleSubmitEntry} 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 font-bold"
                                        >
                                            <Save size={18} className="mr-2" />
                                            Finalizar Entrada
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

