import React, { useState } from 'react';
import { 
  Film, 
  Play, 
  Clock, 
  CheckCheck, 
  MoreVertical, 
  Plus, 
  HardDrive, 
  Cpu,
  Search,
  Filter,
  Camera,
  Layers,
  CheckCircle,
  Trash2,
  ArrowUp,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  User as UserIcon,
  Calendar as CalendarIcon,
  Video,
  Scissors,
  Save,
  Target,
  CheckCircle2,
  ListTodo,
  Send,
  AlertCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from './ui/Modal';
import { Project } from '../types';
import { parse, isBefore, addDays, isSameDay, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Production() {
  const { 
    projects, addProject, updateProjectProgress, updateProject, deleteProject, 
    missions, addMission, toggleMission, deleteMission,
    showToast 
  } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMission, setNewMission] = useState({ title: '', description: '' });
  const [newProject, setNewProject] = useState<Omit<Project, 'id'>>({
    title: '',
    status: 'Roteirização',
    progress: 0,
    team: ['https://picsum.photos/seed/user1/200/200'],
    deadline: '',
    priority: 'Média',
    type: 'Único',
    script: '',
    isEditing: false,
    rawMaterialLink: '',
    referenceLink: '',
    insertsLink: '',
    responsible: ''
  });

  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [activeTab, setActiveTab] = useState<'geral' | 'roteiro' | 'materiais' | 'descrição' | 'legenda'>('geral');

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeadlineStatus = (deadlineStr: string, status: string) => {
    if (status === 'Finalizado') return 'finished';
    
    try {
      // Try to parse "DD MMM" format (e.g., "15 Nov")
      const currentYear = new Date().getFullYear();
      const deadlineDate = parse(`${deadlineStr} ${currentYear}`, 'd MMM yyyy', new Date(), { locale: ptBR });
      
      if (!isValid(deadlineDate)) return 'normal';

      const today = new Date();
      const nearDeadline = addDays(today, 2); // 2 days warning

      if (isBefore(deadlineDate, today) || isSameDay(deadlineDate, today)) return 'urgent';
      if (isBefore(deadlineDate, nearDeadline)) return 'near';
    } catch (e) {
      return 'normal';
    }
    return 'normal';
  };

  const stages = [
    { label: 'Roteiro', icon: Film, count: projects.filter(p => p.status === 'Roteirização').length, color: 'text-blue-400' },
    { label: 'Captação', icon: Play, count: projects.filter(p => p.status === 'Captação').length, color: 'text-purple-400' },
    { label: 'Edição', icon: Clock, count: projects.filter(p => p.status === 'Em Edição').length, color: 'text-amber-400' },
    { label: 'Finalizado', icon: CheckCheck, count: projects.filter(p => p.status === 'Finalizado').length, color: 'text-emerald-400' },
  ];

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(newProject);
    setIsModalOpen(false);
    setNewProject({ 
      title: '', 
      status: 'Roteirização', 
      progress: 0, 
      team: ['https://picsum.photos/seed/user1/200/200'], 
      deadline: '', 
      priority: 'Média',
      type: 'Único',
      script: '',
      description: '',
      caption: '',
      isEditing: false,
      rawMaterialLink: '',
      referenceLink: '',
      insertsLink: '',
      responsible: ''
    });
  };

  const openDetails = (project: Project) => {
    setSelectedProject(project);
    setEditForm(project);
    setActiveTab('geral');
    setIsDetailsModalOpen(true);
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProject) {
      updateProject(selectedProject.id, editForm);
      setIsDetailsModalOpen(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Pipeline de Conteúdo</p>
          <h2 className="text-4xl font-headline font-bold text-white uppercase tracking-tight">Produção Audiovisual</h2>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-white transition-colors" />
            <input 
              className="bg-surface-low border-b border-white/20 focus:border-white focus:ring-0 text-sm py-3 pl-12 pr-6 rounded-t-lg w-full md:w-64 transition-all outline-none" 
              placeholder="Buscar projetos..." 
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
            Novo Projeto
          </button>
        </div>
      </section>

      {/* Stage Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl ghost-border hover:bg-white/5 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg bg-white/5 ${stage.color}`}>
                <stage.icon size={24} />
              </div>
              <span className="text-2xl font-headline font-bold text-white">{stage.count.toString().padStart(2, '0')}</span>
            </div>
            <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-bold">{stage.label}</p>
          </div>
        ))}
      </div>

      {/* Projects Table */}
      <section className="glass-panel rounded-2xl ghost-border overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-headline font-bold text-white uppercase tracking-tight">Projetos Ativos</h3>
          <button 
            onClick={() => showToast('Filtros de produção em desenvolvimento.', 'info')}
            className="text-on-surface-variant hover:text-white transition-colors"
          >
            <Filter size={20} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Projeto</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Progresso</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Equipe</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Prazo</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProjects.map((project) => {
                const deadlineStatus = getDeadlineStatus(project.deadline, project.status);
                const isUrgent = deadlineStatus === 'urgent' || deadlineStatus === 'near';
                const isFinished = deadlineStatus === 'finished';

                return (
                  <tr 
                    key={project.id} 
                    className={`hover:bg-white/5 transition-colors group cursor-pointer border-l-4 ${
                      isFinished ? 'border-emerald-500 bg-emerald-500/5' : 
                      isUrgent ? 'border-red-500 bg-red-500/5' : 
                      'border-transparent'
                    }`}
                    onClick={() => openDetails(project)}
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-1 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ghost-border ${
                          isFinished ? 'bg-emerald-500/20 text-emerald-400' :
                          isUrgent ? 'bg-red-500/20 text-red-400' :
                          'bg-surface-high text-white'
                        }`}>
                          {isFinished ? <CheckCheck size={16} /> : <Play size={16} />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold group-hover:text-glow transition-all ${
                            isFinished ? 'text-emerald-400' : 
                            isUrgent ? 'text-red-400' : 
                            'text-white'
                          }`}>
                            {project.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              project.priority === 'Alta' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              project.priority === 'Média' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {project.priority}
                            </span>
                            {isUrgent && (
                              <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold animate-pulse">
                                <AlertCircle size={10} /> PRAZO CRÍTICO
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${isFinished ? 'text-emerald-400' : isUrgent ? 'text-red-400' : 'text-on-surface-variant'}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32 space-y-2">
                        <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                          <span className={isFinished ? 'text-emerald-400' : isUrgent ? 'text-red-400' : ''}>{project.progress}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full pill-glow transition-all duration-500 ${
                              isFinished ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                              isUrgent ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                              'bg-white'
                            }`} 
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {project.team.map((img, i) => (
                          <img key={i} src={img} className="w-8 h-8 rounded-full border-2 border-surface" alt="Team member" referrerPolicy="no-referrer" />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-mono font-bold ${isFinished ? 'text-emerald-400' : isUrgent ? 'text-red-400' : 'text-on-surface-variant'}`}>
                        {project.deadline}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => updateProjectProgress(project.id, Math.min(100, project.progress + 5))}
                          className="p-2 rounded-lg bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 transition-all"
                          title="Incrementar Progresso"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button 
                          onClick={() => deleteProject(project.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          title="Excluir Projeto"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 text-on-surface-variant hover:text-white transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hardware & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-lg ghost-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-white/5 text-white">
                <ListTodo size={20} />
              </div>
              <h3 className="font-headline font-bold text-white uppercase tracking-tight">Missões Adicionais</h3>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
              {missions.filter(m => !m.completed).length} Pendentes
            </span>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {missions.length > 0 ? missions.map((mission) => (
              <div key={mission.id} className="group flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleMission(mission.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${mission.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 hover:border-white/40'}`}
                  >
                    {mission.completed && <CheckCircle2 size={14} />}
                  </button>
                  <div className={mission.completed ? 'opacity-40' : ''}>
                    <p className={`text-sm font-bold text-white ${mission.completed ? 'line-through' : ''}`}>{mission.title}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">{mission.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => deleteMission(mission.id)}
                  className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )) : (
              <div className="text-center py-8 opacity-40">
                <p className="text-xs italic">Nenhuma missão adicional para hoje.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nova missão..."
                value={newMission.title}
                onChange={e => setNewMission({...newMission, title: e.target.value})}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              />
              <button 
                onClick={() => {
                  if (newMission.title) {
                    addMission(newMission);
                    setNewMission({ title: '', description: '' });
                  }
                }}
                className="p-2 bg-white text-on-primary rounded-lg hover:scale-95 transition-transform"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-lg ghost-border bg-gradient-to-br from-surface to-surface-low">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded bg-white/5 text-white">
              <HardDrive size={20} />
            </div>
            <h3 className="font-headline font-bold text-white uppercase tracking-tight">Armazenamento Cloud</h3>
          </div>
          <div className="space-y-6">
            <a 
              href="https://drive.google.com/drive/folders/1LSI7JXrsCPpPMNRqx5pzbiLSn4s9I1bm?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <HardDrive size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Google Drive Business</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Conectado: omega-drive@gmail.com</p>
                </div>
              </div>
              <ExternalLink size={18} className="text-on-surface-variant group-hover:text-white transition-colors" />
            </a>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span>Espaço Utilizado</span>
                <span className="text-white">1.2TB / 5TB</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ width: '24%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Novo Projeto */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Projeto">
        <form onSubmit={handleAddProject} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Título do Projeto</label>
            <input 
              required
              type="text" 
              value={newProject.title}
              onChange={e => setNewProject({...newProject, title: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Ex: Campanha de Verão"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status Inicial</label>
              <select 
                value={newProject.status}
                onChange={e => setNewProject({...newProject, status: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none"
              >
                <option value="Roteirização">Roteirização</option>
                <option value="Captação">Captação</option>
                <option value="Em Edição">Em Edição</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Prioridade</label>
              <select 
                value={newProject.priority}
                onChange={e => setNewProject({...newProject, priority: e.target.value as Project['priority']})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none"
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Prazo de Entrega</label>
            <input 
              required
              type="text" 
              value={newProject.deadline}
              onChange={e => setNewProject({...newProject, deadline: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Ex: 15 Nov"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Responsável</label>
            <input 
              type="text" 
              value={newProject.responsible}
              onChange={e => setNewProject({...newProject, responsible: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Roteiro / Script</label>
            <textarea 
              value={newProject.script}
              onChange={e => setNewProject({...newProject, script: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 h-24 resize-none"
              placeholder="Cole o roteiro inicial aqui..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Legenda / Copy</label>
            <textarea 
              value={newProject.caption}
              onChange={e => setNewProject({...newProject, caption: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 h-24 resize-none"
              placeholder="Escreva a legenda inicial aqui..."
            />
          </div>
          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow hover:scale-[0.98] transition-transform mt-4">
            Criar Projeto
          </button>
        </form>
      </Modal>

      {/* Modal Detalhes do Projeto */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        title={`Projeto: ${selectedProject?.title}`}
      >
        <form onSubmit={handleUpdateProject} className="space-y-6">
          {/* Custom Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl ghost-border">
            <button 
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'geral' ? 'bg-white text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
            >
              Geral
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('roteiro')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'roteiro' ? 'bg-white text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
            >
              Roteiro
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('descrição')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'descrição' ? 'bg-white text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
            >
              Descrição
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('legenda')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'legenda' ? 'bg-white text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
            >
              Legenda
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('materiais')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'materiais' ? 'bg-white text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
            >
              Materiais
            </button>
          </div>

          <div className="min-h-[300px]">
            {activeTab === 'geral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <UserIcon size={12} /> Responsável
                    </label>
                    <input 
                      type="text" 
                      value={editForm.responsible || ''}
                      onChange={e => setEditForm({...editForm, responsible: e.target.value})}
                      className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <CalendarIcon size={12} /> Prazo
                    </label>
                    <input 
                      type="text" 
                      value={editForm.deadline || ''}
                      onChange={e => setEditForm({...editForm, deadline: e.target.value})}
                      className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="Ex: 25 Dez"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</label>
                    <select 
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value})}
                      className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none"
                    >
                      <option value="Roteirização">Roteirização</option>
                      <option value="Captação">Captação</option>
                      <option value="Em Edição">Em Edição</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Prioridade</label>
                    <select 
                      value={editForm.priority}
                      onChange={e => setEditForm({...editForm, priority: e.target.value as Project['priority']})}
                      className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${editForm.isEditing ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-on-surface-variant'}`}>
                        <Scissors size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Status de Edição</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">
                          {editForm.isEditing ? 'Em processo de edição' : 'Aguardando início'}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEditForm({...editForm, isEditing: !editForm.isEditing})}
                      className={`w-12 h-6 rounded-full transition-all relative ${editForm.isEditing ? 'bg-amber-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editForm.isEditing ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Progresso ({editForm.progress}%)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={editForm.progress || 0}
                      onChange={e => setEditForm({...editForm, progress: parseInt(e.target.value)})}
                      className="w-full accent-white"
                    />
                  </div>

                  {editForm.status === 'Em Edição' && (
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...editForm, 
                          status: 'Finalizado', 
                          progress: 100,
                          isEditing: false,
                          completedAt: new Date().toISOString()
                        };
                        setEditForm(updated);
                        // Save immediately to ensure it works
                        if (selectedProject) {
                          updateProject(selectedProject.id, updated);
                          setIsDetailsModalOpen(false);
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
                    >
                      <CheckCircle2 size={16} /> Finalizar Edição
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'roteiro' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <FileText size={12} /> Roteiro do Projeto
                  </label>
                  <textarea 
                    value={editForm.script || ''}
                    onChange={e => setEditForm({...editForm, script: e.target.value})}
                    className="w-full h-64 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                    placeholder="Escreva ou cole o roteiro aqui..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'descrição' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <FileText size={12} /> Descrição do Conteúdo
                  </label>
                  <textarea 
                    value={editForm.description || ''}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className="w-full h-64 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                    placeholder="Descreva os detalhes do vídeo/post..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'legenda' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <FileText size={12} /> Legenda / Copy
                  </label>
                  <textarea 
                    value={editForm.caption || ''}
                    onChange={e => setEditForm({...editForm, caption: e.target.value})}
                    className="w-full h-64 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                    placeholder="Escreva a legenda para as redes sociais..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'materiais' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <Video size={12} /> Materiais Brutos
                    </label>
                    <div className="relative">
                      <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input 
                        type="text" 
                        value={editForm.rawMaterialLink || ''}
                        onChange={e => setEditForm({...editForm, rawMaterialLink: e.target.value})}
                        className="w-full bg-surface-highest ghost-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="Link do Drive/S3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <LinkIcon size={12} /> Referência
                    </label>
                    <div className="relative">
                      <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input 
                        type="text" 
                        value={editForm.referenceLink || ''}
                        onChange={e => setEditForm({...editForm, referenceLink: e.target.value})}
                        className="w-full bg-surface-highest ghost-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="Link de referência"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <Layers size={12} /> Inserts
                    </label>
                    <div className="relative">
                      <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input 
                        type="text" 
                        value={editForm.insertsLink || ''}
                        onChange={e => setEditForm({...editForm, insertsLink: e.target.value})}
                        className="w-full bg-surface-highest ghost-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="Link dos inserts"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 size={12} /> Link do Vídeo Finalizado
                    </label>
                    <div className="relative">
                      <Send size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                      <input 
                        type="text" 
                        value={editForm.editedVideoLink || ''}
                        onChange={e => setEditForm({...editForm, editedVideoLink: e.target.value})}
                        className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                        placeholder="Link do vídeo finalizado (Google Drive)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow hover:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <Save size={18} /> Salvar Alterações
          </button>
        </form>
      </Modal>
    </div>
  );
}
