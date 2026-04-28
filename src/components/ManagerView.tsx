import React, { useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Flag,
  Calendar,
  Repeat,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Star,
  Target,
  Trophy,
  Plus,
  Trash2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client, ManagerTask } from '../types';
import Modal from './ui/Modal';

export default function ManagerView() {
  const { 
    clients, 
    managerTasks, 
    toggleManagerTask, 
    addManagerTask,
    deleteManagerTask,
    currentUserId, 
    userRole,
    sales,
    getCurrentMonthGoal,
    sellers,
    updateClient,
    showToast,
    allUsers,
    addSystemUser,
    updateUserRoleAndStatus,
    deleteSystemUser
  } = useData();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'collaborators'>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Omit<ManagerTask, 'id' | 'completed'>>({
    title: '',
    clientId: '',
    frequency: 'weekly',
    daysOfWeek: [1],
    nextOccurrence: new Date().toISOString()
  });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'Colaborador' as any
  });
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emailExists = allUsers.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
      if (emailExists) {
        showToast('Este e-mail já está cadastrado!', 'error');
        return;
      }

      await addSystemUser(newUser.email, newUser.name, newUser.role);
      setIsUserModalOpen(false);
      setNewUser({ email: '', name: '', role: 'Colaborador' });
    } catch (err) {
      console.error(err);
    }
  };

  const myClients = clients.filter(c => c.managerId === currentUserId);
  const myTasks = managerTasks.filter(t => {
    const isMyClient = myClients.some(c => c.id === t.clientId);
    if (!isMyClient) return false;
    
    const today = new Date();
    const nextDate = parseISO(t.nextOccurrence);
    
    if (isSameDay(nextDate, today)) return true;
    if (t.frequency === 'daily') return true;
    if (t.frequency === 'weekly' && t.daysOfWeek?.includes(today.getDay())) return true;
    
    return false;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.clientId) return;
    addManagerTask(newTask);
    setIsTaskModalOpen(false);
    setNewTask({
      title: '',
      clientId: '',
      frequency: 'weekly',
      daysOfWeek: [1],
      nextOccurrence: new Date().toISOString()
    });
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const mySales = sales.filter(s => s.sellerId === currentUserId && s.date.startsWith(currentMonth));
  const myRevenue = mySales.reduce((acc, s) => acc + s.value, 0);
  
  const goalData = getCurrentMonthGoal();
  const myGoal = sellers.length > 0 ? goalData.targetValue / sellers.length : 0;
  const progress = myGoal > 0 ? (myRevenue / myGoal) * 100 : 0;

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 font-headline">
        <div className="space-y-2">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Gestão Corporativa</p>
          <div className="flex items-center gap-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">Dashboard do Gestor</h2>
            {userRole === 'CEO' && (
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'dashboard' ? 'bg-white text-on-primary' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Geral
                </button>
                <button 
                  onClick={() => setActiveTab('collaborators')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all gap-2 flex items-center ${
                    activeTab === 'collaborators' ? 'bg-white text-on-primary' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Colaboradores
                  {allUsers.filter(u => u.status === 'pending').length > 0 && (
                    <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]">
                      {allUsers.filter(u => u.status === 'pending').length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          <Calendar size={16} className="text-on-surface-variant" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
        </div>
      </section>

      {activeTab === 'dashboard' ? (
        <>
          {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl ghost-border space-y-4">
          <div className="flex justify-between items-start">
            <Users size={20} className="text-blue-400" />
            <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full text-blue-400 bg-blue-400/10">Ativos</span>
          </div>
          <div>
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Meus Clientes</p>
            <h3 className="text-3xl font-headline font-bold text-white mt-1">{myClients.length}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl ghost-border space-y-4">
          <div className="flex justify-between items-start">
            <CheckSquare size={20} className="text-emerald-400" />
            <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-400/10">Pendentes</span>
          </div>
          <div>
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Tasks de Hoje</p>
            <h3 className="text-3xl font-headline font-bold text-white mt-1">{myTasks.filter(t => !t.completed).length}</h3>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-label uppercase tracking-widest text-white font-bold">Mural de Tasks</h4>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="p-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="p-8 text-center bg-white/2 rounded-2xl border border-dashed border-white/10 text-on-surface-variant text-sm italic">
                Nenhuma tarefa para hoje.
              </div>
            ) : (
              myTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-all">
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
                      <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">
                        {clients.find(c => c.id === task.clientId)?.company || 'Cliente'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteManagerTask(task.id)}
                    className="p-2 text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clients Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-label uppercase tracking-widest text-white font-bold">Meus Clientes Atribuídos</h4>
            <Users size={16} className="text-on-surface-variant" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClients.length === 0 ? (
              <div className="col-span-2 p-12 text-center bg-white/2 rounded-2xl border border-dashed border-white/10 text-on-surface-variant">
                Você ainda não possui clientes atribuídos.
              </div>
            ) : (
              myClients.map(client => (
                <div key={client.id} className="glass-panel p-6 rounded-2xl ghost-border group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 p-2 ghost-border">
                      <img src={client.logo} alt="" className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-white font-bold">{client.company || client.name}</h5>
                        <div className={`w-2 h-2 rounded-full ${
                          client.healthStatus === 'green' ? 'bg-emerald-500' :
                          client.healthStatus === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{client.industry}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Faturamento</p>
                      <p className="text-xs font-mono text-white">{client.revenue}</p>
                    </div>
                    <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Status</p>
                      <p className="text-xs text-white">{client.status}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {client.status === 'Ativo' && client.lastRenewalMonth !== new Date().toISOString().slice(0, 7) && (
                      <button 
                        onClick={() => {
                          const currentMonth = new Date().toISOString().slice(0, 7);
                          updateClient(client.id, { lastRenewalMonth: currentMonth });
                        }}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                        title="Marcar como Renovado"
                      >
                        <Repeat size={16} />
                      </button>
                    )}
                    {client.strategyLink && (
                      <a 
                        href={client.strategyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-lg bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={12} /> Estratégia
                      </a>
                    )}
                    <button 
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 py-2 rounded-lg bg-white text-on-primary text-[10px] font-bold uppercase tracking-widest hover:scale-95 transition-transform"
                    >
                      Ver Perfil
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      </>
      ) : (
        <section className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl ghost-border col-span-1 md:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="text-white" />
                  <h3 className="text-lg font-headline font-bold text-white">Gestão de Colaboradores</h3>
                </div>
                <button 
                  onClick={() => setIsUserModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white text-on-primary text-[10px] font-bold uppercase tracking-widest signature-glow flex items-center gap-2 hover:scale-95 transition-transform"
                >
                  <Plus size={16} /> Adicionar Membro
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2">Colaborador</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2">E-mail</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center px-2">Status</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2">Cargo</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right px-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-on-surface-variant italic">Nenhum usuário encontrado.</td>
                      </tr>
                    ) : (
                      allUsers.map(user => (
                        <tr key={user.id} className="group hover:bg-white/2 transition-all">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden shrink-0">
                                <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <span className="text-sm font-bold text-white whitespace-nowrap">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-xs font-mono text-on-surface-variant">{user.email}</td>
                          <td className="py-4 px-2">
                            <div className="flex justify-center">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                user.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                user.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {user.status === 'approved' ? 'Aprovado' : user.status === 'pending' ? 'Pendente' : 'Recusado'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <select 
                              value={user.role}
                              onChange={(e) => updateUserRoleAndStatus(user.id, e.target.value as any, user.status)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                            >
                              <option value="Colaborador">Colaborador</option>
                              <option value="Vendedor">Vendedor</option>
                              <option value="RH">RH</option>
                              <option value="CEO">CEO</option>
                            </select>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex items-center justify-end gap-2 text-white">
                              {user.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => updateUserRoleAndStatus(user.id, user.role, 'approved')}
                                    className="p-1.5 rounded-lg bg-emerald-500 hover:scale-110 transition-transform"
                                    title="Aprovar"
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => updateUserRoleAndStatus(user.id, user.role, 'rejected')}
                                    className="p-1.5 rounded-lg bg-red-500 hover:scale-110 transition-transform"
                                    title="Recusar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                              {user.status === 'approved' && user.email !== 'viniciusbarbosasampaio71@gmail.com' && (
                                <button 
                                  onClick={() => updateUserRoleAndStatus(user.id, user.role, 'rejected')}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-on-surface-variant hover:text-red-400 text-[10px] font-bold uppercase tracking-widest"
                                >
                                  Desativar
                                </button>
                              )}
                              {user.status === 'rejected' && (
                                <button 
                                  onClick={() => updateUserRoleAndStatus(user.id, user.role, 'approved')}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-on-surface-variant hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest"
                                >
                                  Reativar
                                </button>
                              )}
                              <button 
                                onClick={() => deleteSystemUser(user.id)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-500 transition-all ml-2"
                                title="Remover Usuário"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal: Nova Task */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Adicionar Nova Tarefa Recorrente">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Título da Tarefa</label>
            <input 
              required
              type="text" 
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="Ex: Reunião de alinhamento"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cliente</label>
            <select 
              required
              value={newTask.clientId}
              onChange={e => setNewTask({...newTask, clientId: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
            >
              <option value="">Selecione um cliente</option>
              {myClients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Frequência</label>
              <select 
                value={newTask.frequency}
                onChange={e => setNewTask({...newTask, frequency: e.target.value as any})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              >
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            {newTask.frequency === 'weekly' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Dia da Semana</label>
                <select 
                  multiple
                  value={newTask.daysOfWeek?.map(String)}
                  onChange={e => {
                    const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                    setNewTask({...newTask, daysOfWeek: values});
                  }}
                  className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none h-24"
                >
                  <option value="0">Domingo</option>
                  <option value="1">Segunda</option>
                  <option value="2">Terça</option>
                  <option value="3">Quarta</option>
                  <option value="4">Quinta</option>
                  <option value="5">Sexta</option>
                  <option value="6">Sábado</option>
                </select>
                <p className="text-[8px] text-on-surface-variant">Segure Ctrl para selecionar múltiplos</p>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow mt-4">
            Salvar Tarefa
          </button>
        </form>
      </Modal>
      
      {/* Modal: Novo Usuário */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Adicionar Novo Membro">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nome Completo</label>
            <input 
              required
              type="text" 
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">E-mail do Google</label>
            <input 
              required
              type="email" 
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
              placeholder="usuario@gmail.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cargo / Acesso</label>
            <select 
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as any})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none"
            >
              <option value="Colaborador">Colaborador</option>
              <option value="Vendedor">Vendedor</option>
              <option value="RH">RH</option>
              <option value="CEO">CEO</option>
            </select>
          </div>
          <p className="text-[10px] text-on-surface-variant italic">
            O colaborador terá acesso liberado assim que fizer o login com este e-mail.
          </p>
          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow mt-4">
            Liberar Acesso
          </button>
        </form>
      </Modal>

      {/* Modal: Detalhes do Cliente */}
      <Modal 
        isOpen={!!selectedClient} 
        onClose={() => setSelectedClient(null)} 
        title={selectedClient?.company || selectedClient?.name || 'Detalhes do Cliente'}
      >
        {selectedClient && (
          <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/5 p-4 ghost-border">
                <img src={selectedClient.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-2xl font-headline font-bold text-white">{selectedClient.company || selectedClient.name}</h3>
                <p className="text-sm text-on-surface-variant">{selectedClient.industry} • Desde {selectedClient.since}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedClient.healthStatus === 'green' ? 'bg-emerald-500' :
                    selectedClient.healthStatus === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Status de Saúde: {
                      selectedClient.healthStatus === 'green' ? 'Excelente' :
                      selectedClient.healthStatus === 'yellow' ? 'Atenção' : 'Crítico'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Faturamento Mensal</p>
                <p className="text-lg font-headline font-bold text-white">{selectedClient.revenue}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status do Contrato</p>
                <p className="text-lg font-headline font-bold text-white">{selectedClient.status}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/10 pb-2">Escopo de Trabalho</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/2 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Vídeos/Mês</p>
                  <p className="text-xl font-headline font-bold text-white">{selectedClient.planDetails?.totalEdits || 0}</p>
                </div>
                <div className="p-4 bg-white/2 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Captações/Mês</p>
                  <p className="text-xl font-headline font-bold text-white">{selectedClient.planDetails?.totalCaptures || 0}</p>
                </div>
              </div>
              <div className="p-4 bg-white/2 rounded-xl border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Serviços Incluídos</p>
                <p className="text-sm text-white leading-relaxed">{selectedClient.planDetails?.included || 'Não especificado'}</p>
              </div>
            </div>

            {selectedClient.strategyLink && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white">Link da Estratégia</h4>
                <a 
                  href={selectedClient.strategyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  <span className="text-sm font-medium">Acessar Documento de Estratégia</span>
                  <ExternalLink size={18} />
                </a>
              </div>
            )}

            {/* Confidential Data Section */}
            {(userRole === 'CEO' || selectedClient.managerId === currentUserId) && (
              <div className="space-y-4 p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={18} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Dados Confidenciais</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">E-mails / Acessos</p>
                    <p className="text-sm text-white font-mono bg-black/20 p-3 rounded-lg break-all">
                      {selectedClient.confidentialData?.emails || 'Nenhum dado cadastrado.'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Senhas / Chaves</p>
                    <p className="text-sm text-white font-mono bg-black/20 p-3 rounded-lg break-all">
                      {selectedClient.confidentialData?.passwords || 'Nenhum dado cadastrado.'}
                    </p>
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
