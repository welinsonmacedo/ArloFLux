import React, { useState, useEffect } from 'react';
import { useAuth } from '@/core/context/AuthProvider';
import { useStaff } from '@/core/context/StaffContext';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { 
    PlayCircle, PauseCircle, StopCircle, LogOut, 
    ArrowLeft, ShieldCheck, UserCheck, AlertTriangle, 
    Loader2, Clock, CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PunchType = 'IN' | 'BREAK_START' | 'BREAK_END' | 'OUT';

export const TimeClock: React.FC = () => {
    const { state: authState, logout } = useAuth();
    const { state: restState } = useRestaurant();
    const { state: staffState, registerTime, fetchData } = useStaff();
    const navigate = useNavigate();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ text: '', type: 'info' as 'info' | 'error' | 'success' });
    
    // Estados para Validação de CPF
    const [showVerify, setShowVerify] = useState(false);
    const [pendingAction, setPendingAction] = useState<PunchType | null>(null);
    const [cpfInput, setCpfInput] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchData(); 
        return () => clearInterval(timer);
    }, []);

    const user = authState.currentUser;

    // Lógica de Fluxo Sequencial baseada no registro de hoje
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysEntry = staffState.timeEntries.find(t => 
        t.staffId === user?.id && 
        new Date(t.entryDate).toISOString().split('T')[0] === todayStr &&
        t.status !== 'CORRECTED'
    );

    // Determina qual o ÚNICO botão que deve aparecer
    let currentStep: PunchType | 'FINISHED' = 'IN';

    if (todaysEntry) {
        if (!todaysEntry.clockIn) currentStep = 'IN';
        else if (todaysEntry.clockIn && !todaysEntry.breakStart && !todaysEntry.clockOut) currentStep = 'BREAK_START';
        else if (todaysEntry.breakStart && !todaysEntry.breakEnd) currentStep = 'BREAK_END';
        else if (todaysEntry.breakEnd && !todaysEntry.clockOut) currentStep = 'OUT';
        else if (todaysEntry.clockIn && !todaysEntry.breakStart && !todaysEntry.clockOut) currentStep = 'OUT'; // Caso não faça intervalo
        else if (todaysEntry.clockOut) currentStep = 'FINISHED';
    }

    const handleCpfChange = (val: string) => {
        const value = val.replace(/\D/g, '');
        const formatted = value
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
        setCpfInput(formatted);
    };

    const initiateAction = (type: PunchType) => {
        setPendingAction(type);
        setCpfInput('');
        setStatusMsg({ text: '', type: 'info' });
        setShowVerify(true);
    };

    const confirmPunch = async () => {
        if (!user || !pendingAction) return;

        const rawInput = cpfInput.replace(/\D/g, '');
        const userCpf = user.cpf?.replace(/\D/g, '');

        if (rawInput !== userCpf) {
            setStatusMsg({ text: "CPF INCORRETO PARA ESTE USUÁRIO!", type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const coords = await new Promise<{lat: number, lng: number} | null>((res) => {
                navigator.geolocation.getCurrentPosition(
                    (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
                    () => res(null),
                    { timeout: 5000 }
                );
            });

            await registerTime(user.id, pendingAction, undefined, coords || undefined);
            
            setStatusMsg({ text: "REGISTRO REALIZADO COM SUCESSO!", type: 'success' });
            setTimeout(() => {
                setShowVerify(false);
                setPendingAction(null);
                fetchData();
            }, 1500);

        } catch (e: any) {
            setStatusMsg({ text: e.message || "ERRO NO SERVIDOR", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
            
            {/* Header */}
            <header className="p-6 flex justify-between items-center bg-slate-900/50 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/modules')} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-black text-[10px] uppercase tracking-[0.3em] text-emerald-500 mb-1">Ponto Eletrônico</h1>
                        <p className="font-bold text-slate-200">{user?.name}</p>
                    </div>
                </div>
                <button onClick={logout} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <LogOut size={20} />
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                
                {/* Relógio Central */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-1 rounded-full mb-6 border border-white/10">
                        <Clock size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </span>
                    </div>
                    <div className="text-8xl md:text-[11rem] font-black font-mono tracking-tighter leading-none text-white drop-shadow-2xl">
                        {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-3xl md:text-5xl text-emerald-500/40 ml-2">
                            {currentTime.toLocaleTimeString('pt-BR', { second: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Área do Botão Único (Sequencial) */}
                <div className="w-full max-w-md">
                    {currentStep === 'IN' && (
                        <button onClick={() => initiateAction('IN')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-10 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-emerald-900/40 border-b-8 border-emerald-800">
                            <PlayCircle size={64} />
                            <span className="text-xl font-black uppercase tracking-[0.2em]">Iniciar Expediente</span>
                        </button>
                    )}

                    {currentStep === 'BREAK_START' && (
                        <button onClick={() => initiateAction('BREAK_START')} className="w-full bg-amber-500 hover:bg-amber-400 text-white p-10 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-amber-900/40 border-b-8 border-amber-700">
                            <PauseCircle size={64} />
                            <span className="text-xl font-black uppercase tracking-[0.2em]">Ir para Intervalo</span>
                        </button>
                    )}

                    {currentStep === 'BREAK_END' && (
                        <button onClick={() => initiateAction('BREAK_END')} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-10 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-blue-900/40 border-b-8 border-blue-800">
                            <PlayCircle size={64} />
                            <span className="text-xl font-black uppercase tracking-[0.2em]">Voltar do Intervalo</span>
                        </button>
                    )}

                    {currentStep === 'OUT' && (
                        <button onClick={() => initiateAction('OUT')} className="w-full bg-rose-600 hover:bg-rose-500 text-white p-10 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-rose-900/40 border-b-8 border-rose-800">
                            <StopCircle size={64} />
                            <span className="text-xl font-black uppercase tracking-[0.2em]">Encerrar Saída</span>
                        </button>
                    )}

                    {currentStep === 'FINISHED' && (
                         <div className="w-full bg-slate-900/50 border-2 border-slate-800 p-12 rounded-[2.5rem] flex flex-col items-center text-center gap-4 shadow-inner">
                             <CheckCircle size={64} className="text-emerald-500" />
                             <h4 className="text-2xl font-black uppercase tracking-widest text-white">Jornada Concluída</h4>
                             <p className="text-slate-500 text-sm font-bold">Obrigado pelo seu trabalho hoje. Bom descanso!</p>
                         </div>
                    )}
                </div>
            </main>

            {/* Modal de Validação de CPF */}
            {showVerify && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
                    <div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3 text-emerald-500">
                                <ShieldCheck size={28} />
                                <span className="font-black text-xs uppercase tracking-[0.2em]">Segurança ArloFlux</span>
                            </div>
                            <button onClick={() => setShowVerify(false)} className="text-slate-500 hover:text-white">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>

                        <h3 className="text-2xl font-black mb-2 text-white uppercase tracking-tight">Validar Identidade</h3>
                        <p className="text-slate-400 text-sm mb-8">Para confirmar sua <b>{pendingAction === 'IN' ? 'Entrada' : pendingAction === 'OUT' ? 'Saída' : 'Pausa'}</b>, digite seu CPF abaixo:</p>

                        <div className="space-y-6">
                            <div className="relative">
                                <input 
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="000.000.000-00"
                                    className="w-full bg-slate-950 border-2 border-slate-800 p-5 rounded-2xl text-3xl font-black font-mono tracking-widest focus:border-emerald-500 outline-none transition-all text-center"
                                    value={cpfInput}
                                    onChange={(e) => handleCpfChange(e.target.value)}
                                    autoFocus
                                />
                                {cpfInput.length === 14 && <UserCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={24} />}
                            </div>

                            {statusMsg.text && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-wider ${
                                    statusMsg.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}>
                                    <AlertTriangle size={16} />
                                    {statusMsg.text}
                                </div>
                            )}

                            <button 
                                onClick={confirmPunch}
                                disabled={loading || cpfInput.length < 14}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};