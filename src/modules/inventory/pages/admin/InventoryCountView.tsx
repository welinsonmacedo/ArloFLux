import React, { useState, useMemo, useCallback } from 'react';
import { useInventory } from '@/core/context/InventoryContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { 
    Search, Scale, AlertTriangle, CheckCircle, TrendingUp, 
    TrendingDown, Minus, FileText, Download, Printer, 
    Filter, X, Edit3, Save, RefreshCw, Info
} from 'lucide-react';

export const InventoryCountView: React.FC = () => {
    const { state: invState, processInventoryAdjustment } = useInventory();
    const { showAlert } = useUI();
    
    const [countSearch, setCountSearch] = useState('');
    const [counts, setCounts] = useState<{ [key: string]: string }>({});
    const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'INGREDIENT' | 'RESALE'>('ALL');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter items based on search, category, and difference filter
    const filteredItems = useMemo(() => {
        let items = invState.inventory.filter(i => i.type !== 'COMPOSITE');
        
        // Search filter
        if (countSearch) {
            items = items.filter(i => 
                i.name.toLowerCase().includes(countSearch.toLowerCase()) ||
                (i.barcode && i.barcode.includes(countSearch))
            );
        }
        
        // Category filter
        if (filterCategory !== 'ALL') {
            items = items.filter(i => i.type === filterCategory);
        }
        
        // Differences only filter
        if (showOnlyDifferences) {
            items = items.filter(item => {
                const sysQty = item.quantity;
                const inputVal = counts[item.id] ?? '';
                const realQty = inputVal === '' ? sysQty : parseFloat(inputVal);
                return realQty !== sysQty;
            });
        }
        
        return items;
    }, [invState.inventory, countSearch, filterCategory, showOnlyDifferences, counts]);

    // Calculate statistics
    const stats = useMemo(() => {
        let totalItems = 0;
        let itemsWithDifferences = 0;
        let totalPositiveDiff = 0;
        let totalNegativeDiff = 0;
        
        filteredItems.forEach(item => {
            const sysQty = item.quantity;
            const inputVal = counts[item.id] ?? '';
            const realQty = inputVal === '' ? sysQty : parseFloat(inputVal);
            const diff = realQty - sysQty;
            
            totalItems++;
            if (diff !== 0) {
                itemsWithDifferences++;
                if (diff > 0) totalPositiveDiff += diff;
                if (diff < 0) totalNegativeDiff += Math.abs(diff);
            }
        });
        
        return { totalItems, itemsWithDifferences, totalPositiveDiff, totalNegativeDiff };
    }, [filteredItems, counts]);

    const handleCountChange = useCallback((itemId: string, value: string) => {
        setCounts(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const handleClearAll = useCallback(() => {
        setCounts({});
        showAlert({ title: "Limpar", message: "Todos os valores foram resetados.", type: 'INFO' });
    }, [showAlert]);

    const handleResetItem = useCallback((itemId: string) => {
        setCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[itemId];
            return newCounts;
        });
    }, []);

    const handleSubmitCount = useCallback(async () => {
        const adjustments = Object.keys(counts)
            .map(id => ({ itemId: id, realQty: parseFloat(counts[id] || '0') }))
            .filter(adj => !isNaN(adj.realQty));
            
        if (adjustments.length === 0) {
            showAlert({ 
                title: "Nenhum ajuste", 
                message: "Não há alterações para processar.", 
                type: 'WARNING' 
            });
            return;
        }
        
        setIsSubmitting(true);
        try {
            await processInventoryAdjustment(adjustments);
            setCounts({});
            showAlert({ 
                title: "Balanço Finalizado", 
                message: `${adjustments.length} ${adjustments.length === 1 ? 'item ajustado' : 'itens ajustados'} com sucesso.`, 
                type: 'SUCCESS' 
            });
        } catch (error: any) {
            showAlert({ 
                title: "Erro ao processar", 
                message: error.message || "Erro ao processar os ajustes.", 
                type: 'ERROR' 
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [counts, processInventoryAdjustment, showAlert]);

    const getDifferenceInfo = (sysQty: number, realQty: number) => {
        const diff = realQty - sysQty;
        if (diff === 0) return { icon: null, color: 'text-gray-400', bgColor: 'bg-gray-50', text: 'Sem diferença' };
        if (diff > 0) return { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', text: `+${diff.toFixed(2)}`, prefix: '+' };
        return { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-50', text: diff.toFixed(2), prefix: '' };
    };

    const hasAnyChanges = Object.keys(counts).length > 0;

    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Scale size={24} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800">
                                        Balanço de Estoque
                                    </h1>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        Contagem física para ajuste de perdas, sobras e quebras
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className="flex gap-3">
                            <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-200">
                                <p className="text-xs text-slate-500">Itens com diferença</p>
                                <p className="text-xl font-bold text-slate-800">
                                    {stats.itemsWithDifferences}
                                    <span className="text-sm font-normal text-slate-400 ml-1">
                                        / {stats.totalItems}
                                    </span>
                                </p>
                            </div>
                            {stats.totalPositiveDiff > 0 && (
                                <div className="bg-green-50 rounded-xl px-4 py-2 border border-green-200">
                                    <p className="text-xs text-green-600">Sobras</p>
                                    <p className="text-xl font-bold text-green-700">
                                        +{stats.totalPositiveDiff.toFixed(2)}
                                    </p>
                                </div>
                            )}
                            {stats.totalNegativeDiff > 0 && (
                                <div className="bg-red-50 rounded-xl px-4 py-2 border border-red-200">
                                    <p className="text-xs text-red-600">Perdas</p>
                                    <p className="text-xl font-bold text-red-700">
                                        -{stats.totalNegativeDiff.toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-slate-50 focus:bg-white" 
                                placeholder="Buscar por nome, código de barras..." 
                                value={countSearch} 
                                onChange={e => setCountSearch(e.target.value)}
                            />
                            {countSearch && (
                                <button
                                    onClick={() => setCountSearch('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        
                        {/* Category Filter */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterCategory('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filterCategory === 'ALL' 
                                        ? 'bg-slate-800 text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterCategory('INGREDIENT')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filterCategory === 'INGREDIENT' 
                                        ? 'bg-orange-500 text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Matéria Prima
                            </button>
                            <button
                                onClick={() => setFilterCategory('RESALE')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filterCategory === 'RESALE' 
                                        ? 'bg-blue-500 text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Revenda
                            </button>
                        </div>
                        
                        {/* Differences Filter */}
                        <button
                            onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                showOnlyDifferences 
                                    ? 'bg-amber-500 text-white shadow-md' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Filter size={16} />
                            Apenas diferenças
                            {showOnlyDifferences && stats.itemsWithDifferences > 0 && (
                                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                                    {stats.itemsWithDifferences}
                                </span>
                            )}
                        </button>
                        
                        {/* Clear All Button */}
                        {hasAnyChanges && (
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                            >
                                <RefreshCw size={16} />
                                Limpar todos
                            </button>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-200">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText size={18} className="text-slate-500" />
                                <span className="font-bold text-slate-700">
                                    Itens para Contagem
                                </span>
                                <span className="text-sm text-slate-500">
                                    ({filteredItems.length} itens)
                                </span>
                            </div>
                            {filteredItems.length === 0 && countSearch && (
                                <p className="text-sm text-amber-600">
                                    Nenhum item encontrado
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Scale size={32} className="text-slate-400" />
                                </div>
                                <p className="text-lg font-medium text-slate-500">Nenhum item encontrado</p>
                                <p className="text-sm text-slate-400 mt-1 text-center max-w-md">
                                    {countSearch 
                                        ? `Não há itens com "${countSearch}" no nome ou código.` 
                                        : 'Todos os itens foram contados ou não há itens disponíveis.'}
                                </p>
                                {countSearch && (
                                    <button
                                        onClick={() => setCountSearch('')}
                                        className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Limpar busca
                                    </button>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Item / Produto
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Estoque Sistema
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-48">
                                            Contagem Real
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Diferença
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                                            Ação
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.map(item => {
                                        const sysQty = item.quantity;
                                        const inputVal = counts[item.id] ?? '';
                                        const realQty = inputVal === '' ? sysQty : parseFloat(inputVal);
                                        const diff = realQty - sysQty;
                                        const diffInfo = getDifferenceInfo(sysQty, realQty);
                                        const hasChange = inputVal !== '' && parseFloat(inputVal) !== sysQty;
                                        
                                        return (
                                            <tr 
                                                key={item.id} 
                                                className={`hover:bg-slate-50 transition-colors group ${hasChange ? 'bg-amber-50/30' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-bold text-slate-800">
                                                            {item.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-slate-400">
                                                                {item.unit}
                                                            </span>
                                                            {item.barcode && (
                                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                    {item.barcode.slice(-8)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-mono text-lg font-bold text-slate-700">
                                                        {sysQty.toFixed(item.unit === 'UN' ? 0 : 2)}
                                                    </span>
                                                    <span className="text-xs text-slate-400 ml-1">
                                                        {item.unit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            step="0.001"
                                                            className={`w-full text-right font-mono font-bold py-2.5 px-3 rounded-lg border-2 outline-none transition-all
                                                                ${hasChange 
                                                                    ? 'border-amber-400 bg-amber-50 focus:border-amber-500' 
                                                                    : 'border-slate-200 bg-white focus:border-emerald-500'
                                                                }`}
                                                            placeholder={sysQty.toString()}
                                                            value={inputVal} 
                                                            onChange={e => handleCountChange(item.id, e.target.value)}
                                                        />
                                                        {hasChange && (
                                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                <Edit3 size={14} className="text-amber-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {diff !== 0 ? (
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${diffInfo.bgColor}`}>
                                                            {diffInfo.icon && <diffInfo.icon size={14} className={diffInfo.color} />}
                                                            <span className={`font-bold ${diffInfo.color}`}>
                                                                {diff > 0 ? '+' : ''}{diff.toFixed(item.unit === 'UN' ? 0 : 2)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50">
                                                            <Minus size={14} className="text-slate-400" />
                                                            <span className="font-bold text-slate-400">0</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {hasChange && (
                                                        <button
                                                            onClick={() => handleResetItem(item.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Resetar valor"
                                                        >
                                                            <RefreshCw size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer with Summary */}
                    {filteredItems.length > 0 && (
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-xs text-slate-500">Itens contados</p>
                                        <p className="text-lg font-bold text-slate-800">
                                            {Object.keys(counts).length}
                                            <span className="text-sm font-normal text-slate-500 ml-1">
                                                / {filteredItems.length}
                                            </span>
                                        </p>
                                    </div>
                                    {stats.itemsWithDifferences > 0 && (
                                        <>
                                            <div>
                                                <p className="text-xs text-green-600">Sobras totais</p>
                                                <p className="text-lg font-bold text-green-700">
                                                    +{stats.totalPositiveDiff.toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-red-600">Perdas totais</p>
                                                <p className="text-lg font-bold text-red-700">
                                                    -{stats.totalNegativeDiff.toFixed(2)}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={handleSubmitCount} 
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 font-bold shadow-lg"
                                        disabled={!hasAnyChanges || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw size={18} className="mr-2 animate-spin" />
                                                Processando...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} className="mr-2" />
                                                Processar Ajustes de Estoque
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Banner */}
                <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-3">
                        <Info size={18} className="text-blue-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">Como funciona o balanço de estoque?</p>
                            <p className="text-xs text-blue-600 mt-1">
                                Insira a quantidade real contada fisicamente. O sistema calculará automaticamente a diferença 
                                e ajustará o estoque quando você processar. Itens com diferença são destacados em amarelo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};