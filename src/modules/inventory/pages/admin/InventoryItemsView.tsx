import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventory } from '@/core/context/InventoryContext';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useUI } from '@/core/context/UIContext';
import { InventoryItem } from '@/types';
import { 
    Archive, AlertTriangle, Plus, ArrowDown, Edit, Search, Trash2, 
    Package, ShoppingBag, Layers, ScanLine, Filter, X, ChevronDown,
    TrendingDown, TrendingUp, DollarSign, Grid, List, Download, 
    Printer, MoreVertical, Eye, Copy
} from 'lucide-react';
import { InventoryItemModal } from '@/modules/common/components/modals/InventoryItemModal';
import { StockAdjustmentModal } from '@/modules/common/components/modals/StockAdjustmentModal';

export const InventoryItemsView: React.FC<{ onNewItem?: () => void }> = ({ onNewItem }) => {
    const { state: invState, deleteInventoryItem } = useInventory();
    const { state: restaurantState } = useRestaurant();
    const { planLimits } = restaurantState;
    const { showConfirm, showAlert } = useUI();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'INGREDIENT' | 'RESALE' | 'COMPOSITE'>('ALL');
    const [onlyLowStock, setOnlyLowStock] = useState(false);
    const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItemForMenu, setSelectedItemForMenu] = useState<string | null>(null);
    
    // Estados locais para modais
    const [activeModal, setActiveModal] = useState<'NONE' | 'ITEM_EDIT' | 'STOCK_ADJ'>('NONE');
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [stockAdjParams, setStockAdjParams] = useState<{ itemId: string, type: 'IN' | 'OUT' } | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setSelectedItemForMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleEditItem = (item: InventoryItem) => {
        setSelectedItem(item);
        setActiveModal('ITEM_EDIT');
        setSelectedItemForMenu(null);
    };

    const handleStockAdj = (itemId: string, type: 'IN' | 'OUT') => {
        setStockAdjParams({ itemId, type });
        setActiveModal('STOCK_ADJ');
        setSelectedItemForMenu(null);
    };

    const handleDeleteItem = (itemId: string) => {
        showConfirm({
            title: "Excluir Item",
            message: "Tem certeza? Isso removerá o item do estoque permanentemente.",
            type: 'WARNING',
            onConfirm: async () => {
                try {
                    await deleteInventoryItem(itemId);
                    showAlert({ title: "Sucesso", message: "Item excluído.", type: 'SUCCESS' });
                } catch (error: any) {
                    showAlert({ title: "Erro", message: error.message || "Erro ao excluir.", type: 'ERROR' });
                }
            }
        });
        setSelectedItemForMenu(null);
    };

    const filteredInventory = useMemo(() => {
        return invState.inventory.filter(item => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = item.name.toLowerCase().includes(term) || 
                                 item.unit.toLowerCase().includes(term) || 
                                 (item.barcode && item.barcode.includes(term));
            const matchesType = filterType === 'ALL' || item.type === filterType;
            const matchesLowStock = onlyLowStock ? (item.quantity <= item.minQuantity && item.type !== 'COMPOSITE') : true;
            return matchesSearch && matchesType && matchesLowStock;
        });
    }, [invState.inventory, searchTerm, filterType, onlyLowStock]);

    const lowStockCount = useMemo(() => {
        return invState.inventory.filter(item => 
            item.quantity <= item.minQuantity && item.type !== 'COMPOSITE'
        ).length;
    }, [invState.inventory]);

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'INGREDIENT': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'RESALE': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'COMPOSITE': return 'bg-purple-50 text-purple-600 border-purple-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'INGREDIENT': return <Package size={12} />;
            case 'RESALE': return <ShoppingBag size={12} />;
            case 'COMPOSITE': return <Layers size={12} />;
            default: return <Archive size={12} />;
        }
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.type === 'COMPOSITE') return null;
        if (item.quantity <= item.minQuantity) {
            return { color: 'text-red-600 bg-red-50', icon: <AlertTriangle size={12} />, text: 'Crítico' };
        }
        if (item.quantity <= item.minQuantity * 1.5) {
            return { color: 'text-yellow-600 bg-yellow-50', icon: <AlertTriangle size={12} />, text: 'Atenção' };
        }
        return { color: 'text-green-600 bg-green-50', icon: null, text: 'Normal' };
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterType('ALL');
        setOnlyLowStock(false);
    };

    const hasActiveFilters = searchTerm || filterType !== 'ALL' || onlyLowStock;

    // Card View Component
    const ItemCard = ({ item }: { item: InventoryItem }) => {
        const stockStatus = getStockStatus(item);
        
        return (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group">
                <div className="relative">
                    {/* Image Section */}
                    <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                        {item.image ? (
                            <img src={item.image} className="h-24 w-24 object-contain" alt={item.name} />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center">
                                <Archive size={32} className="text-gray-400" />
                            </div>
                        )}
                        {item.isExtra && (
                            <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                                Adicional
                            </span>
                        )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-800 text-sm line-clamp-2 flex-1">
                                {item.name}
                            </h3>
                            <button
                                onClick={() => setSelectedItemForMenu(selectedItemForMenu === item.id ? null : item.id)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreVertical size={16} className="text-gray-400" />
                            </button>
                        </div>
                        
                        {/* Barcode */}
                        {item.barcode && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2 font-mono">
                                <ScanLine size={10} />
                                {item.barcode}
                            </div>
                        )}
                        
                        {/* Type Badge */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getTypeColor(item.type)}`}>
                                <span className="flex items-center gap-1">
                                    {getTypeIcon(item.type)}
                                    {item.type === 'INGREDIENT' ? 'MATÉRIA PRIMA' : 
                                     item.type === 'RESALE' ? 'REVENDA' : 'PRODUZIDO'}
                                </span>
                            </span>
                            {stockStatus && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${stockStatus.color}`}>
                                    <span className="flex items-center gap-1">
                                        {stockStatus.icon}
                                        {stockStatus.text}
                                    </span>
                                </span>
                            )}
                        </div>
                        
                        {/* Stock and Price */}
                        <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Estoque</div>
                                {item.type === 'COMPOSITE' ? (
                                    <div className="text-xs text-gray-400">--- {item.unit}</div>
                                ) : (
                                    <div className={`text-xl font-bold ${item.quantity <= item.minQuantity ? 'text-red-600' : 'text-gray-800'}`}>
                                        {(item.quantity || 0).toFixed(item.unit === 'UN' ? 0 : 2)}
                                        <span className="text-xs font-normal text-gray-500 ml-1">{item.unit}</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 mb-1">Custo Médio</div>
                                <div className="text-sm font-black text-emerald-600">
                                    R$ {(item.costPrice || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>
                        
                        {/* Low Stock Warning */}
                        {item.quantity <= item.minQuantity && item.type !== 'COMPOSITE' && (
                            <div className="mt-2 p-2 bg-red-50 rounded-lg">
                                <div className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                                    <AlertTriangle size={10} />
                                    Mínimo: {item.minQuantity} {item.unit}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 sm:space-y-6 w-full h-full flex flex-col">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    {/* Title and Stats */}
                    <div className="space-y-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Archive size={20} className="text-orange-500" />
                            Itens de Estoque
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500">
                            {filteredInventory.length} {filteredInventory.length === 1 ? 'item encontrado' : 'itens encontrados'}
                            {lowStockCount > 0 && ` • ${lowStockCount} com estoque crítico`}
                        </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full lg:w-auto">
                     
                        
                        <button
                            onClick={() => setViewMode(viewMode === 'TABLE' ? 'GRID' : 'TABLE')}
                            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            {viewMode === 'TABLE' ? <Grid size={18} /> : <List size={18} />}
                        </button>
                        
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2.5 border rounded-xl transition-colors ${showFilters || hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Filter size={18} />
                        </button>
                    </div>
                </div>
                
                {/* Filters Section */}
                {(showFilters || hasActiveFilters) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-slideDown">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nome, código ou unidade..." 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            
                            {/* Type Filter */}
                            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                                <button 
                                    onClick={() => setFilterType('ALL')} 
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterType === 'ALL' ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Todos
                                </button>
                                {planLimits.allowRawMaterials && (
                                    <button 
                                        onClick={() => setFilterType('INGREDIENT')} 
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'INGREDIENT' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        <Package size={12}/> Matéria Prima
                                    </button>
                                )}
                                <button 
                                    onClick={() => setFilterType('RESALE')} 
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'RESALE' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <ShoppingBag size={12}/> Revenda
                                </button>
                                {planLimits.allowCompositeProducts && (
                                    <button 
                                        onClick={() => setFilterType('COMPOSITE')} 
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'COMPOSITE' ? 'bg-purple-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        <Layers size={12}/> Produzido
                                    </button>
                                )}
                            </div>
                            
                            {/* Low Stock Filter */}
                            <button 
                                onClick={() => setOnlyLowStock(!onlyLowStock)} 
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${onlyLowStock ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <AlertTriangle size={14} className={onlyLowStock ? "fill-red-600" : ""} /> 
                                {onlyLowStock ? 'Ver Todos' : 'Estoque Crítico'}
                                {lowStockCount > 0 && !onlyLowStock && (
                                    <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">
                                        {lowStockCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700"
                                >
                                    <X size={14} />
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredInventory.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Archive size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum item encontrado</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {hasActiveFilters ? 'Tente ajustar os filtros de busca' : 'Comece adicionando seu primeiro item ao estoque'}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                            >
                                Limpar Filtros
                            </button>
                        ) : onNewItem && (
                            <button
                                onClick={onNewItem}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={16} />
                                Adicionar Item
                            </button>
                        )}
                    </div>
                ) : viewMode === 'GRID' ? (
                    // Grid View
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredInventory.map(item => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    // Table View
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-wider border-b sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4">Item / Insumo</th>
                                        <th className="p-4 hidden md:table-cell">Código (EAN)</th>
                                        <th className="p-4">Tipo</th>
                                        <th className="p-4 text-center hidden sm:table-cell">Unidade</th>
                                        <th className="p-4 text-right">Estoque</th>
                                        <th className="p-4 text-right hidden lg:table-cell">Custo Médio</th>
                                        <th className="p-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredInventory.map(item => {
                                        const stockStatus = getStockStatus(item);
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                            {item.image ? 
                                                                <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : 
                                                                <Archive className="text-gray-400" size={20}/>
                                                            }
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 flex flex-wrap items-center gap-2">
                                                                {item.name}
                                                                {item.isExtra && (
                                                                    <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
                                                                        Adicional
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.quantity <= item.minQuantity && item.type !== 'COMPOSITE' && (
                                                                <div className="text-[9px] text-red-500 font-bold flex items-center gap-1 mt-1">
                                                                    <AlertTriangle size={10}/> Mínimo: {item.minQuantity} {item.unit}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    {item.barcode ? (
                                                        <div className="flex items-center gap-1 text-xs font-mono text-gray-500">
                                                            <ScanLine size={12}/>
                                                            {item.barcode}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getTypeColor(item.type)}`}>
                                                        <span className="flex items-center gap-1">
                                                            {getTypeIcon(item.type)}
                                                            {item.type === 'INGREDIENT' ? 'MP' : 
                                                             item.type === 'RESALE' ? 'RV' : 'PR'}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center hidden sm:table-cell">
                                                    <span className="text-sm font-medium text-gray-500">{item.unit}</span>
                                                </td>
                                                <td className={`p-4 text-right font-mono font-bold ${item.type === 'COMPOSITE' ? 'text-gray-300' : (stockStatus?.color || 'text-gray-700')}`}>
                                                    {item.type === 'COMPOSITE' ? (
                                                        '---'
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-lg">
                                                                {(item.quantity || 0).toFixed(item.unit === 'UN' ? 0 : 2)}
                                                            </span>
                                                            {stockStatus && stockStatus.text !== 'Normal' && (
                                                                <span className="text-[9px] font-normal mt-0.5">
                                                                    {stockStatus.text}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right hidden lg:table-cell">
                                                    <div className="text-sm font-black text-emerald-600">
                                                        R$ {(item.costPrice || 0).toFixed(2)}
                                                    </div>
                                                    <div className="text-[9px] text-gray-400 uppercase font-bold">Custo Unit.</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button 
                                                            onClick={() => handleEditItem(item)} 
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Editar"
                                                        >
                                                            <Edit size={18}/>
                                                        </button>
                                                        {item.type !== 'COMPOSITE' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleStockAdj(item.id, 'IN')} 
                                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                    title="Adicionar Estoque"
                                                                >
                                                                    <TrendingUp size={18}/>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleStockAdj(item.id, 'OUT')} 
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Remover Estoque"
                                                                >
                                                                    <TrendingDown size={18}/>
                                                                </button>
                                                            </>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDeleteItem(item.id)} 
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={18}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Mobile Action Menu */}
            {selectedItemForMenu && (
                <div 
                    ref={menuRef}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slideUp z-50 lg:hidden"
                >
                    <div className="p-4">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                        {(() => {
                            const item = invState.inventory.find(i => i.id === selectedItemForMenu);
                            if (!item) return null;
                            return (
                                <div className="space-y-2">
                                    <div className="p-3 bg-gray-50 rounded-xl mb-3">
                                        <p className="font-bold text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">Estoque: {(item.quantity || 0).toFixed(item.unit === 'UN' ? 0 : 2)} {item.unit}</p>
                                    </div>
                                    <button
                                        onClick={() => handleEditItem(item)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        <Edit size={20} className="text-blue-600" />
                                        <span className="flex-1 text-left font-medium">Editar Item</span>
                                    </button>
                                    {item.type !== 'COMPOSITE' && (
                                        <>
                                            <button
                                                onClick={() => handleStockAdj(item.id, 'IN')}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                <TrendingUp size={20} className="text-green-600" />
                                                <span className="flex-1 text-left font-medium">Adicionar Estoque</span>
                                            </button>
                                            <button
                                                onClick={() => handleStockAdj(item.id, 'OUT')}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                <TrendingDown size={20} className="text-red-600" />
                                                <span className="flex-1 text-left font-medium">Remover Estoque</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-red-600"
                                    >
                                        <Trash2 size={20} />
                                        <span className="flex-1 text-left font-medium">Excluir Item</span>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
            
            {/* Modals */}
            <InventoryItemModal 
                isOpen={activeModal === 'ITEM_EDIT'} 
                onClose={() => setActiveModal('NONE')} 
                itemToEdit={selectedItem} 
            />
            
            {stockAdjParams && (
                <StockAdjustmentModal 
                    isOpen={activeModal === 'STOCK_ADJ'} 
                    onClose={() => setActiveModal('NONE')} 
                    itemId={stockAdjParams.itemId}
                    initialType={stockAdjParams.type}
                />
            )}
        </div>
    );
};