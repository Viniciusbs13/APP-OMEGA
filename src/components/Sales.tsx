import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar, 
  Plus, 
  Search, 
  DollarSign, 
  Trophy, 
  Star, 
  Clock, 
  StickyNote, 
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  UserPlus,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import Modal from './ui/Modal';
import { Sale, Seller, Goal, Client } from '../types';

export default function Sales() {
  const { 
    userRole, 
    sales, addSale, 
    sellers, addSeller, deleteSeller,
    goals, addGoal, updateGoal, getCurrentMonthGoal,
    notes, updateNote,
    clients, addClient, updateClient,
    showToast
  } = useData();

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ranking' | 'history' | 'team'>('ranking');
  const [notification, setNotification] = useState<{ seller: string; value: number } | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  
  const [newClient, setNewClient] = useState<Omit<Client, 'id' | 'createdAt'>>({
    name: '',
    phone: '',
    company: '',
    industry: '',
    status: 'Onboarding',
    revenue: 'R$ 0/mês',
    location: 'Brasil',
    contact: '',
    logo: 'https://picsum.photos/seed/company/200/200',
    since: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
    planDetails: {
      included: '',
      totalEdits: 0,
      totalCaptures: 0,
      workScope: ''
    }
  });

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClient({
      ...newClient,
      createdAt: new Date().toISOString()
    });
    setIsClientModalOpen(false);
    setNewClient({
      name: '',
      phone: '',
      company: '',
      industry: '',
      status: 'Onboarding',
      revenue: 'R$ 0/mês',
      location: 'Brasil',
      contact: '',
      logo: 'https://picsum.photos/seed/company/200/200',
      since: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      planDetails: {
        included: '',
        totalEdits: 0,
        totalCaptures: 0,
        workScope: ''
      }
    });
  };
  
  const [newSale, setNewSale] = useState<Omit<Sale, 'id'>>({
    clientId: '',
    clientName: '',
    product: '',
    value: 0,
    discount: false,
    discountValue: 0,
    sellerId: '',
    sellerName: '',
    date: new Date().toISOString()
  });

  const [newSeller, setNewSeller] = useState<Omit<Seller, 'id'>>({
    name: '',
    role: 'Vendedor',
    avatar: `https://picsum.photos/seed/${Math.random()}/200/200`
  });

  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id'>>({
    month: new Date().toISOString().slice(0, 7),
    targetValue: 0,
    renewalTarget: 0
  });

  const [userNote, setUserNote] = useState('');

  useEffect(() => {
    const currentNote = notes.find(n => n.userId === 'current-user')?.content || '';
    setUserNote(currentNote);
  }, [notes]);

  const handleSaveNote = () => {
    updateNote('current-user', userNote);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const goalData = getCurrentMonthGoal();
  const currentGoal = goalData.targetValue;
  const renewalTarget = goalData.renewalTarget;

  const monthlySales = sales.filter(s => s.date.startsWith(currentMonth));
  const totalMonthlyRevenue = monthlySales.reduce((acc, s) => acc + s.value, 0);

  const renewedClients = clients.filter(c => c.status === 'Ativo' && c.lastRenewalMonth === currentMonth);
  const totalRenewalRevenue = renewedClients.reduce((acc, c) => {
    const clean = c.revenue.replace(/[R$\.\/mês\s]/g, '').replace(',', '.');
    return acc + (parseFloat(clean) || 0);
  }, 0);

  const ranking = sellers.map(seller => {
    const sellerSales = monthlySales.filter(s => s.sellerId === seller.id);
    const totalValue = sellerSales.reduce((acc, s) => acc + s.value, 0);
    return { ...seller, totalValue, salesCount: sellerSales.length };
  }).sort((a, b) => b.totalValue - a.totalValue);

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalClientId = newSale.clientId;
    let finalClientName = '';

    // If new client form was used
    if (showNewClientForm) {
      const clientData = {
        ...newClient,
        revenue: `R$ ${newSale.value}/mês`,
        createdAt: new Date().toISOString()
      };
      const createdClient = addClient(clientData);
      finalClientId = createdClient.id;
      finalClientName = createdClient.name;
    } else {
      const client = clients.find(c => c.id === newSale.clientId);
      finalClientName = client?.name || 'Cliente Avulso';
    }

    // Auto-detect seller based on email or role
    const seller = sellers.find(s => s.id === 'current-user') || sellers[0];
    
    addSale({
      ...newSale,
      clientId: finalClientId,
      clientName: finalClientName,
      sellerId: seller?.id || 'unknown',
      sellerName: seller?.name || 'Vendedor',
      date: new Date().toISOString()
    });
    
    // Trigger notification
    setNotification({ 
      seller: seller?.name || 'Vendedor', 
      value: newSale.value 
    });
    setTimeout(() => setNotification(null), 5000);

    setIsSaleModalOpen(false);
    setShowNewClientForm(false);
    setNewSale({
      clientId: '',
      clientName: '',
      product: '',
      value: 0,
      discount: false,
      discountValue: 0,
      sellerId: '',
      sellerName: '',
      date: new Date().toISOString()
    });
  };

  const handleAddSeller = (e: React.FormEvent) => {
    e.preventDefault();
    addSeller(newSeller);
    setIsSellerModalOpen(false);
    setNewSeller({ name: '', role: 'Vendedor', avatar: `https://picsum.photos/seed/${Math.random()}/200/200` });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    addGoal(newGoal);
    setIsGoalModalOpen(false);
  };

  return (
    <div className="space-y-12 relative">
      {/* Sale Notification Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-amber-400 text-black p-6 rounded-2xl shadow-[0_0_50px_rgba(251,191,36,0.5)] flex items-center gap-6 border-4 border-white/20">
              <div className="bg-black/10 p-3 rounded-full animate-bounce">
                <BellRing size={32} />
              </div>
              <div className="flex-1">
                <p className="font-label text-[10px] uppercase tracking-widest font-bold opacity-60">Venda Realizada!</p>
                <h4 className="text-xl font-headline font-black uppercase leading-tight">
                  {notification.seller}
                </h4>
                <p className="text-2xl font-headline font-black">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(notification.value)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Quick Stats */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Performance Comercial</p>
          <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-white">Vendas Omega</h2>
        </div>
        
        <div className="flex gap-3">
          {(userRole === 'CEO' || userRole === 'Vendedor') && (
            <button 
              onClick={() => setIsClientModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-surface-highest ghost-border text-white font-label text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <UserPlus size={16} />
              Novo Cliente
            </button>
          )}
          {userRole === 'CEO' && (
            <button 
              onClick={() => setIsGoalModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-surface-highest ghost-border text-white font-label text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Target size={16} />
              Definir Meta
            </button>
          )}
          <button 
            onClick={() => setIsSaleModalOpen(true)}
            className="px-6 py-2.5 rounded-full bg-white text-on-primary font-label text-xs font-bold uppercase tracking-wider signature-glow hover:scale-95 transition-transform flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Venda
          </button>
        </div>
      </section>

      {/* Monthly Goal Progress */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta de Novos Negócios */}
        <div className="glass-panel p-8 rounded-2xl ghost-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-xl font-headline font-bold text-white">Meta de Novos Negócios</h3>
              <p className="text-sm text-on-surface-variant">Vendas de novos planos e projetos únicos</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-headline font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthlyRevenue)}
              </span>
              <span className="text-sm text-on-surface-variant ml-2">
                / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentGoal)}
              </span>
            </div>
          </div>
          
          <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full transition-all duration-1000 ${totalMonthlyRevenue >= currentGoal ? 'bg-gradient-to-r from-amber-400 to-yellow-600 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'bg-white'}`}
              style={{ width: `${Math.min((totalMonthlyRevenue / (currentGoal || 1)) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            <span>Progresso: {((totalMonthlyRevenue / (currentGoal || 1)) * 100).toFixed(1)}%</span>
            {totalMonthlyRevenue >= currentGoal ? (
              <span className="text-amber-400 flex items-center gap-1"><Trophy size={12} /> Meta Atingida!</span>
            ) : (
              <span>Faltam {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(currentGoal - totalMonthlyRevenue, 0))}</span>
            )}
          </div>
        </div>

        {/* Meta de Renovação */}
        <div className="glass-panel p-8 rounded-2xl ghost-border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-xl font-headline font-bold text-white">Meta de Renovação</h3>
              <p className="text-sm text-on-surface-variant">Manutenção da carteira de clientes ativos</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-headline font-bold text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRenewalRevenue)}
              </span>
              <span className="text-sm text-on-surface-variant ml-2">
                / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(renewalTarget)}
              </span>
            </div>
          </div>
          
          <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full transition-all duration-1000 ${totalRenewalRevenue >= renewalTarget ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-emerald-500/40'}`}
              style={{ width: `${Math.min((totalRenewalRevenue / (renewalTarget || 1)) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            <span>Retenção: {((totalRenewalRevenue / (renewalTarget || 1)) * 100).toFixed(1)}%</span>
            {totalRenewalRevenue >= renewalTarget ? (
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Carteira 100% Renovada!</span>
            ) : (
              <span>Pendente: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(renewalTarget - totalRenewalRevenue, 0))}</span>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 border-b border-white/10 pb-4">
            <button 
              onClick={() => setActiveTab('ranking')}
              className={`text-xs font-label uppercase tracking-widest pb-2 transition-all ${activeTab === 'ranking' ? 'text-white border-b-2 border-white' : 'text-on-surface-variant hover:text-white'}`}
            >
              Ranking de Vendedores
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`text-xs font-label uppercase tracking-widest pb-2 transition-all ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-on-surface-variant hover:text-white'}`}
            >
              Histórico de Vendas
            </button>
            {userRole === 'CEO' && (
              <button 
                onClick={() => setActiveTab('team')}
                className={`text-xs font-label uppercase tracking-widest pb-2 transition-all ${activeTab === 'team' ? 'text-white border-b-2 border-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                Gerenciar Equipe
              </button>
            )}
          </div>

          {activeTab === 'ranking' && (
            <div className="space-y-4">
              {ranking.length === 0 ? (
                <div className="glass-panel p-12 rounded-xl ghost-border text-center text-on-surface-variant">
                  Nenhum vendedor cadastrado ou vendas realizadas este mês.
                </div>
              ) : (
                ranking.map((seller, index) => {
                  const isAtingiuMeta = currentGoal > 0 && seller.totalValue >= (currentGoal / sellers.length);
                  const isLongeMeta = currentGoal > 0 && seller.totalValue < (currentGoal / sellers.length) * 0.3;
                  
                  return (
                    <div 
                      key={seller.id} 
                      className={`glass-panel p-6 rounded-xl ghost-border flex items-center justify-between transition-all hover:bg-white/5 ${
                        isAtingiuMeta ? 'border-amber-400/30 bg-amber-400/5' : 
                        isLongeMeta ? 'border-red-500/30 bg-red-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <span className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            index === 0 ? 'bg-amber-400 text-black' : 
                            index === 1 ? 'bg-slate-300 text-black' : 
                            index === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <img src={seller.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white/10" alt={seller.name} />
                        </div>
                        <div>
                          <h4 className={`text-lg font-headline font-bold ${isAtingiuMeta ? 'text-amber-400' : 'text-white'}`}>
                            {seller.name}
                          </h4>
                          <p className="text-xs text-on-surface-variant uppercase tracking-widest">{seller.role}</p>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <p className={`text-xl font-headline font-bold ${isAtingiuMeta ? 'text-amber-400' : isLongeMeta ? 'text-red-400' : 'text-white'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seller.totalValue)}
                        </p>
                        <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                          {seller.salesCount} vendas realizadas
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="glass-panel rounded-xl ghost-border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Vendedor</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">Nenhuma venda registrada.</td>
                    </tr>
                  ) : (
                    [...sales].reverse().map((sale) => (
                      <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          {new Date(sale.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-white">{sale.clientName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-on-surface-variant">{sale.product}</span>
                          {sale.discount && (
                            <span className="ml-2 text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full uppercase">Desc</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          {sale.sellerName}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sellers.map(seller => (
                <div key={seller.id} className="glass-panel p-6 rounded-xl ghost-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={seller.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <div>
                      <h5 className="text-white font-bold">{seller.name}</h5>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{seller.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteSeller(seller.id)}
                    className="text-on-surface-variant hover:text-red-400 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setIsSellerModalOpen(true)}
                className="glass-panel p-6 rounded-xl ghost-border border-dashed flex items-center justify-center gap-3 text-on-surface-variant hover:text-white hover:bg-white/5 transition-all"
              >
                <UserPlus size={20} />
                <span className="font-label text-xs uppercase tracking-widest">Contratar Vendedor</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Calendar & Notes */}
        <div className="space-y-8">
          {/* Calendar Integration Placeholder */}
          <div className="glass-panel p-6 rounded-2xl ghost-border space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-label uppercase tracking-widest text-white">Reuniões do Dia</h4>
              <Calendar size={16} className="text-on-surface-variant" />
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-center min-w-[40px]">
                  <p className="text-xs font-bold text-white">14:00</p>
                  <p className="text-[8px] text-on-surface-variant uppercase">Hoje</p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <p className="text-xs font-bold text-white">Apresentação Nexus</p>
                  <p className="text-[10px] text-on-surface-variant">Google Meet</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 opacity-50">
                <div className="text-center min-w-[40px]">
                  <p className="text-xs font-bold text-white">16:30</p>
                  <p className="text-[8px] text-on-surface-variant uppercase">Hoje</p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <p className="text-xs font-bold text-white">Follow-up Solaris</p>
                  <p className="text-[10px] text-on-surface-variant">Presencial</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => showToast('Conectando ao Google Agenda...', 'info')}
              className="w-full py-2.5 rounded-xl bg-white/5 text-white text-[10px] font-label uppercase tracking-widest hover:bg-white/10 transition-colors"
            >
              Sincronizar Agenda
            </button>
          </div>

          {/* Quick Notes */}
          <div className="glass-panel p-6 rounded-2xl ghost-border space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-label uppercase tracking-widest text-white">Bloco de Notas</h4>
              <StickyNote size={16} className="text-on-surface-variant" />
            </div>
            <textarea 
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Rascunhe suas ideias aqui..."
              className="w-full h-48 bg-white/5 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
            />
            <button 
              onClick={handleSaveNote}
              className="w-full py-3 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform"
            >
              <Save size={14} />
              Salvar Notas
            </button>
          </div>
        </div>
      </section>

      {/* Modal: Nova Venda */}
      <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Registrar Nova Venda">
        <form onSubmit={handleAddSale} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cliente</label>
              <button 
                type="button"
                onClick={() => setShowNewClientForm(!showNewClientForm)}
                className="text-[10px] font-bold text-white bg-white/5 px-3 py-1 rounded-full hover:bg-white/10 transition-all"
              >
                {showNewClientForm ? 'Selecionar Existente' : '+ Novo Cliente'}
              </button>
            </div>

            {!showNewClientForm ? (
              <select 
                required
                value={newSale.clientId}
                onChange={e => setNewSale({...newSale, clientId: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="">Selecionar Cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div className="space-y-4 p-4 bg-white/2 rounded-xl border border-white/5">
                <input 
                  required
                  type="text" 
                  placeholder="Nome do Cliente"
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  className="w-full bg-surface-highest ghost-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    required
                    type="text" 
                    placeholder="WhatsApp"
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full bg-surface-highest ghost-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="Empresa"
                    value={newClient.company}
                    onChange={e => setNewClient({...newClient, company: e.target.value})}
                    className="w-full bg-surface-highest ghost-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <input 
                  required
                  type="text" 
                  placeholder="Setor (Ex: Tecnologia)"
                  value={newClient.industry}
                  onChange={e => setNewClient({...newClient, industry: e.target.value})}
                  className="w-full bg-surface-highest ghost-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-white/5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Detalhes do Plano</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-on-surface-variant">Qtd. Vídeos</span>
                  <input 
                    type="number"
                    value={newClient.planDetails?.totalEdits || 0}
                    onChange={e => setNewClient({
                      ...newClient, 
                      planDetails: { ...newClient.planDetails!, totalEdits: parseInt(e.target.value) }
                    })}
                    className="w-full bg-surface-highest ghost-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-on-surface-variant">Qtd. Captações</span>
                  <input 
                    type="number"
                    value={newClient.planDetails?.totalCaptures || 0}
                    onChange={e => setNewClient({
                      ...newClient, 
                      planDetails: { ...newClient.planDetails!, totalCaptures: parseInt(e.target.value) }
                    })}
                    className="w-full bg-surface-highest ghost-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              <textarea 
                placeholder="Serviços Oferecidos (Ex: Gestão de Tráfego, Edição de Reels...)"
                value={newClient.planDetails?.included || ''}
                onChange={e => setNewClient({
                  ...newClient, 
                  planDetails: { ...newClient.planDetails!, included: e.target.value }
                })}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none h-20 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Valor do Plano (Mensal)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  required
                  type="number" 
                  value={newSale.value || ''}
                  onChange={e => setNewSale({...newSale, value: Number(e.target.value)})}
                  className="w-full bg-surface-highest ghost-border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Desconto (%)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="0" 
                  max="80" 
                  step="1"
                  value={newSale.discountValue || 0}
                  onChange={e => setNewSale({...newSale, discountValue: Number(e.target.value), discount: Number(e.target.value) > 0})}
                  className="flex-1 accent-white"
                />
                <span className="text-sm font-bold text-white min-w-[3rem]">{newSale.discountValue || 0}%</span>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow hover:scale-[0.98] transition-transform mt-4">
            Confirmar Venda
          </button>
        </form>
      </Modal>

      {/* Modal: Novo Vendedor */}
      <Modal isOpen={isSellerModalOpen} onClose={() => setIsSellerModalOpen(false)} title="Contratar Novo Vendedor">
        <form onSubmit={handleAddSeller} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nome Completo</label>
            <input 
              required
              type="text" 
              value={newSeller.name}
              onChange={e => setNewSeller({...newSeller, name: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cargo / Setor</label>
            <input 
              required
              type="text" 
              value={newSeller.role}
              onChange={e => setNewSeller({...newSeller, role: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="Ex: SDR, Closer, Account Executive"
            />
          </div>
          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow mt-4">
            Adicionar à Equipe
          </button>
        </form>
      </Modal>

      {/* Modal: Definir Meta */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Definir Meta Mensal">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Mês de Referência</label>
            <input 
              required
              type="month" 
              value={newGoal.month}
              onChange={e => setNewGoal({...newGoal, month: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Valor Alvo (Global)</label>
            <input 
              required
              type="number" 
              value={newGoal.targetValue || ''}
              onChange={e => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="Ex: 50000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Alvo de Renovação (Opcional)</label>
            <input 
              type="number" 
              value={newGoal.renewalTarget || ''}
              onChange={e => setNewGoal({...newGoal, renewalTarget: Number(e.target.value)})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="Deixe 0 para calcular automático"
            />
          </div>
          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow mt-4">
            Salvar Meta
          </button>
        </form>
      </Modal>

      {/* Modal: Novo Cliente (Vendedor) */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title="Cadastrar Novo Cliente">
        <form onSubmit={handleAddClient} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nome do Contato</label>
            <input 
              required
              type="text" 
              value={newClient.name}
              onChange={e => setNewClient({...newClient, name: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="Ex: Roberto Carlos"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Telefone / WhatsApp</label>
              <input 
                required
                type="text" 
                value={newClient.phone}
                onChange={e => setNewClient({...newClient, phone: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nome da Empresa</label>
              <input 
                type="text" 
                value={newClient.company}
                onChange={e => setNewClient({...newClient, company: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
                placeholder="Ex: Nexus LTDA"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Área / Setor do Cliente</label>
            <input 
              required
              type="text" 
              value={newClient.industry}
              onChange={e => setNewClient({...newClient, industry: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="Ex: Tecnologia, Varejo, Saúde"
            />
          </div>
          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow mt-4">
            Cadastrar Cliente
          </button>
        </form>
      </Modal>
    </div>
  );
}
