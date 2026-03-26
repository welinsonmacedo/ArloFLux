import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { useRestaurant } from '@/core/context/RestaurantContext';
import { 
  Coffee, DollarSign, Settings, 
  ArrowRight, CheckCircle, Bell, QrCode, 
  Monitor, Smartphone, Play, AlertTriangle,
  ArrowLeft, BookOpen, Users, LayoutDashboard,
  Package, FileText, TrendingUp, Truck, Lock, Calculator, Layers,
  HelpCircle, MessageCircle, RefreshCw, ShieldCheck, MousePointerClick,
  Search, ChevronDown, Star, ExternalLink, Headphones,
  Video, FileQuestion, Clock, Award, Zap, Heart
} from 'lucide-react';
import { TicketsClient } from '@/modules/support/components/TicketsClient';

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  description?: string;
}

const RoleCard: React.FC<RoleCardProps> = ({ icon, title, color, active, onClick, badge, description }) => {
  const colorMap: Record<string, { bg: string; activeBg: string; text: string; border: string }> = {
    orange: { bg: 'bg-orange-50', activeBg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-200' },
    red: { bg: 'bg-red-50', activeBg: 'bg-red-500', text: 'text-red-700', border: 'border-red-200' },
    green: { bg: 'bg-green-50', activeBg: 'bg-green-500', text: 'text-green-700', border: 'border-green-200' },
    purple: { bg: 'bg-purple-50', activeBg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200' },
    emerald: { bg: 'bg-emerald-50', activeBg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200' },
    blue: { bg: 'bg-blue-50', activeBg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200' },
    pink: { bg: 'bg-pink-50', activeBg: 'bg-pink-500', text: 'text-pink-700', border: 'border-pink-200' },
    slate: { bg: 'bg-slate-50', activeBg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-200' },
    indigo: { bg: 'bg-indigo-50', activeBg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200' },
  };
  
  const colors = colorMap[color] || colorMap.slate;
  
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 text-left mb-2 group
        ${active 
          ? `${colors.activeBg} text-white shadow-lg` 
          : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
        }`}
    >
      <div className={`p-2 rounded-lg shrink-0 transition-all duration-200 ${
        active 
          ? 'bg-white/20 text-white' 
          : `${colors.bg} text-gray-600 group-hover:scale-105`
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={`font-bold text-sm truncate ${active ? 'text-white' : colors.text}`}>
            {title}
          </h3>
          {badge && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {badge}
            </span>
          )}
        </div>
        {description && !active && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{description}</p>
        )}
      </div>
      <ArrowRight size={16} className={`shrink-0 transition-all duration-200 ${
        active ? 'text-white translate-x-1' : 'text-gray-300 group-hover:translate-x-1'
      }`} />
    </button>
  );
};

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  tips?: string[];
  videoUrl?: string;
}

const Step: React.FC<StepProps> = ({ number, title, description, icon, tips, videoUrl }) => (
  <div className="flex gap-4 mb-6 group">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-200">
        {number}
      </div>
      <div className="w-0.5 h-full bg-gradient-to-b from-blue-200 to-transparent absolute top-10 bottom-0 -z-0"></div>
    </div>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            {title}
          </h4>
          {icon && (
            <div className="text-gray-400 bg-gray-50 p-2 rounded-lg shrink-0">
              {icon}
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          {description}
        </p>
        {tips && tips.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <Zap size={12} /> Dicas úteis:
            </p>
            <ul className="space-y-1">
              {tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-gray-500 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        {videoUrl && (
          <a 
            href={videoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Video size={14} />
            Assistir vídeo tutorial
          </a>
        )}
      </div>
    </div>
  </div>
);

interface FaqItemProps {
  question: string;
  answer: string;
  category?: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, category }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-3 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle size={18} className="text-blue-500 shrink-0" />
            <h4 className="font-bold text-gray-800">{question}</h4>
          </div>
          {category && (
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {category}
            </span>
          )}
        </div>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-100">
          <p className="text-gray-600 text-sm leading-relaxed pl-7">{answer}</p>
        </div>
      )}
    </div>
  );
};

type ManualTab = 
  | 'WAITER' 
  | 'KITCHEN' 
  | 'CASHIER' 
  | 'INVENTORY' 
  | 'FINANCE' 
  | 'ADMIN' 
  | 'CLIENT' 
  | 'SUPPORT' 
  | 'TICKETS';

export const ManualPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ManualTab>('SUPPORT');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { state } = useRestaurant();
  const allowed = state.allowedModules || [];

  const showRestaurant = allowed.includes('RESTAURANT') || allowed.includes('SNACKBAR');
  const showCommerce = allowed.includes('COMMERCE') || allowed.includes('DISTRIBUTOR');
  const showInventory = allowed.includes('INVENTORY');
  const showFinance = allowed.includes('FINANCE');
  const showAdmin = allowed.includes('MANAGER') || allowed.includes('CONFIG');
  const showClient = showRestaurant || showCommerce;

  // Set initial active tab based on what's available
  useEffect(() => {
    if (showRestaurant) setActiveTab('WAITER');
    else if (showInventory) setActiveTab('INVENTORY');
    else if (showFinance) setActiveTab('FINANCE');
    else if (showAdmin) setActiveTab('ADMIN');
    else if (showClient) setActiveTab('CLIENT');
    else setActiveTab('SUPPORT');
  }, [showRestaurant, showInventory, showFinance, showAdmin, showClient]);

  // Filter FAQ items based on search
  const faqItems = [
    { question: "O sistema funciona sem internet?", answer: "O ArloFlux é um sistema em nuvem e requer conexão com a internet para sincronizar pedidos entre Garçom, Cozinha e Caixa. Se a internet cair, você não conseguirá lançar novos pedidos até que ela retorne.", category: "Técnico" },
    { question: "Como reimprimir um QR Code de mesa?", answer: "Vá em Admin > Mesas. Encontre a mesa desejada e clique no ícone de QR Code. Você pode imprimir apenas aquele ou gerar um PDF com todas as mesas.", category: "Configuração" },
    { question: "Esqueci minha senha de Admin. O que fazer?", answer: "Na tela de login, clique em 'Recuperar Senha'. Um link de redefinição será enviado para o e-mail cadastrado do proprietário.", category: "Segurança" },
    { question: "O som de notificação não toca.", answer: "Verifique se o volume do dispositivo está alto e se o navegador tem permissão para reproduzir som. Em alguns navegadores, é necessário interagir com a página (clicar em algo) pelo menos uma vez para liberar o áudio.", category: "Solução de Problemas" },
    { question: "Como cancelar um pedido já enviado para a cozinha?", answer: "Vá no histórico de pedidos da mesa, encontre o item e clique em 'Cancelar'. O item será removido e a cozinha será notificada.", category: "Operacional" },
    { question: "Posso integrar com iFood?", answer: "Sim! O ArloFlux possui integração nativa com iFood. Entre em contato com o suporte para ativar e configurar a integração.", category: "Integrações" },
    { question: "Como gerar relatório de vendas por período?", answer: "Acesse o módulo Financeiro > Relatórios. Selecione o período desejado e clique em 'Gerar'. Você pode exportar para Excel ou PDF.", category: "Financeiro" },
    { question: "O que é CMV e como calcular?", answer: "CMV (Custo da Mercadoria Vendida) é o custo total dos ingredientes utilizados nas vendas. O sistema calcula automaticamente baseado nas fichas técnicas.", category: "Estoque" },
  ];

  const filteredFaqs = faqItems.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const supportChannels = [
    { icon: MessageCircle, title: "Chat Online", description: "Atendimento instantâneo", action: "Abrir chat", color: "green", link: "#" },
    { icon: Headphones, title: "Suporte Telefônico", description: "Segunda a Sexta, 9h-18h", action: "(11) 4000-0000", color: "blue", link: "tel:1140000000" },
    { icon: Mail, title: "E-mail", description: "Resposta em até 24h", action: "suporte@arloflux.com", color: "purple", link: "mailto:suporte@arloflux.com" },
    { icon: Video, title: "Vídeos Tutoriais", description: "Aprenda no seu ritmo", action: "Ver canal", color: "red", link: "#" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar Navigation */}
      <aside className={`
        ${sidebarCollapsed ? 'w-20' : 'w-80'} 
        bg-white border-r border-gray-200 transition-all duration-300 flex flex-col
        h-screen sticky top-0 z-20 shadow-lg
      `}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              {!sidebarCollapsed && (
                <Link to="/login" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft size={20} className="text-gray-500" />
                </Link>
              )}
              <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} className="text-white" />
                </div>
                {!sidebarCollapsed && (
                  <span className="font-extrabold text-gray-800 text-lg">Manual</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown size={16} className={`transform transition-transform ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {!sidebarCollapsed && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar no manual..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            {(showRestaurant || showCommerce) && (
              <div>
                {!sidebarCollapsed && (
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-2 tracking-wider">
                    Operacional
                  </div>
                )}
                <div className="space-y-1">
                  {showRestaurant && (
                    <>
                      <RoleCard 
                        icon={<Coffee size={18} />} 
                        title={sidebarCollapsed ? "" : "Garçom & Salão"} 
                        color="orange" 
                        active={activeTab === 'WAITER'} 
                        onClick={() => setActiveTab('WAITER')}
                        description="Gestão de mesas e pedidos"
                      />
                      <RoleCard 
                        icon={<Monitor size={18} />} 
                        title={sidebarCollapsed ? "" : "Cozinha (KDS)"} 
                        color="red" 
                        active={activeTab === 'KITCHEN'} 
                        onClick={() => setActiveTab('KITCHEN')}
                        description="Monitor de produção"
                      />
                    </>
                  )}
                  <RoleCard 
                    icon={<DollarSign size={18} />} 
                    title={sidebarCollapsed ? "" : "Frente de Caixa"} 
                    color="green" 
                    active={activeTab === 'CASHIER'} 
                    onClick={() => setActiveTab('CASHIER')}
                    description="PDV e recebimentos"
                  />
                </div>
              </div>
            )}

            {(showInventory || showFinance || showAdmin) && (
              <div>
                {!sidebarCollapsed && (
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 mt-4 ml-2 tracking-wider">
                    Gestão (ERP)
                  </div>
                )}
                <div className="space-y-1">
                  {showInventory && (
                    <RoleCard 
                      icon={<Package size={18} />} 
                      title={sidebarCollapsed ? "" : "Estoque & Fichas"} 
                      color="purple" 
                      active={activeTab === 'INVENTORY'} 
                      onClick={() => setActiveTab('INVENTORY')}
                      description="Controle de insumos"
                    />
                  )}
                  {showFinance && (
                    <RoleCard 
                      icon={<TrendingUp size={18} />} 
                      title={sidebarCollapsed ? "" : "Financeiro & DRE"} 
                      color="emerald" 
                      active={activeTab === 'FINANCE'} 
                      onClick={() => setActiveTab('FINANCE')}
                      description="Fluxo de caixa"
                    />
                  )}
                  {showAdmin && (
                    <RoleCard 
                      icon={<Settings size={18} />} 
                      title={sidebarCollapsed ? "" : "Admin & Config"} 
                      color="blue" 
                      active={activeTab === 'ADMIN'} 
                      onClick={() => setActiveTab('ADMIN')}
                      description="Configurações do sistema"
                    />
                  )}
                </div>
              </div>
            )}

            <div>
              {!sidebarCollapsed && (
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 mt-4 ml-2 tracking-wider">
                  Cliente & Ajuda
                </div>
              )}
              <div className="space-y-1">
                {showClient && (
                  <RoleCard 
                    icon={<Smartphone size={18} />} 
                    title={sidebarCollapsed ? "" : "App do Cliente"} 
                    color="pink" 
                    active={activeTab === 'CLIENT'} 
                    onClick={() => setActiveTab('CLIENT')}
                    description="Experiência do cliente"
                  />
                )}
                <RoleCard 
                  icon={<HelpCircle size={18} />} 
                  title={sidebarCollapsed ? "" : "Suporte & FAQ"} 
                  color="slate" 
                  active={activeTab === 'SUPPORT'} 
                  onClick={() => setActiveTab('SUPPORT')}
                  description="Perguntas frequentes"
                />
                <RoleCard 
                  icon={<MessageCircle size={18} />} 
                  title={sidebarCollapsed ? "" : "Chamados"} 
                  color="indigo" 
                  active={activeTab === 'TICKETS'} 
                  onClick={() => setActiveTab('TICKETS')}
                  description="Abrir ticket de suporte"
                  badge={3}
                />
              </div>
            </div>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700">Precisa de ajuda?</span>
              </div>
              <p className="text-[10px] text-gray-600 mb-2">
                Nossa equipe está disponível para te ajudar
              </p>
              <a 
                href="#" 
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Falar com suporte
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          
          {/* --- WAITER SECTION --- */}
          {activeTab === 'WAITER' && (
            <div className="animate-fadeIn">
              <header className="mb-10">
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                  <Coffee size={14} /> Operacional
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Garçom & Atendimento
                </h1>
                <p className="text-lg text-gray-500">
                  Gestão de mesas, pedidos e chamados em tempo real. Aumente a eficiência do seu atendimento.
                </p>
              </header>

              <Step 
                number={1}
                title="Abrir Mesa & Senha"
                description="Toque em uma mesa LIVRE (Cinza) para abri-la. Digite o nome do cliente. O sistema gerará um código de 4 dígitos. Entregue este código ao cliente caso ele queira fazer pedidos pelo próprio celular via QR Code."
                icon={<Smartphone className="text-orange-500" />}
                tips={["O código é único para cada sessão", "O cliente pode escanear o QR Code mesmo sem o código"]}
              />

              <Step 
                number={2}
                title="Lançar Pedidos"
                description="Para anotar pedidos manualmente: Toque em uma mesa OCUPADA e selecione 'Fazer Pedido'. Você pode buscar produtos, adicionar observações (ex: 'sem gelo') e enviar direto para as telas da cozinha/bar."
                icon={<CheckCircle className="text-blue-500" />}
                tips={["Use observações para personalizações", "Itens com observações ficam destacados na cozinha"]}
              />

              <Step 
                number={3}
                title="Drawer 'Para Servir'"
                description="A barra inferior (celular) ou lateral (tablet) mostra os pratos prontos. Quando a cozinha finaliza um item, ele aparece aqui. Entregue ao cliente e clique em 'Marcar Entregue' para limpar a lista."
                icon={<Bell className="text-yellow-500" />}
                tips={["Itens ficam agrupados por mesa", "Notificação sonora ao receber novo pedido"]}
              />

              <Step 
                number={4}
                title="Alertas e Chamados"
                description="Se um cliente solicitar ajuda pelo app dele, a mesa ficará VERMELHA e pulsando no seu painel com um alerta sonoro. Toque na mesa para confirmar o atendimento."
                icon={<AlertTriangle className="text-red-500" />}
                tips={["Atenda rapidamente para melhorar a experiência", "O histórico de chamados fica registrado"]}
              />

              <Step 
                number={5}
                title="Transferência e Junção"
                description="Para juntar mesas ou trocar clientes de lugar, use a opção 'Ações da Mesa' > 'Transferir'. Selecione a mesa de destino. Todos os pedidos serão movidos."
                icon={<RefreshCw className="text-purple-500" />}
                tips={["Útil para grupos grandes", "Os pedidos mantêm o histórico original"]}
              />
            </div>
          )}

          {/* --- KITCHEN SECTION --- */}
          {activeTab === 'KITCHEN' && (
            <div className="animate-fadeIn">
              <header className="mb-10">
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                  <Monitor size={14} /> Produção
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  KDS - Kitchen Display System
                </h1>
                <p className="text-lg text-gray-500">
                  Sistema de exibição de pedidos para substituir impressoras e otimizar a produção.
                </p>
              </header>

              <Step 
                number={1}
                title="Chegada de Pedidos"
                description="Novos pedidos aparecem automaticamente com som e borda piscante (Amarelo). Os cartões mostram o número da mesa, nome do prato, quantidade e observações em destaque."
                icon={<Bell size={20} />}
                tips={["Pedidos são organizados por ordem de chegada", "Observações personalizadas ficam em destaque"]}
              />

              <Step 
                number={2}
                title="Iniciar e Finalizar"
                description="Toque em 'INICIAR' para indicar que o prato está sendo feito (fica Azul). Ao terminar, toque em 'PRONTO' (Verde). O item sai da sua tela e notifica o garçom para buscar."
                icon={<Play size={20} />}
                tips={["Use o tempo médio para referência", "Itens prontos vão para a fila de entrega"]}
              />

              <Step 
                number={3}
                title="Monitoramento de Tempo"
                description="Cada cartão possui um cronômetro. Se um pedido demorar muito (ex: > 20min), o cartão ficará vermelho para alertar a equipe sobre o atraso."
                icon={<Clock size={20} />}
                tips={["Defina metas de tempo para cada tipo de prato", "Acompanhe a performance da cozinha"]}
                videoUrl="#"
              />

              <Step 
                number={4}
                title="Histórico de Produção"
                description="Clicando no ícone de Histórico no topo da tela, você pode ver os últimos pratos finalizados e, se necessário, retorná-los para a produção em caso de erro."
                icon={<RefreshCw size={20} />}
                tips={["Útil para correções rápidas", "Mantenha o histórico organizado"]}
              />
            </div>
          )}

          {/* --- CASHIER SECTION --- */}
          {activeTab === 'CASHIER' && (
            <div className="animate-fadeIn">
              <header className="mb-10">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                  <DollarSign size={14} /> Frente de Caixa
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Caixa & PDV
                </h1>
                <p className="text-lg text-gray-500">
                  Controle de turno, recebimento de mesas e venda balcão.
                </p>
              </header>

              <Step 
                number={1}
                title="Abertura de Caixa"
                description="Antes de começar a vender, é necessário abrir o caixa informando o 'Fundo de Troco' (valor em dinheiro físico na gaveta)."
                icon={<Lock size={20} />}
                tips={["Sempre confira o fundo de troco antes de abrir", "O histórico de aberturas fica registrado"]}
              />

              <Step 
                number={2}
                title="Receber Mesas"
                description="Na aba 'Mesas', selecione uma mesa ocupada para ver o extrato. Escolha a forma de pagamento (Dinheiro, Pix, Cartão). Isso libera a mesa e registra a venda."
                icon={<QrCode size={20} />}
                tips={["Permite dividir a conta entre várias formas de pagamento", "Gera comanda detalhada"]}
              />

              <Step 
                number={3}
                title="PDV Balcão (Venda Rápida)"
                description="Use a aba 'Balcão' para vendas diretas sem abrir mesa (ex: cliente que compra uma água e vai embora). Adicione itens ao carrinho e finalize a venda imediatamente."
                icon={<DollarSign size={20} />}
                tips={["Ideal para retiradas e delivery", "Processo mais rápido que abrir mesa"]}
              />

              <Step 
                number={4}
                title="Sangria e Fechamento"
                description="Use a aba 'Gestão' para registrar Sangrias (retirada de dinheiro da gaveta). Ao fim do dia, faça o 'Fechar Caixa', informando o valor contado. O sistema mostrará as sobras ou faltas."
                icon={<LayoutDashboard size={20} />}
                tips={["Registre cada sangria com motivo", "O fechamento gera relatório completo"]}
              />

              <Step 
                number={5}
                title="Delivery"
                description="Na aba 'Delivery', você gerencia pedidos que chegam por telefone ou iFood (se integrado). Cadastre o cliente, lance o pedido e acompanhe o status até a entrega."
                icon={<Truck size={20} />}
                tips={["Integração com iFood disponível", "Acompanhe o tempo de entrega"]}
              />
            </div>
          )}

          {/* --- INVENTORY SECTION --- */}
          {activeTab === 'INVENTORY' && (
            <div className="animate-fadeIn">
              <header className="mb-10">
                <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                  <Package size={14} /> ERP - Gestão
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Estoque & Fichas Técnicas
                </h1>
                <p className="text-lg text-gray-500">
                  Controle de insumos, receitas e compras para otimizar seu CMV.
                </p>
              </header>

              <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl p-6 border border-purple-100 shadow-sm mb-8">
                <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                  <Layers size={18} /> Tipos de Item
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <p className="font-bold text-orange-600 mb-1">Matéria Prima</p>
                    <p className="text-xs text-gray-600">Ingredientes puros (ex: Farinha, Ovo, Carne). Não aparecem no cardápio.</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <p className="font-bold text-blue-600 mb-1">Revenda</p>
                    <p className="text-xs text-gray-600">Produtos prontos para vender (ex: Coca-Cola, Chocolate).</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-100">
                    <p className="font-bold text-purple-600 mb-1">Produzido</p>
                    <p className="text-xs text-gray-600">Pratos com ficha técnica. Ao vender, baixa os ingredientes.</p>
                  </div>
                </div>
              </div>

              <Step 
                number={1}
                title="Cadastrar Insumos"
                description="Vá em Admin > Estoque > Novo Item. Cadastre seus ingredientes (ex: Pão, Carne, Queijo) marcando como 'Matéria Prima' e definindo a unidade (KG, UN)."
                icon={<Package size={20} />}
                tips={["Use unidades padronizadas", "Defina estoque mínimo para alertas"]}
              />

              <Step 
                number={2}
                title="Criar Ficha Técnica (Receita)"
                description="Crie um novo item do tipo 'Produzido' (ex: X-Salada). Na seção 'Composição', adicione os ingredientes cadastrados anteriormente e suas quantidades. O sistema calculará o custo do prato (CMV) automaticamente."
                icon={<FileText size={20} />}
                tips={["Calcule perdas na ficha técnica", "Atualize os preços conforme mercado"]}
              />

              <Step 
                number={3}
                title="Entrada de Notas (Compras)"
                description="Ao receber mercadoria, vá em 'Entrada Nota'. Selecione o fornecedor e adicione os itens. O sistema atualiza a quantidade em estoque, recalcula o preço de custo médio e cria as parcelas no Contas a Pagar."
                icon={<Truck size={20} />}
                tips={["Confira os valores antes de finalizar", "Anexe a nota fiscal digitalmente"]}
              />

              <Step 
                number={4}
                title="Inventário (Balanço)"
                description="Periodicamente, use a função 'Inventário' para contar o estoque físico. O sistema comparará com o virtual e fará os ajustes de perda/sobra automaticamente."
                icon={<CheckCircle size={20} />}
                tips={["Faça inventários mensais", "Identifique desvios e perdas"]}
                videoUrl="#"
              />
            </div>
          )}

          {/* --- FINANCE SECTION --- */}
          {activeTab === 'FINANCE' && (
            <div className="animate-fadeIn">
              <header className="mb-10">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                  <TrendingUp size={14} /> ERP - Gestão
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Financeiro & Contábil
                </h1>
                <p className="text-lg text-gray-500">
                  Fluxo de caixa, contas a pagar e DRE Gerencial para gestão financeira completa.
                </p>
              </header>

              <Step 
                number={1}
                title="Contas a Pagar"
                description="Cadastre despesas manuais (Aluguel, Luz, Funcionários) ou automáticas (vindas da Entrada de Notas). Acompanhe os vencimentos e dê baixa quando realizar o pagamento."
                icon={<DollarSign size={20} />}
                tips={["Use categorias para organizar", "Programe pagamentos recorrentes"]}
              />

              <Step 
                number={2}
                title="DRE Gerencial"
                description="O relatório DRE (Demonstração do Resultado do Exercício) cruza suas Vendas (Receita) com o Custo das Mercadorias (CMV) e Despesas Operacionais para mostrar o Lucro Líquido real do período."
                icon={<FileText size={20} />}
                tips={["Analise mensalmente", "Compare com meses anteriores"]}
              />

              <Step 
                number={3}
                title="Fluxo de Caixa"
                description="Visualize quanto entrou em cada método de pagamento (Pix, Cartão, Dinheiro). O sistema separa o que é 'Dinheiro de Gaveta' (físico) do que é 'Dinheiro em Conta' (digital)."
                icon={<TrendingUp size={20} />}
                tips={["Controle de entradas e saídas", "Projeção de fluxo futuro"]}
              />
            </div>
          )}

          {/* --- ADMIN SECTION --- */}
          {activeTab === 'ADMIN' && (
            <div className="animate-fadeIn">
              <header className="mb-10">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                  <Settings size={14} /> Configuração
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Administração Geral
                </h1>
                <p className="text-lg text-gray-500">
                  Cardápio digital, equipe e personalização completa do sistema.
                </p>
              </header>

              <Step 
                number={1}
                title="Cardápio de Venda"
                description="Em 'Cardápio', você define quais itens do estoque aparecem para o cliente. Você pode alterar nomes, adicionar fotos atrativas, descrições e ocultar produtos temporariamente sem apagá-los do estoque."
                icon={<BookOpen size={20} />}
                tips={["Use fotos de alta qualidade", "Atualize preços regularmente"]}
              />

              <Step 
                number={2}
                title="Equipe e Acessos"
                description="Cadastre seus funcionários e defina cargos (Garçom, Cozinheiro, Caixa). Cada cargo tem acesso limitado às suas funções. Gere um link de convite para que eles criem suas próprias senhas."
                icon={<Users size={20} />}
                tips={["Defina permissões específicas", "Revogue acessos quando necessário"]}
              />

              <Step 
                number={3}
                title="Mesas e QR Code"
                description="Gerencie o layout das mesas. O sistema gera os QR Codes automaticamente prontos para impressão. Se precisar deletar uma mesa, o QR antigo para de funcionar por segurança."
                icon={<QrCode size={20} />}
                tips={["Imprima os QR Codes em material resistente", "Teste antes de fixar nas mesas"]}
              />

              <Step 
                number={4}
                title="Personalização (White Label)"
                description="Insira sua logomarca, altere as cores do sistema para combinar com sua marca e escolha o layout do cardápio (Lista ou Grade com fotos grandes)."
                icon={<Settings size={20} />}
                tips={["Mantenha identidade visual consistente", "Teste em diferentes dispositivos"]}
              />
            </div>
          )}

          {/* --- CLIENT APP SECTION --- */}
          {activeTab === 'CLIENT' && (
            <div className="animate-fadeIn">
              <header className="mb-10">
                <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                  <Smartphone size={14} /> Experiência
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  App do Cliente
                </h1>
                <p className="text-lg text-gray-500">
                  Como seu cliente interage com o cardápio digital na mesa, aumentando a autonomia e satisfação.
                </p>
              </header>

              <Step 
                number={1}
                title="Acesso via QR Code"
                description="O cliente aponta a câmera do celular para o QR Code da mesa. Não é necessário baixar nenhum aplicativo. O cardápio abre instantaneamente no navegador."
                icon={<QrCode size={20} />}
                tips={["QR Codes são exclusivos por mesa", "Funciona em qualquer smartphone"]}
              />

              <Step 
                number={2}
                title="Navegação e Pedido"
                description="O cliente navega pelas categorias, vê fotos e descrições. Ao adicionar um item, ele pode personalizar (ex: ponto da carne, adicionais). O carrinho permite revisar antes de confirmar."
                icon={<MousePointerClick size={20} />}
                tips={["Cardápio responsivo", "Personalizações claras e visíveis"]}
              />

              <Step 
                number={3}
                title="Autenticação de Segurança"
                description="Para evitar pedidos falsos, o sistema pode pedir o 'Código da Mesa' (4 dígitos) que o garçom fornece ao abrir a mesa. Isso garante que apenas quem está na mesa faça pedidos."
                icon={<ShieldCheck size={20} />}
                tips={["Segurança contra pedidos indevidos", "Código único por sessão"]}
              />

              <Step 
                number={4}
                title="Chamar Garçom e Conta"
                description="Botões dedicados permitem chamar o garçom ou pedir a conta diretamente pelo celular, agilizando o atendimento e reduzindo filas no caixa."
                icon={<Bell size={20} />}
                tips={["Reduz tempo de espera", "Melhora experiência do cliente"]}
              />
            </div>
          )}

          {/* --- SUPPORT SECTION --- */}
          {activeTab === 'SUPPORT' && (
            <div className="animate-fadeIn">
              <header className="mb-10">
                <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                  <HelpCircle size={14} /> Ajuda
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Suporte & FAQ
                </h1>
                <p className="text-lg text-gray-500">
                  Respostas para problemas comuns e canais de atendimento especializado.
                </p>
              </header>

              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar perguntas frequentes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                  />
                </div>
              </div>

              {/* FAQ Section */}
              <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Star size={20} className="text-yellow-500" />
                  Perguntas Frequentes
                </h2>
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, idx) => (
                    <FaqItem key={idx} {...faq} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileQuestion size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma pergunta encontrada para "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {/* Support Channels */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <Headphones size={20} />
                  Canais de Atendimento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportChannels.map((channel, idx) => (
                    <a
                      key={idx}
                      href={channel.link}
                      className="flex items-center gap-4 bg-white p-4 rounded-xl border border-blue-100 hover:shadow-md transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-${channel.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <channel.icon size={20} className={`text-${channel.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{channel.title}</p>
                        <p className="text-xs text-gray-500">{channel.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">{channel.action}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- TICKETS SECTION --- */}
          {activeTab === 'TICKETS' && (
            <TicketsClient />
          )}
        </div>
      </main>
    </div>
  );
};

// Helper component for Mail icon
const Mail = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 7L2 7" />
  </svg>
);