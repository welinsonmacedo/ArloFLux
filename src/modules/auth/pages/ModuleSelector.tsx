import React from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { useAuth } from '@/core/context/AuthProvider';
import { SystemModule } from '@/types';
import { PERMISSIONS_SCHEMA } from '@/constants';
import { 
  ChefHat, Coffee, Truck, ArrowRight, LogOut, Grid, Briefcase, 
  Settings, DollarSign, Store, Package, Users, Clock, LifeBuoy, 
  ShieldCheck, Sparkles, Star, Zap, Lock 
} from 'lucide-react';
import { Button } from '@/modules/common/components/Button';

interface ModuleCardProps {
  type: SystemModule | 'TIME_CLOCK' | 'SUPPORT';
  title: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  bgGradient: string;
  customIconUrl?: string;
  onClick: () => void;
  isNew?: boolean;
  isPopular?: boolean;
  isInactive?: boolean;
}

const ModuleCard = ({ 
  title, 
  desc, 
  icon: Icon, 
  gradient,
  bgGradient,
  customIconUrl,
  onClick,
  isNew,
  isPopular,
  isInactive
}: ModuleCardProps) => (
  <div 
    onClick={() => {
        if (isInactive) return; // Ignora o clique se estiver inativo
        onClick();
    }}
    className={`
      group relative rounded-2xl p-6 transition-all duration-500 ease-out overflow-hidden h-full flex flex-col
      ${isInactive 
        ? 'bg-slate-200/50 backdrop-blur-md border border-slate-300 cursor-not-allowed grayscale opacity-70' 
        : 'bg-white/95 backdrop-blur-sm border border-white/20 hover:scale-[1.02] hover:shadow-2xl hover:border-white/40 cursor-pointer'}
    `}
  >
    {/* Background Gradient Animation */}
    {!isInactive && <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out ${bgGradient}`} />}
    
    {/* Glass Effect Overlay */}
    {!isInactive && <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
    
    {/* Content */}
    <div className="relative z-10">
      {/* Icon Container */}
      <div className={`
        relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5
        ${isInactive 
            ? 'bg-slate-400' 
            : `${gradient} shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
      `}>
        {customIconUrl ? (
          <img src={customIconUrl} alt={title} className={`w-7 h-7 object-contain ${isInactive ? 'opacity-50' : 'brightness-0 invert'}`} />
        ) : (
          <Icon size={28} className={isInactive ? 'text-slate-200' : 'text-white'} strokeWidth={1.5} />
        )}
        
        {/* Badges */}
        {isNew && !isInactive && (
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">NOVO</div>
        )}
        {isPopular && !isNew && !isInactive && (
          <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"><Star size={12} className="inline mr-1" />POPULAR</div>
        )}
      </div>
      
      {/* Title */}
      <h3 className={`text-xl font-bold mb-2 transition-colors ${isInactive ? 'text-slate-500' : 'text-slate-800 group-hover:text-slate-900'}`}>
        {title}
      </h3>
      
      {/* Description */}
      <p className={`text-sm leading-relaxed mb-5 flex-1 ${isInactive ? 'text-slate-500' : 'text-slate-500'}`}>
        {desc}
      </p>
      
      {/* CTA */}
      <div className={`
        flex items-center gap-2 font-semibold text-sm transition-all duration-300
        ${isInactive 
            ? 'text-slate-500' 
            : `${gradient.replace('bg-gradient-to-r', 'text-transparent bg-clip-text bg-gradient-to-r')} group-hover:gap-3`}
      `}>
        <span>{isInactive ? 'Bloqueado' : 'Acessar módulo'}</span>
        {isInactive ? <Lock size={16} /> : <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
      </div>
    </div>
  </div>
);

export const ModuleSelector: React.FC = () => {
  const { state, setActiveModule } = useRestaurant();
  const { logout, state: authState } = useAuth();
  const navigate = useNavigate();

  const allowed = state.allowedModules || ['RESTAURANT', 'MANAGER', 'CONFIG', 'FINANCE', 'COMMERCE', 'INVENTORY', 'HR', 'AUDIT','TIMECLOCK','SUPPORT'];
  const tenantName = state.theme.restaurantName;
  const userName = authState.currentUser?.name?.split(' ')[0] || 'Usuário';
  
  // ✨ Checa se o estabelecimento está inativo (suspenso)
  const isInactive = state.isInactiveTenant;

  const isModuleAllowed = (module: SystemModule) => {
    if (!allowed.includes(module)) return false;
    if (authState.currentUser?.role === 'ADMIN') return true;
    if (!authState.currentUser?.allowedRoutes?.includes(module)) return false;
    
    if (authState.currentUser?.customRoleId) {
      const schema = PERMISSIONS_SCHEMA as any;
      const moduleFeatures = schema[module]?.features.map((f: any) => f.key) || [];
      const userFeatures = authState.currentUser.allowedFeatures || [];
      return moduleFeatures.some((mf: string) => userFeatures.includes(mf));
    }
    
    return true;
  };

  const handleSelect = (module: SystemModule) => {
    if (isInactive) return;

    setActiveModule(module);
    
    const routes: Record<SystemModule, string> = {
      RESTAURANT: '/restaurant',
      SNACKBAR: '/restaurant',
      MANAGER: '/admin',
      FINANCE: '/finance',
      CONFIG: '/settings',
      COMMERCE: '/commerce',
      DISTRIBUTOR: '/commerce',
      INVENTORY: '/inventory',
      HR: '/rh',
      AUDIT: '/audit',
      SUPPORT: '/manual',
      TIMECLOCK: '/time-clock'

    };
    
    navigate(routes[module] || '/');
  };

  const handleTimeClock = () => { if (!isInactive) navigate('/time-clock'); };
  const handleSupport = () => navigate('/manual');

  const bgUrl = state.theme.moduleSelectorBgUrl || state.globalSettings.moduleSelectorBgUrl;

  const gradients = {
    RESTAURANT: 'bg-gradient-to-r from-blue-500 to-blue-600',
    SNACKBAR: 'bg-gradient-to-r from-orange-500 to-orange-600',
    COMMERCE: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    DISTRIBUTOR: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
    MANAGER: 'bg-gradient-to-r from-purple-500 to-purple-600',
    INVENTORY: 'bg-gradient-to-r from-orange-500 to-red-500',
    HR: 'bg-gradient-to-r from-pink-500 to-rose-500',
    FINANCE: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    CONFIG: 'bg-gradient-to-r from-gray-500 to-gray-600',
    AUDIT: 'bg-gradient-to-r from-slate-600 to-slate-700',
    TIME_CLOCK: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    SUPPORT: 'bg-gradient-to-r from-lime-500 to-emerald-500'
  };

  const bgGradients = {
    RESTAURANT: 'bg-gradient-to-br from-blue-100/80 to-blue-200/40',
    SNACKBAR: 'bg-gradient-to-br from-orange-100/80 to-orange-200/40',
    COMMERCE: 'bg-gradient-to-br from-indigo-100/80 to-indigo-200/40',
    DISTRIBUTOR: 'bg-gradient-to-br from-cyan-100/80 to-cyan-200/40',
    MANAGER: 'bg-gradient-to-br from-purple-100/80 to-purple-200/40',
    INVENTORY: 'bg-gradient-to-br from-orange-100/80 to-red-100/40',
    HR: 'bg-gradient-to-br from-pink-100/80 to-rose-100/40',
    FINANCE: 'bg-gradient-to-br from-emerald-100/80 to-teal-100/40',
    CONFIG: 'bg-gradient-to-br from-gray-100/80 to-gray-200/40',
    AUDIT: 'bg-gradient-to-br from-slate-100/80 to-slate-200/40',
    TIME_CLOCK: 'bg-gradient-to-br from-cyan-100/80 to-blue-100/40',
    SUPPORT: 'bg-gradient-to-br from-lime-100/80 to-emerald-100/40'
  };

  return (
    <div 
      className="h-screen flex flex-col relative overflow-hidden font-sans"
      style={bgUrl ? {
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {!bgUrl && (
        <>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-[150px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-2000" />
        </>
      )}

      <header className="relative z-20 px-6 md:px-8 py-6 flex justify-between items-center backdrop-blur-md bg-white/10 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/30 shadow-lg">
            {state.theme.logoUrl ? (
              <img src={state.theme.logoUrl} className="w-8 h-8 object-contain" alt="logo" />
            ) : (
              <Sparkles className="text-white" size={24} />
            )}
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tight">{tenantName}</h1>
            <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
              Portal de Acesso
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-white font-bold text-sm flex items-center gap-2">
              Olá, {userName}
              <Zap size={14} className="text-yellow-300" />
            </p>
            <p className="text-white/60 text-xs">{authState.currentUser?.email}</p>
          </div>
          <Button 
            onClick={logout} 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
          >
            <LogOut size={18} />
            <span className="hidden md:inline ml-2">Sair</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10">     
        <div className="flex flex-col items-center justify-center py-6 md:py-8 px-4 md:px-6 min-h-full">
          
          {/* ✨ Alerta de Bloqueio para Empresas Inativas */}
          {isInactive && (
            <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-4 rounded-xl mb-8 flex items-center gap-4 shadow-2xl border border-red-400 max-w-3xl w-full">
                <Lock size={32} />
                <div>
                    <p className="font-bold text-lg">Sistema Suspenso</p>
                    <p className="text-sm opacity-90">O acesso aos módulos operacionais do seu estabelecimento encontra-se bloqueado temporariamente. Por favor, contacte o suporte para regularizar a situação.</p>
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 max-w-7xl w-full mx-auto pb-8">
            <ModuleCard 
              type="TIME_CLOCK"
              title="Bater Ponto"
              desc="Registro de entrada, saída e intervalos de forma rápida"
              icon={Clock}
              gradient={gradients.TIME_CLOCK}
              bgGradient={bgGradients.TIME_CLOCK}
              onClick={handleTimeClock}
              customIconUrl={state.theme.moduleIcons?.['TIMECLOCK'] || state.globalSettings.moduleIcons?.['TIMECLOCK']}
              isInactive={isInactive}
            />
            
            {isModuleAllowed('RESTAURANT') && (
              <ModuleCard 
                type="RESTAURANT"
                title="Restaurante"
                desc="Salão, mesas, KDS e caixa gastronômico completo"
                icon={ChefHat}
                gradient={gradients.RESTAURANT}
                bgGradient={bgGradients.RESTAURANT}
                onClick={() => handleSelect('RESTAURANT')}
                customIconUrl={state.theme.moduleIcons?.['RESTAURANT'] || state.globalSettings.moduleIcons?.['RESTAURANT']}
                isPopular
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('SNACKBAR') && (
              <ModuleCard 
                type="SNACKBAR"
                title="Lanchonete"
                desc="Fluxo rápido com senha, entrega e caixa otimizado"
                icon={Coffee}
                gradient={gradients.SNACKBAR}
                bgGradient={bgGradients.SNACKBAR}
                onClick={() => handleSelect('SNACKBAR')}
                customIconUrl={state.theme.moduleIcons?.['SNACKBAR'] || state.globalSettings.moduleIcons?.['SNACKBAR']}
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('COMMERCE') && (
              <ModuleCard 
                type="COMMERCE"
                title="Varejo"
                desc="PDV rápido com leitor de código e venda balcão"
                icon={Store}
                gradient={gradients.COMMERCE}
                bgGradient={bgGradients.COMMERCE}
                onClick={() => handleSelect('COMMERCE')}
                customIconUrl={state.theme.moduleIcons?.['COMMERCE'] || state.globalSettings.moduleIcons?.['COMMERCE']}
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('DISTRIBUTOR') && (
              <ModuleCard 
                type="DISTRIBUTOR"
                title="Distribuidora"
                desc="Venda atacado, rotas e estoque por grade"
                icon={Truck}
                gradient={gradients.DISTRIBUTOR}
                bgGradient={bgGradients.DISTRIBUTOR}
                onClick={() => handleSelect('DISTRIBUTOR')}
                customIconUrl={state.theme.moduleIcons?.['DISTRIBUTOR'] || state.globalSettings.moduleIcons?.['DISTRIBUTOR']}
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('MANAGER') && (
              <ModuleCard 
                type="MANAGER"
                title="Gestor"
                desc="Backoffice operacional com gestão de cardápio e mesas"
                icon={Briefcase}
                gradient={gradients.MANAGER}
                bgGradient={bgGradients.MANAGER}
                onClick={() => handleSelect('MANAGER')}
                customIconUrl={state.theme.moduleIcons?.['MANAGER'] || state.globalSettings.moduleIcons?.['MANAGER']}
                isNew
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('INVENTORY') && (
              <ModuleCard 
                type="INVENTORY"
                title="Estoque"
                desc="Controle de insumos, compras e fichas técnicas"
                icon={Package}
                gradient={gradients.INVENTORY}
                bgGradient={bgGradients.INVENTORY}
                onClick={() => handleSelect('INVENTORY')}
                customIconUrl={state.theme.moduleIcons?.['INVENTORY'] || state.globalSettings.moduleIcons?.['INVENTORY']}
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('HR') && (
              <ModuleCard 
                type="HR"
                title="RH & Equipe"
                desc="Gestão de ponto, escalas e pré-folha de pagamento"
                icon={Users}
                gradient={gradients.HR}
                bgGradient={bgGradients.HR}
                onClick={() => handleSelect('HR')}
                customIconUrl={state.theme.moduleIcons?.['HR'] || state.globalSettings.moduleIcons?.['HR']}
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('FINANCE') && (
              <ModuleCard 
                type="FINANCE"
                title="Financeiro"
                desc="Fluxo de caixa, DRE e business intelligence"
                icon={DollarSign}
                gradient={gradients.FINANCE}
                bgGradient={bgGradients.FINANCE}
                onClick={() => handleSelect('FINANCE')}
                customIconUrl={state.theme.moduleIcons?.['FINANCE'] || state.globalSettings.moduleIcons?.['FINANCE']}
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('CONFIG') && (
              <ModuleCard 
                type="CONFIG"
                title="Configurações"
                desc="Dados da empresa, usuários e segurança"
                icon={Settings}
                gradient={gradients.CONFIG}
                bgGradient={bgGradients.CONFIG}
                onClick={() => handleSelect('CONFIG')}
                customIconUrl={state.theme.moduleIcons?.['CONFIG'] || state.globalSettings.moduleIcons?.['CONFIG']}
                isInactive={isInactive}
              />
            )}
            
            {isModuleAllowed('AUDIT') && (
              <ModuleCard 
                type="AUDIT"
                title="Auditoria"
                desc="Logs de atividades e monitoramento de segurança"
                icon={ShieldCheck}
                gradient={gradients.AUDIT}
                bgGradient={bgGradients.AUDIT}
                onClick={() => handleSelect('AUDIT')}
                customIconUrl={state.theme.moduleIcons?.['AUDIT'] || state.globalSettings.moduleIcons?.['AUDIT']}
                isInactive={isInactive}
              />
            )}

            {/* Support - Este módulo não fica inativo para permitir contato */}
            <ModuleCard 
              type="SUPPORT"
              title="Suporte & Ajuda"
              desc="Precisa de ajuda? Fale com nossos especialistas"
              icon={LifeBuoy}
              gradient={gradients.SUPPORT}
              bgGradient={bgGradients.SUPPORT}
              onClick={handleSupport}
              customIconUrl={state.theme.moduleIcons?.['SUPPORT'] || state.globalSettings.moduleIcons?.['SUPPORT']}
            />
          </div>

          <div className="text-center py-6 mt-4">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} {tenantName} - Todos os direitos reservados
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};