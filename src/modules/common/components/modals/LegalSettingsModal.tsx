import React, { useState, useEffect } from 'react';
import { Modal } from '@/modules/common/components/Modal';
import { Button } from '@/modules/common/components/Button';
import { useStaff } from '@/core/context/StaffContext';
import { useUI } from '@/core/context/UIContext';
import { RhInssBracket, RhIrrfBracket } from '@/types';
import { Calculator, Plus, Trash2, Building2 } from 'lucide-react';

interface LegalSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LegalSettingsModal: React.FC<LegalSettingsModalProps> = ({ isOpen, onClose }) => {
    const { state, saveLegalSettings, saveInssBrackets, saveIrrfBrackets } = useStaff();
    const { showAlert } = useUI();

    const [minWage, setMinWage] = useState(0);
    const [inssCeiling, setInssCeiling] = useState(0);
    const [irrfDeduction, setIrrfDeduction] = useState(0);
    const [fgtsRate, setFgtsRate] = useState(8);
    const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
    
    // Novos campos do eSocial
    const [esocialCnae, setEsocialCnae] = useState('');
    const [esocialFap, setEsocialFap] = useState(1.0000);
    const [esocialRat, setEsocialRat] = useState(1.00);
    const [esocialFpas, setEsocialFpas] = useState('');

    const [inssList, setInssList] = useState<RhInssBracket[]>([]);
    const [irrfList, setIrrfList] = useState<RhIrrfBracket[]>([]);

    useEffect(() => {
        if (isOpen && state.legalSettings) {
            setMinWage(state.legalSettings.minWage);
            setInssCeiling(state.legalSettings.inssCeiling);
            setIrrfDeduction(state.legalSettings.irrfDependentDeduction);
            setFgtsRate(state.legalSettings.fgtsRate);
            setValidFrom(state.legalSettings.validFrom || new Date().toISOString().split('T')[0]);
            
            setEsocialCnae(state.legalSettings.esocialCnae || '');
            setEsocialFap(state.legalSettings.esocialFap || 1.0000);
            setEsocialRat(state.legalSettings.esocialRat || 1.00);
            setEsocialFpas(state.legalSettings.esocialFpas || '');

            setInssList([...state.inssBrackets]);
            setIrrfList([...state.irrfBrackets]);
        }
    }, [isOpen, state.legalSettings, state.inssBrackets, state.irrfBrackets]);

    const handleSave = async () => {
        try {
            await saveLegalSettings({
                minWage, 
                inssCeiling, 
                irrfDependentDeduction: irrfDeduction, 
                fgtsRate,
                validFrom,
                esocialCnae,
                esocialFap,
                esocialRat,
                esocialFpas
            });
            await saveInssBrackets(inssList);
            await saveIrrfBrackets(irrfList);
            showAlert({ title: "Salvo", message: "Configurações legais atualizadas.", type: "SUCCESS" });
            onClose();
        } catch (e) {
            showAlert({ title: "Erro", message: "Falha ao salvar configurações.", type: "ERROR" });
        }
    };

    const addInss = () => setInssList([...inssList, { id: Math.random().toString(), minValue: 0, maxValue: 0, rate: 0, validFrom: '' }]);
    const removeInss = (idx: number) => setInssList(inssList.filter((_, i) => i !== idx));
    const updateInss = (idx: number, field: string, value: any) => {
        const list = [...inssList];
        list[idx] = { ...list[idx], [field]: parseFloat(value) || 0 };
        setInssList(list);
    };

    const addIrrf = () => setIrrfList([...irrfList, { id: Math.random().toString(), minValue: 0, maxValue: 0, rate: 0, deduction: 0, validFrom: '' }]);
    const removeIrrf = (idx: number) => setIrrfList(irrfList.filter((_, i) => i !== idx));
    const updateIrrf = (idx: number, field: string, value: any) => {
        const list = [...irrfList];
        list[idx] = { ...list[idx], [field]: parseFloat(value) || 0 };
        setIrrfList(list);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Tabelas Legais (INSS/IRRF)" variant="page" onSave={handleSave} maxWidth="4xl">
            <div className="space-y-6 pb-20 max-w-4xl mx-auto pt-4">
                
                {/* NOVO BLOCO: DADOS DA EMPRESA (eSocial) */}
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2"><Building2 size={18}/> Informações do Empregador (eSocial)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="text-xs font-bold text-purple-700 uppercase">CNAE Preponderante</label>
                            <input type="text" placeholder="Ex: 5611201" className="w-full border p-2.5 rounded-xl mt-1 text-sm bg-white" value={esocialCnae} onChange={e => setEsocialCnae(e.target.value)}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-purple-700 uppercase">Cód. FPAS</label>
                            <input type="text" placeholder="Ex: 515" className="w-full border p-2.5 rounded-xl mt-1 text-sm bg-white" value={esocialFpas} onChange={e => setEsocialFpas(e.target.value)}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-purple-700 uppercase">Alíquota RAT (%)</label>
                            <input type="number" step="0.5" placeholder="1 a 3%" className="w-full border p-2.5 rounded-xl mt-1 text-sm bg-white" value={esocialRat} onChange={e => setEsocialRat(parseFloat(e.target.value))}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-purple-700 uppercase">FAP (Multiplicador)</label>
                            <input type="number" step="0.0001" placeholder="Ex: 1.0000" className="w-full border p-2.5 rounded-xl mt-1 text-sm bg-white" value={esocialFap} onChange={e => setEsocialFap(parseFloat(e.target.value))}/>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Calculator size={18}/> Parâmetros Gerais (Piso e Tetos)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <div><label className="text-xs font-bold text-blue-700 uppercase">Vigência</label><input type="date" className="w-full border p-2 rounded-xl mt-1 text-sm" value={validFrom} onChange={e => setValidFrom(e.target.value)}/></div>
                        <div><label className="text-xs font-bold text-blue-700 uppercase">Salário Mínimo</label><input type="number" step="0.01" className="w-full border p-2 rounded-xl mt-1 text-sm font-bold text-slate-700" value={minWage} onChange={e => setMinWage(parseFloat(e.target.value))}/></div>
                        <div><label className="text-xs font-bold text-blue-700 uppercase">Teto INSS</label><input type="number" step="0.01" className="w-full border p-2 rounded-xl mt-1 text-sm" value={inssCeiling} onChange={e => setInssCeiling(parseFloat(e.target.value))}/></div>
                        <div><label className="text-xs font-bold text-blue-700 uppercase">Dedução Dep. (IRRF)</label><input type="number" step="0.01" className="w-full border p-2 rounded-xl mt-1 text-sm" value={irrfDeduction} onChange={e => setIrrfDeduction(parseFloat(e.target.value))}/></div>
                        <div><label className="text-xs font-bold text-blue-700 uppercase">Alíquota FGTS (%)</label><input type="number" step="0.1" className="w-full border p-2 rounded-xl mt-1 text-sm" value={fgtsRate} onChange={e => setFgtsRate(parseFloat(e.target.value))}/></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-orange-700">Tabela INSS Progressivo</h4>
                        <Button onClick={addInss} size="sm" variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"><Plus size={14}/> Adicionar Faixa</Button>
                    </div>
                    <div className="space-y-2">
                        {inssList.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 w-8 text-center">#{idx+1}</span>
                                <input placeholder="De (R$)" type="number" className="flex-1 border p-2 rounded-lg text-sm bg-white" value={item.minValue} onChange={e => updateInss(idx, 'minValue', e.target.value)} />
                                <input placeholder="Até (R$)" type="number" className="flex-1 border p-2 rounded-lg text-sm bg-white" value={item.maxValue || ''} onChange={e => updateInss(idx, 'maxValue', e.target.value)} />
                                <input placeholder="%" type="number" className="w-24 border p-2 rounded-lg text-sm bg-white font-bold text-orange-700 text-center" value={item.rate} onChange={e => updateInss(idx, 'rate', e.target.value)} />
                                <button onClick={() => removeInss(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-blue-700">Tabela IRRF</h4>
                        <Button onClick={addIrrf} size="sm" variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"><Plus size={14}/> Adicionar Faixa</Button>
                    </div>
                    <div className="space-y-2">
                         <div className="flex gap-3 text-[10px] font-black text-slate-400 px-2 uppercase tracking-wider">
                            <span className="w-8"></span>
                            <span className="flex-1">Faixa Inicial</span>
                            <span className="flex-1">Faixa Final</span>
                            <span className="w-24 text-center">Alíquota (%)</span>
                            <span className="w-28 text-center">Dedução (R$)</span>
                            <span className="w-8"></span>
                        </div>
                        {irrfList.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 w-8 text-center">#{idx+1}</span>
                                <input type="number" className="flex-1 border p-2 rounded-lg text-sm bg-white" value={item.minValue} onChange={e => updateIrrf(idx, 'minValue', e.target.value)} />
                                <input type="number" className="flex-1 border p-2 rounded-lg text-sm bg-white" value={item.maxValue || ''} onChange={e => updateIrrf(idx, 'maxValue', e.target.value)} />
                                <input type="number" className="w-24 border p-2 rounded-lg text-sm bg-white font-bold text-blue-700 text-center" value={item.rate} onChange={e => updateIrrf(idx, 'rate', e.target.value)} />
                                <input type="number" className="w-28 border p-2 rounded-lg text-sm bg-white font-mono text-slate-600 text-right" value={item.deduction} onChange={e => updateIrrf(idx, 'deduction', e.target.value)} />
                                <button onClick={() => removeIrrf(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};