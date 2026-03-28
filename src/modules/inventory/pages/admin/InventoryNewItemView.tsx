import React, { useState, useMemo, useCallback } from 'react';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useInventory } from '@/core/context/InventoryContext';
import { useUI } from '@/core/context/UIContext';
import { Button } from '@/modules/common/components/Button';
import { InventoryItem } from '@/types';
import { ImageUploader } from '@/modules/common/components/ImageUploader';
import { 
    PlusCircle, Layers, Plus, X, ScanLine, Tag, DollarSign, 
    Package, FileText, Sparkles, Loader2, AlertCircle, 
    CheckCircle, ArrowLeft, Save, Trash2, Info, 
    TrendingUp, ShoppingCart, Camera, ClipboardList
} from 'lucide-react';
import { generateProductDescription } from '@/core/services/geminiService';

export const InventoryNewItemView: React.FC<{ onCancel?: () => void }> = ({ onCancel }) => {
    const { state: invState, addInventoryItem } = useInventory();
    const { state: restaurantState } = useRestaurant();
    const { planLimits } = restaurantState;
    const { showAlert } = useUI();
    
    const [newItemForm, setNewItemForm] = useState<Partial<InventoryItem>>({
        name: '', barcode: '', unit: 'UN', type: 'INGREDIENT', quantity: 0, 
        minQuantity: 5, costPrice: 0, salePrice: 0, category: '', description: '', 
        isExtra: false, image: '', targetCategories: []
    });
    const [recipeItems, setRecipeItems] = useState<{ ingredientId: string, quantity: number }[]>([]);
    const [selectedIngToAdd, setSelectedIngToAdd] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);
    const [activeSection, setActiveSection] = useState<'IDENTIFICATION' | 'STOCK' | 'COMPOSITION'>('IDENTIFICATION');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const defaultCategories = [
        'Lanches', 'Pizzas', 'Pratos Principais', 'Acompanhamentos', 
        'Bebidas', 'Sobremesas', 'Mercearia', 'Limpeza', 'Higiene', 'Padaria'
    ];

    const availableIngredients = useMemo(() => 
        invState.inventory.filter(i => i.type === 'INGREDIENT'),
        [invState.inventory]
    );

    const recipeCost = useMemo(() => {
        return recipeItems.reduce((acc, item) => {
            const ing = invState.inventory.find(i => i.id === item.ingredientId);
            return acc + ((ing?.costPrice || 0) * item.quantity);
        }, 0);
    }, [recipeItems, invState.inventory]);

    const toggleTargetCategory = useCallback((cat: string) => {
        const current = newItemForm.targetCategories || [];
        setNewItemForm(prev => ({ 
            ...prev, 
            targetCategories: current.includes(cat) 
                ? current.filter(c => c !== cat) 
                : [...current, cat] 
        }));
    }, [newItemForm.targetCategories]);

    const handleGenerateDescription = useCallback(async () => {
        if (!newItemForm.name) {
            showAlert({ 
                title: "Nome Obrigatório", 
                message: "Preencha o nome do item para gerar a descrição.", 
                type: 'WARNING' 
            });
            return;
        }
        
        setLoadingAI(true);
        try {
            const desc = await generateProductDescription(
                newItemForm.name, 
                newItemForm.category || 'Geral'
            );
            setNewItemForm(prev => ({ ...prev, description: desc }));
            showAlert({ 
                title: "Descrição Gerada!", 
                message: "A descrição foi gerada com sucesso pela IA.", 
                type: 'SUCCESS' 
            });
        } catch (error) {
            showAlert({ 
                title: "Erro na IA", 
                message: "Falha ao gerar descrição. Tente novamente.", 
                type: 'ERROR' 
            });
        } finally {
            setLoadingAI(false);
        }
    }, [newItemForm.name, newItemForm.category, showAlert]);

    const handleSaveNewItem = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!newItemForm.name?.trim()) {
            showAlert({ 
                title: "Nome Obrigatório", 
                message: "Por favor, informe o nome do item.", 
                type: 'WARNING' 
            });
            return;
        }
        
        if (newItemForm.type !== 'INGREDIENT' && !newItemForm.category) {
            showAlert({ 
                title: "Categoria Obrigatória", 
                message: "Itens de venda precisam de uma categoria.", 
                type: 'WARNING' 
            });
            return;
        }

        if (newItemForm.type === 'COMPOSITE' && recipeItems.length === 0) {
            showAlert({ 
                title: "Receita Obrigatória", 
                message: "Produtos produzidos precisam ter pelo menos um ingrediente.", 
                type: 'WARNING' 
            });
            return;
        }

        try {
            const finalItem: any = { ...newItemForm };
            
            if (finalItem.type === 'COMPOSITE') {
                finalItem.recipe = recipeItems;
                finalItem.costPrice = recipeCost;
                finalItem.quantity = 0; // Composite items don't have stock
            }
            
            if (finalItem.type === 'INGREDIENT') { 
                finalItem.salePrice = 0; 
                finalItem.category = ''; 
                finalItem.description = '';
                finalItem.image = '';
            }

            await addInventoryItem(finalItem as InventoryItem);
            
            // Show success message
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
            
            // Reset form
            setNewItemForm({
                name: '', barcode: '', unit: 'UN', type: 'INGREDIENT', 
                quantity: 0, minQuantity: 5, costPrice: 0, salePrice: 0, 
                category: '', description: '', isExtra: false, image: '', 
                targetCategories: []
            });
            setRecipeItems([]);
            
            showAlert({ 
                title: "Sucesso!", 
                message: `${newItemForm.name} foi adicionado ao estoque.`, 
                type: 'SUCCESS' 
            });
        } catch (error: any) {
            showAlert({ 
                title: "Erro ao Salvar", 
                message: error.message || "Ocorreu um erro ao salvar o item.", 
                type: 'ERROR' 
            });
        }
    }, [newItemForm, recipeItems, recipeCost, addInventoryItem, showAlert]);

    const addIngredientToRecipe = useCallback(() => {
        if (selectedIngToAdd && !recipeItems.some(r => r.ingredientId === selectedIngToAdd)) {
            setRecipeItems(prev => [...prev, { ingredientId: selectedIngToAdd, quantity: 1 }]);
            setSelectedIngToAdd('');
        } else if (recipeItems.some(r => r.ingredientId === selectedIngToAdd)) {
            showAlert({ 
                title: "Ingrediente Duplicado", 
                message: "Este ingrediente já está na receita.", 
                type: 'WARNING' 
            });
        }
    }, [selectedIngToAdd, recipeItems, showAlert]);

    const removeIngredientFromRecipe = useCallback((index: number) => {
        setRecipeItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateIngredientQuantity = useCallback((index: number, quantity: number) => {
        setRecipeItems(prev => {
            const updated = [...prev];
            updated[index].quantity = quantity;
            return updated;
        });
    }, []);

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'INGREDIENT': return <Package size={16} className="text-orange-500" />;
            case 'RESALE': return <ShoppingCart size={16} className="text-blue-500" />;
            case 'COMPOSITE': return <Layers size={16} className="text-purple-500" />;
            default: return <Package size={16} />;
        }
    };

    return (
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto custom-scrollbar">
            {/* Success Toast */}
            {showSuccessMessage && (
                <div className="fixed top-4 right-4 z-50 animate-slideInRight">
                    <div className="bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
                        <CheckCircle size={20} />
                        <span className="text-sm font-medium">Item salvo com sucesso!</span>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 lg:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            
                            
                            {/* Mobile Section Indicator */}
                            <div className="lg:hidden flex gap-2 mt-4 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setActiveSection('IDENTIFICATION')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                        activeSection === 'IDENTIFICATION' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Identificação
                                </button>
                                <button
                                    onClick={() => setActiveSection('STOCK')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                        activeSection === 'STOCK' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Estoque & Valores
                                </button>
                                <button
                                    onClick={() => setActiveSection('COMPOSITION')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                        activeSection === 'COMPOSITION' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {newItemForm.type === 'COMPOSITE' ? 'Receita' : 'Imagem & Descrição'}
                                </button>
                            </div>
                        </div>
                       
                    </div>
                </div>

                <form onSubmit={handleSaveNewItem}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Section 1: Identification */}
                        <div className={`${activeSection === 'IDENTIFICATION' ? 'block' : 'hidden lg:block'} lg:block`}>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Tag size={18} className="text-blue-500" />
                                        Identificação do Item
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Informações básicas do produto</p>
                                </div>
                                
                                <div className="p-5 space-y-4">
                                    {/* Item Name */}
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-gray-700">
                                            Nome do Item <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            required 
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-gray-50 focus:bg-white" 
                                            value={newItemForm.name} 
                                            onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })} 
                                            placeholder="Ex: Queijo Mussarela, Coca-Cola 2L..."
                                        />
                                    </div>
                                    
                                    {/* Barcode */}
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-gray-700">
                                            Código de Barras / EAN
                                        </label>
                                        <div className="relative">
                                            <ScanLine size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                                            <input 
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-sm bg-gray-50 focus:bg-white" 
                                                value={newItemForm.barcode} 
                                                onChange={e => setNewItemForm({ ...newItemForm, barcode: e.target.value })} 
                                                placeholder="Digite ou escaneie o código"
                                            />
                                        </div>
                                    </div>

                                    {/* Type and Unit */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-gray-700">
                                                Tipo
                                            </label>
                                            <select 
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" 
                                                value={newItemForm.type} 
                                                onChange={e => setNewItemForm({ ...newItemForm, type: e.target.value as any })}
                                            >
                                                {planLimits.allowRawMaterials && (
                                                    <option value="INGREDIENT">📦 Matéria Prima</option>
                                                )}
                                                <option value="RESALE">🛒 Revenda</option>
                                                {planLimits.allowCompositeProducts && (
                                                    <option value="COMPOSITE">🍳 Produzido</option>
                                                )}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-gray-700">
                                                Unidade
                                            </label>
                                            <select 
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" 
                                                value={newItemForm.unit} 
                                                onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                                            >
                                                <option value="UN">Unidade (UN)</option>
                                                <option value="KG">Quilograma (KG)</option>
                                                <option value="LT">Litro (LT)</option>
                                                <option value="G">Grama (G)</option>
                                                <option value="ML">Mililitro (ML)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {/* Category for Sale Items */}
                                    {newItemForm.type !== 'INGREDIENT' && (
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-gray-700">
                                                Categoria do Cardápio <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-gray-50 focus:bg-white" 
                                                list="categories" 
                                                value={newItemForm.category} 
                                                onChange={e => setNewItemForm({...newItemForm, category: e.target.value})} 
                                                placeholder="Selecione ou digite uma categoria"
                                            />
                                            <datalist id="categories">
                                                {defaultCategories.map(c => <option key={c} value={c}/>)}
                                            </datalist>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Stock & Pricing */}
                        <div className={`${activeSection === 'STOCK' ? 'block' : 'hidden lg:block'} lg:block`}>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <DollarSign size={18} className="text-emerald-500" />
                                        Estoque & Valores
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Controle de estoque e precificação</p>
                                </div>
                                
                                <div className="p-5 space-y-4">
                                    {/* Initial Stock */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {newItemForm.type !== 'COMPOSITE' ? (
                                            <div>
                                                <label className="block text-xs font-bold mb-2 text-gray-700">
                                                    Estoque Inicial
                                                </label>
                                                <input 
                                                    type="number" 
                                                    step="0.001" 
                                                    className="w-full border border-blue-200 bg-blue-50 rounded-xl px-4 py-2.5 font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-200" 
                                                    value={newItemForm.quantity} 
                                                    onChange={e => setNewItemForm({...newItemForm, quantity: parseFloat(e.target.value) || 0})} 
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-bold mb-2 text-gray-400">
                                                    Estoque
                                                </label>
                                                <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-gray-400 text-sm">
                                                    Calculado automaticamente
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-gray-700">
                                                Estoque Mínimo
                                            </label>
                                            <input 
                                                type="number" 
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-gray-50 focus:bg-white" 
                                                value={newItemForm.minQuantity} 
                                                onChange={e => setNewItemForm({...newItemForm, minQuantity: parseFloat(e.target.value) || 0})} 
                                            />
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-gray-700">
                                                Custo Unitário (R$)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    className={`w-full border rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                                                        newItemForm.type === 'COMPOSITE' 
                                                            ? 'bg-gray-100 text-gray-500 border-gray-200' 
                                                            : 'bg-gray-50 focus:bg-white border-gray-200'
                                                    }`}
                                                    value={newItemForm.type === 'COMPOSITE' ? recipeCost.toFixed(2) : newItemForm.costPrice} 
                                                    onChange={e => setNewItemForm({...newItemForm, costPrice: parseFloat(e.target.value) || 0})} 
                                                    disabled={newItemForm.type === 'COMPOSITE'}
                                                />
                                            </div>
                                            {newItemForm.type === 'COMPOSITE' && (
                                                <p className="text-[10px] text-purple-600 mt-1 flex items-center gap-1">
                                                    <Info size={10} /> Calculado a partir dos ingredientes
                                                </p>
                                            )}
                                        </div>
                                        
                                        {newItemForm.type !== 'INGREDIENT' && (
                                            <div>
                                                <label className="block text-xs font-bold mb-2 text-emerald-600">
                                                    Preço de Venda (R$)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        className="w-full border-2 border-emerald-200 rounded-xl pl-8 pr-4 py-2.5 font-bold text-emerald-700 bg-emerald-50 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" 
                                                        value={newItemForm.salePrice} 
                                                        onChange={e => setNewItemForm({...newItemForm, salePrice: parseFloat(e.target.value) || 0})} 
                                                    />
                                                </div>
                                                {newItemForm.costPrice > 0 && newItemForm.salePrice > 0 && (
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Margem: {((newItemForm.salePrice - newItemForm.costPrice) / newItemForm.salePrice * 100).toFixed(1)}%
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Extra Item Option */}
                                    {planLimits.allowProductExtras && newItemForm.type !== 'INGREDIENT' && (
                                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={newItemForm.isExtra} 
                                                    onChange={e => setNewItemForm({...newItemForm, isExtra: e.target.checked})} 
                                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                                />
                                                <div>
                                                    <span className="text-xs font-bold text-orange-700">Vender como Item Adicional</span>
                                                    <p className="text-[10px] text-orange-600 mt-0.5">Produto pode ser adicionado como complemento</p>
                                                </div>
                                            </label>
                                            
                                            {newItemForm.isExtra && (
                                                <div className="mt-3 pl-7">
                                                    <p className="text-[10px] font-bold text-orange-800 mb-2">Categorias permitidas:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {defaultCategories.slice(0, 8).map(cat => (
                                                            <button 
                                                                type="button" 
                                                                key={cat} 
                                                                onClick={() => toggleTargetCategory(cat)} 
                                                                className={`text-[9px] px-2.5 py-1 rounded-full border transition-all ${
                                                                    newItemForm.targetCategories?.includes(cat) 
                                                                        ? 'bg-orange-500 text-white border-orange-600 shadow-sm' 
                                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                                                }`}
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Composition/Recipe or Image/Description */}
                        <div className={`${activeSection === 'COMPOSITION' ? 'block' : 'hidden lg:block'} lg:block`}>
                            {newItemForm.type === 'COMPOSITE' ? (
                                // Recipe Section for Composite Items
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                            <Layers size={18} className="text-purple-500" />
                                            Ficha Técnica
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">Defina os ingredientes e quantidades</p>
                                    </div>
                                    
                                    <div className="p-5">
                                        {/* Add Ingredient */}
                                        <div className="flex gap-2 mb-4">
                                            <select 
                                                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all" 
                                                value={selectedIngToAdd} 
                                                onChange={e => setSelectedIngToAdd(e.target.value)}
                                            >
                                                <option value="">+ Adicionar ingrediente...</option>
                                                {availableIngredients.map(ing => (
                                                    <option key={ing.id} value={ing.id}>
                                                        {ing.name} ({ing.unit}) - R$ {ing.costPrice?.toFixed(2)}
                                                    </option>
                                                ))}
                                            </select>
                                            <Button 
                                                type="button" 
                                                size="sm" 
                                                onClick={addIngredientToRecipe} 
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl"
                                                disabled={!selectedIngToAdd}
                                            >
                                                <Plus size={18} />
                                            </Button>
                                        </div>
                                        
                                        {/* Recipe Items List */}
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {recipeItems.length === 0 ? (
                                                <div className="text-center py-8 bg-purple-50/30 rounded-xl">
                                                    <Package size={32} className="mx-auto text-purple-300 mb-2" />
                                                    <p className="text-sm text-purple-400">Nenhum ingrediente adicionado</p>
                                                    <p className="text-xs text-purple-300 mt-1">Adicione os ingredientes da receita</p>
                                                </div>
                                            ) : (
                                                recipeItems.map((r, idx) => {
                                                    const ing = invState.inventory.find(i => i.id === r.ingredientId);
                                                    const itemCost = (ing?.costPrice || 0) * r.quantity;
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors group">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-gray-800 truncate">
                                                                    {ing?.name}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                                    R$ {itemCost.toFixed(2)} (R$ {ing?.costPrice?.toFixed(2)}/{ing?.unit})
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="number" 
                                                                    step="0.001" 
                                                                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-right font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none" 
                                                                    value={r.quantity} 
                                                                    onChange={e => updateIngredientQuantity(idx, parseFloat(e.target.value) || 0)} 
                                                                />
                                                                <span className="text-xs text-gray-500 w-8">{ing?.unit}</span>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => removeIngredientFromRecipe(idx)} 
                                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                        
                                        {/* Recipe Summary */}
                                        {recipeItems.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-600">Custo Total da Receita:</span>
                                                    <span className="text-lg font-bold text-purple-600">
                                                        R$ {recipeCost.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Image and Description Section
                                <div className="space-y-6">
                                    {/* Image Upload */}
                                    {newItemForm.type !== 'INGREDIENT' && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                                    <Camera size={18} className="text-blue-500" />
                                                    Imagem do Produto
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">Adicione uma foto para o cardápio</p>
                                            </div>
                                            <div className="p-5">
                                                {planLimits.allowProductImages && (
                                                    <ImageUploader 
                                                        value={newItemForm.image || ''} 
                                                        onChange={(val) => setNewItemForm({...newItemForm, image: val})} 
                                                        maxSizeKB={200}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Description */}
                                    {planLimits.allowProductDescription && newItemForm.type !== 'INGREDIENT' && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                                            <FileText size={18} className="text-purple-500" />
                                                            Descrição do Cardápio
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-1">Descreva o produto para os clientes</p>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={handleGenerateDescription}
                                                        disabled={loadingAI}
                                                        className="flex items-center gap-1.5 text-[10px] font-bold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-all disabled:opacity-50"
                                                    >
                                                        {loadingAI ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Sparkles size={12} />
                                                        )}
                                                        Gerar com IA
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <textarea 
                                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none bg-gray-50 focus:bg-white"
                                                    rows={5}
                                                    placeholder="Descreva o produto de forma atraente para o cardápio..."
                                                    value={newItemForm.description || ''}
                                                    onChange={e => setNewItemForm({...newItemForm, description: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Ingredient Placeholder */}
                                    {newItemForm.type === 'INGREDIENT' && (
                                        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                                            <Package size={48} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-sm text-gray-500">Matéria-prima não necessita de imagem ou descrição</p>
                                            <p className="text-xs text-gray-400 mt-1">Apenas itens de revenda e produzidos precisam dessas informações</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Form Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                      
                        <Button 
                            type="submit" 
                            className="order-1 sm:order-2 flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-bold shadow-lg"
                        >
                            <Save size={18} className="mr-2" />
                            Salvar Item no Estoque
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};