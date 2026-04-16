import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Globe, 
  Plus,
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  User as UserIcon,
  Instagram,
  FileText,
  DollarSign,
  Package,
  Scissors,
  Video as VideoIcon,
  Save,
  ShieldCheck,
  Lock,
  Flag,
  Key,
  Link as LinkIcon,
  CheckSquare,
  Repeat,
  AlertCircle,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from './ui/Modal';
import { Client, ManagerTask } from '../types';
import { format, addDays, isSameDay, parseISO, startOfWeek, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Clients() {
  const { 
    clients, addClient, deleteClient, updateClient, 
    userRole, sellers, currentUserId,
    managerTasks, addManagerTask, toggleManagerTask, deleteManagerTask,
    showToast 
  } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'manager' | 'tasks'>('info');
  
  const [newTask, setNewTask] = useState<Omit<ManagerTask, 'id' | 'completed' | 'clientId'>>({
    title: '',
    frequency: 'weekly',
    daysOfWeek: [1], // Monday
    nextOccurrence: new Date().toISOString()
  });

  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    instagram: '',
    industry: 'Geral',
    status: 'Ativo',
    revenue: 'R$ 0',
    location: 'N/A',
    contact: '',
    since: new Date().getFullYear().toString(),
    createdAt: new Date().toISOString(),
    logo: 'https://picsum.photos/seed/company/200/200',
    contractLink: '',
    managerId: '',
    healthStatus: 'green',
    planDetails: {
      included: '',
      totalEdits: 0,
      totalCaptures: 0,
      workScope: ''
    }
  });

  const isCEO = userRole === 'CEO';
  const isRH = userRole === 'RH';
  const isManager = userRole === 'Vendedor'; // Assuming Vendedor acts as Manager for their clients
  const isPrivileged = isCEO || isRH;

  const parseRevenue = (revenueStr: string) => {
    const clean = revenueStr.replace(/[R$\.\/mês\s]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const totalRevenue = clients.reduce((acc, client) => acc + parseRevenue(client.revenue), 0);
  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (c.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (isPrivileged) return matchesSearch;
    if (isManager) return matchesSearch && c.managerId === currentUserId;
    return matchesSearch;
  });

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClient(newClient);
    setIsModalOpen(false);
    setNewClient({ 
      name: '', 
      company: '', 
      email: '', 
      phone: '', 
      instagram: '',
      industry: 'Geral',
      status: 'Ativo', 
      revenue: 'R$ 0', 
      location: 'N/A',
      contact: '',
      since: new Date().getFullYear().toString(),
      createdAt: new Date().toISOString(),
      logo: 'https://picsum.photos/seed/company/200/200',
      contractLink: '',
      managerId: '',
      planDetails: {
        included: '',
        totalEdits: 0,
        totalCaptures: 0,
        workScope: ''
      }
    });
  };

  const handleRenew = (clientId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    updateClient(clientId, { lastRenewalMonth: currentMonth });
  };

  const openDetails = (client: Client) => {
    setSelectedClient(client);
    setActiveTab('info');
    setIsDetailsModalOpen(true);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    addManagerTask({
      ...newTask,
      clientId: selectedClient.id
    });
    setNewTask({
      title: '',
      frequency: 'weekly',
      daysOfWeek: [1],
      nextOccurrence: new Date().toISOString()
    });
  };

  const getTodayTasks = () => {
    if (!selectedClient) return [];
    const today = new Date();
    return managerTasks.filter(t => {
      if (t.clientId !== selectedClient.id) return false;
      const nextDate = parseISO(t.nextOccurrence);
      
      // Basic check: is it today?
      if (isSameDay(nextDate, today)) return true;
      
      // Recurring logic for display
      if (t.frequency === 'daily') return true;
      if (t.frequency === 'weekly' && t.daysOfWeek?.includes(today.getDay())) return true;
      
      return false;
    });
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Portfolio Management</p>
          <h2 className="text-4xl font-headline font-bold text-white uppercase tracking-tight">Gestão de Clientes</h2>
          {isPrivileged && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
              <DollarSign size={14} className="text-emerald-400" />
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Faturamento Total: <span className="text-white ml-1">{formattedTotal}/mês</span>
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-white transition-colors" />
            <input 
              className="bg-surface-low border-b border-white/20 focus:border-white focus:ring-0 text-sm py-3 pl-12 pr-6 rounded-t-lg w-full md:w-64 transition-all outline-none" 
              placeholder="Buscar clientes..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 rounded-full bg-white text-on-primary font-label text-xs font-bold uppercase tracking-wider signature-glow hover:scale-95 transition-transform flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Cliente
          </button>
        </div>
      </section>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div 
            key={client.id} 
            onClick={() => openDetails(client)}
            className="glass-panel p-8 rounded-2xl ghost-border space-y-8 group hover:bg-white/5 transition-all relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-4 flex gap-2" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => deleteClient(client.id)}
                className="text-on-surface-variant hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded"
                title="Excluir Cliente"
              >
                <Trash2 size={18} />
              </button>
              <button className="text-on-surface-variant hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center ghost-border overflow-hidden p-4">
                <img src={client.logo} alt={client.company || client.name} className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-headline font-bold text-white group-hover:text-glow transition-all">{client.company || client.name}</h3>
                <div className="flex items-center gap-3">
                  {client.status === 'Ativo' && client.lastRenewalMonth !== new Date().toISOString().slice(0, 7) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenew(client.id);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                      title="Marcar como Renovado"
                    >
                      <Repeat size={14} />
                    </button>
                  )}
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                    client.healthStatus === 'green' ? 'bg-emerald-500 shadow-emerald-500/50' :
                    client.healthStatus === 'yellow' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-red-500 shadow-red-500/50'
                  }`} title={`Status de Saúde: ${client.healthStatus}`} />
                </div>
              </div>
                <p className="text-sm text-on-surface-variant font-body">{client.contact || client.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Status</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  client.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {client.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Investimento</p>
                {isPrivileged ? (
                  <p className="text-sm font-mono text-white font-bold">{client.revenue}</p>
                ) : (
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <Lock size={12} />
                    <span className="text-[10px] font-medium">Restrito</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-between items-center" onClick={e => e.stopPropagation()}>
              <div className="flex gap-3">
                <a 
                  href={`mailto:${client.email || 'contato@empresa.com'}`}
                  className="p-2 rounded-lg bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 transition-all"
                >
                  <Mail size={16} />
                </a>
                <a 
                  href={`tel:${client.phone || ''}`}
                  className="p-2 rounded-lg bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 transition-all"
                >
                  <Phone size={16} />
                </a>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (client.website) {
                      window.open(client.website, '_blank');
                    } else {
                      showToast('Site não cadastrado para este cliente.', 'info');
                    }
                  }}
                  className="p-2 rounded-lg bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 transition-all"
                >
                  <Globe size={16} />
                </button>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openDetails(client);
                }}
                className="flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors"
              >
                Ver Perfil
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}

        {/* Add New Client Card */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:border-white/30 transition-all hover:bg-white/2"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Plus size={32} className="text-white/40 group-hover:text-white" />
          </div>
          <h3 className="text-xl font-headline font-bold text-white/40 group-hover:text-white mb-2">Adicionar Novo Cliente</h3>
          <p className="text-sm text-on-surface-variant max-w-[200px]">Inicie um novo processo de onboarding e contrato.</p>
        </div>
      </div>

      {/* Client Health Section */}
      <section className="glass-panel p-8 rounded-2xl ghost-border">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h4 className="font-headline text-2xl font-bold text-white">Saúde da Carteira</h4>
            <p className="text-sm text-on-surface-variant font-body">Métricas de satisfação e retenção</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-headline font-bold text-white">94%</p>
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">NPS Médio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-headline font-bold text-white">2.4%</p>
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Churn Rate</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Projetos no Prazo', value: '98%', icon: Clock, color: 'text-emerald-400' },
            { label: 'Tickets Resolvidos', value: '142', icon: CheckCircle2, color: 'text-blue-400' },
            { label: 'Reuniões este Mês', value: '24', icon: Calendar, color: 'text-purple-400' },
            { label: 'Novos Contratos', value: '03', icon: Globe, color: 'text-orange-400' },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white/2 rounded-xl border border-white/5 space-y-4">
              <item.icon size={24} className={item.color} />
              <div>
                <p className="text-3xl font-headline font-bold text-white">{item.value}</p>
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Novo Cliente */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Cliente">
        <form onSubmit={handleAddClient} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nome da Empresa</label>
            <div className="relative">
              <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input 
                required
                type="text" 
                value={newClient.company || ''}
                onChange={e => setNewClient({...newClient, company: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Ex: Solaris Global"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Ponto de Contato</label>
            <input 
              required
              type="text" 
              value={newClient.name}
              onChange={e => setNewClient({...newClient, name: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Nome do responsável"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">E-mail</label>
              <input 
                required
                type="email" 
                value={newClient.email || ''}
                onChange={e => setNewClient({...newClient, email: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="email@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Telefone</label>
              <input 
                required
                type="text" 
                value={newClient.phone || ''}
                onChange={e => setNewClient({...newClient, phone: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Instagram</label>
              <input 
                type="text" 
                value={newClient.instagram || ''}
                onChange={e => setNewClient({...newClient, instagram: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="@perfil"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Site Institucional</label>
              <input 
                type="text" 
                value={newClient.website || ''}
                onChange={e => setNewClient({...newClient, website: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="https://empresa.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Investimento Mensal</label>
              <input 
                required
                type="text" 
                value={newClient.revenue}
                onChange={e => setNewClient({...newClient, revenue: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="R$ 0.000/mês"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status de Saúde</label>
              <select 
                value={newClient.healthStatus || 'green'}
                onChange={e => setNewClient({...newClient, healthStatus: e.target.value as any})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="green">Green (Saudável)</option>
                <option value="yellow">Yellow (Atenção)</option>
                <option value="red">Red (Crítico)</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Gestor Responsável</label>
            <select 
              value={newClient.managerId || ''}
              onChange={e => setNewClient({...newClient, managerId: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="">Nenhum Gestor Atribuído</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Detalhes do Plano</p>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">O que está incluso</label>
              <input 
                type="text" 
                value={newClient.planDetails?.included || ''}
                onChange={e => setNewClient({...newClient, planDetails: { ...newClient.planDetails!, included: e.target.value }})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Ex: Plano Premium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total Edições</label>
                <input 
                  type="number" 
                  value={newClient.planDetails?.totalEdits || 0}
                  onChange={e => setNewClient({...newClient, planDetails: { ...newClient.planDetails!, totalEdits: parseInt(e.target.value) }})}
                  className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total Captações</label>
                <input 
                  type="number" 
                  value={newClient.planDetails?.totalCaptures || 0}
                  onChange={e => setNewClient({...newClient, planDetails: { ...newClient.planDetails!, totalCaptures: parseInt(e.target.value) }})}
                  className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Escopo de Trabalho</label>
              <textarea 
                value={newClient.planDetails?.workScope || ''}
                onChange={e => setNewClient({...newClient, planDetails: { ...newClient.planDetails!, workScope: e.target.value }})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none h-20"
                placeholder="Descreva os trabalhos que serão feitos..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Link do Contrato</label>
              <input 
                type="text" 
                value={newClient.contractLink || ''}
                onChange={e => setNewClient({...newClient, contractLink: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Link do contrato assinado"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow hover:scale-[0.98] transition-transform mt-4">
            Cadastrar Cliente
          </button>
        </form>
      </Modal>

      {/* Modal Detalhes do Cliente */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        title={`Cliente: ${selectedClient?.company || selectedClient?.name}`}
      >
        {selectedClient && (
          <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
              <button 
                onClick={() => setActiveTab('info')}
                className={`text-xs font-label uppercase tracking-widest pb-2 transition-all ${activeTab === 'info' ? 'text-white border-b-2 border-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                Informações Gerais
              </button>
              {(isCEO || selectedClient.managerId === currentUserId) && (
                <button 
                  onClick={() => setActiveTab('manager')}
                  className={`text-xs font-label uppercase tracking-widest pb-2 transition-all ${activeTab === 'manager' ? 'text-white border-b-2 border-white' : 'text-on-surface-variant hover:text-white'}`}
                >
                  Espaço do Gestor
                </button>
              )}
              {(isCEO || selectedClient.managerId === currentUserId) && (
                <button 
                  onClick={() => setActiveTab('tasks')}
                  className={`text-xs font-label uppercase tracking-widest pb-2 transition-all ${activeTab === 'tasks' ? 'text-white border-b-2 border-white' : 'text-on-surface-variant hover:text-white'}`}
                >
                  Mural de Tasks
                </button>
              )}
            </div>

            {activeTab === 'info' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-20 h-20 rounded-xl bg-surface-high p-4 ghost-border">
                    <img src={selectedClient.logo} alt="Logo" className="w-full h-full object-contain grayscale" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-headline font-bold text-white">{selectedClient.company || selectedClient.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-label uppercase text-on-surface-variant">Saúde:</span>
                        <div className={`w-4 h-4 rounded-full ${
                          selectedClient.healthStatus === 'green' ? 'bg-emerald-500' :
                          selectedClient.healthStatus === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <MapPin size={14} />
                        <span className="text-xs">{selectedClient.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <Building2 size={14} />
                        <span className="text-xs">{selectedClient.industry}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Informações de Contato</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <UserIcon size={16} className="text-on-surface-variant" />
                            <span className="text-sm text-white">{selectedClient.contact}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <Mail size={16} className="text-on-surface-variant" />
                            <span className="text-sm text-white">{selectedClient.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <Phone size={16} className="text-on-surface-variant" />
                            <span className="text-sm text-white">{selectedClient.phone}</span>
                          </div>
                        </div>
                        {selectedClient.instagram && (
                          <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <Instagram size={16} className="text-on-surface-variant" />
                              <span className="text-sm text-white">{selectedClient.instagram}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Financeiro & Contrato</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center gap-3">
                            <DollarSign size={18} className="text-emerald-400" />
                            <div>
                              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Investimento Mensal</p>
                              {isPrivileged ? (
                                <p className="text-lg font-mono font-bold text-white">{selectedClient.revenue}</p>
                              ) : (
                                <div className="flex items-center gap-2 text-on-surface-variant">
                                  <Lock size={14} />
                                  <span className="text-xs">Acesso Restrito</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {isPrivileged && selectedClient.contractLink && (
                          <a 
                            href={selectedClient.contractLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <FileText size={18} className="text-blue-400" />
                              <div>
                                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Contrato Assinado</p>
                                <p className="text-xs text-white">Visualizar Documento</p>
                              </div>
                            </div>
                            <ExternalLink size={16} className="text-on-surface-variant group-hover:text-white" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Plano & Escopo</h4>
                      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
                        <div className="flex items-center gap-3">
                          <Package size={20} className="text-purple-400" />
                          <span className="text-lg font-bold text-white">{selectedClient.planDetails?.included || 'Plano Personalizado'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/2 rounded-xl border border-white/5 text-center">
                            <Scissors size={20} className="mx-auto mb-2 text-amber-400" />
                            <p className="text-2xl font-headline font-bold text-white">{selectedClient.planDetails?.totalEdits || 0}</p>
                            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Edições</p>
                          </div>
                          <div className="p-4 bg-white/2 rounded-xl border border-white/5 text-center">
                            <VideoIcon size={20} className="mx-auto mb-2 text-blue-400" />
                            <p className="text-2xl font-headline font-bold text-white">{selectedClient.planDetails?.totalCaptures || 0}</p>
                            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Captações</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">Escopo de Trabalho</p>
                          <p className="text-sm text-white leading-relaxed bg-white/2 p-4 rounded-xl border border-white/5">
                            {selectedClient.planDetails?.workScope || 'Sem escopo definido.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'manager' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Manager Assignment & Health Status */}
                <div className="glass-panel p-6 rounded-2xl ghost-border space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-amber-400" />
                    <h4 className="text-sm font-label uppercase tracking-widest text-white font-bold">Gestão do Cliente</h4>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    {isCEO && (
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Atribuir Gestor</label>
                        <select 
                          value={selectedClient.managerId || ''}
                          onChange={(e) => {
                            updateClient(selectedClient.id, { managerId: e.target.value });
                            setSelectedClient({ ...selectedClient, managerId: e.target.value });
                          }}
                          className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
                        >
                          <option value="">Nenhum Gestor Atribuído</option>
                          {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status de Saúde (Flag)</label>
                      <div className="flex items-center gap-2 bg-surface-highest ghost-border rounded-xl px-4 h-[46px]">
                        <Flag size={16} className="text-on-surface-variant" />
                        <select 
                          value={selectedClient.healthStatus || 'green'}
                          onChange={(e) => {
                            updateClient(selectedClient.id, { healthStatus: e.target.value as any });
                            setSelectedClient({ ...selectedClient, healthStatus: e.target.value as any });
                          }}
                          className="bg-transparent text-white focus:outline-none text-sm w-full"
                        >
                          <option value="green">Green (Saudável)</option>
                          <option value="yellow">Yellow (Atenção)</option>
                          <option value="red">Red (Crítico)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidential Data */}
                <div className="glass-panel p-6 rounded-2xl ghost-border space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock size={20} className="text-red-400" />
                      <h4 className="text-sm font-label uppercase tracking-widest text-white font-bold">Dados Sigilosos</h4>
                    </div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest bg-white/5 px-2 py-1 rounded">Visível apenas para CEO e Gestor</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">E-mails / Contas</label>
                      <textarea 
                        value={selectedClient.confidentialData?.emails || ''}
                        onChange={(e) => {
                          const updated = { ...selectedClient.confidentialData, emails: e.target.value };
                          updateClient(selectedClient.id, { confidentialData: updated });
                          setSelectedClient({ ...selectedClient, confidentialData: updated });
                        }}
                        className="w-full h-24 bg-surface-highest ghost-border rounded-xl p-4 text-sm text-white focus:outline-none resize-none"
                        placeholder="Ex: login@cliente.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Senhas / Acessos</label>
                      <textarea 
                        value={selectedClient.confidentialData?.passwords || ''}
                        onChange={(e) => {
                          const updated = { ...selectedClient.confidentialData, passwords: e.target.value };
                          updateClient(selectedClient.id, { confidentialData: updated });
                          setSelectedClient({ ...selectedClient, confidentialData: updated });
                        }}
                        className="w-full h-24 bg-surface-highest ghost-border rounded-xl p-4 text-sm text-white focus:outline-none resize-none"
                        placeholder="Ex: Senha123!"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Observações Estratégicas</label>
                    <textarea 
                      value={selectedClient.confidentialData?.other || ''}
                      onChange={(e) => {
                        const updated = { ...selectedClient.confidentialData, other: e.target.value };
                        updateClient(selectedClient.id, { confidentialData: updated });
                        setSelectedClient({ ...selectedClient, confidentialData: updated });
                      }}
                      className="w-full h-24 bg-surface-highest ghost-border rounded-xl p-4 text-sm text-white focus:outline-none resize-none"
                      placeholder="Informações sensíveis adicionais..."
                    />
                  </div>
                </div>

                {/* Strategy Link */}
                <div className="glass-panel p-6 rounded-2xl ghost-border space-y-4">
                  <div className="flex items-center gap-3">
                    <LinkIcon size={20} className="text-blue-400" />
                    <h4 className="text-sm font-label uppercase tracking-widest text-white font-bold">Link da Estratégia</h4>
                  </div>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={selectedClient.strategyLink || ''}
                      onChange={(e) => {
                        updateClient(selectedClient.id, { strategyLink: e.target.value });
                        setSelectedClient({ ...selectedClient, strategyLink: e.target.value });
                      }}
                      className="flex-1 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
                      placeholder="https://link-da-estrategia.com"
                    />
                    {selectedClient.strategyLink && (
                      <a 
                        href={selectedClient.strategyLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 bg-white text-on-primary rounded-xl hover:scale-95 transition-transform"
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Task Mural */}
                <div className="glass-panel p-6 rounded-2xl ghost-border space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckSquare size={20} className="text-emerald-400" />
                      <h4 className="text-sm font-label uppercase tracking-widest text-white font-bold">Mural de Tasks do Gestor</h4>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                      <Clock size={14} className="text-on-surface-variant" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Hoje: {format(new Date(), 'dd MMM', { locale: ptBR })}</span>
                    </div>
                  </div>

                  {/* Add Task Form */}
                  <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4 p-4 bg-white/2 rounded-xl border border-white/5">
                    <input 
                      required
                      type="text" 
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Nova tarefa recorrente..."
                      className="flex-1 bg-surface-highest ghost-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <select 
                        value={newTask.frequency}
                        onChange={e => setNewTask({...newTask, frequency: e.target.value as any})}
                        className="bg-surface-highest ghost-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="daily">Diária</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                      </select>
                      <button type="submit" className="p-2 bg-white text-on-primary rounded-lg hover:scale-95 transition-transform">
                        <Plus size={20} />
                      </button>
                    </div>
                  </form>

                  {/* Task List */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tarefas para Hoje</h5>
                    {getTodayTasks().length === 0 ? (
                      <div className="p-8 text-center bg-white/2 rounded-xl border border-dashed border-white/10 text-on-surface-variant text-sm italic">
                        Nenhuma tarefa pendente para hoje.
                      </div>
                    ) : (
                      getTodayTasks().map(task => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleManagerTask(task.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              {task.completed && <CheckCircle2 size={14} />}
                            </button>
                            <div>
                              <p className={`text-sm font-medium ${task.completed ? 'text-on-surface-variant line-through' : 'text-white'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Repeat size={10} className="text-on-surface-variant" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">
                                  {task.frequency === 'daily' ? 'Todo dia' : 
                                   task.frequency === 'weekly' ? 'Toda semana' : 'Todo mês'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteManagerTask(task.id)}
                            className="text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* All Tasks Summary */}
                  <div className="pt-6 border-t border-white/5">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">Todas as Tarefas Configuradas</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {managerTasks.filter(t => t.clientId === selectedClient.id).map(task => (
                        <div key={task.id} className="p-3 bg-white/2 rounded-lg border border-white/5 flex items-center justify-between">
                          <span className="text-xs text-white">{task.title}</span>
                          <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded-full text-on-surface-variant uppercase font-bold">{task.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
