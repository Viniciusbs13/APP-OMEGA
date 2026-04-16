import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Users,
  Plus,
  Save,
  Trash2,
  Eye,
  MessageSquare,
  DollarSign,
  Activity,
  Calendar,
  Download,
  ChevronRight
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Client, ClientMetricRecord } from '../types';
import Modal from './ui/Modal';
import { format, parseISO } from 'date-fns';
import { generateInsight } from '../services/aiService';

export default function Strategy() {
  const { clients, clientMetrics, addClientMetric, userRole } = useData();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const isManager = userRole === 'CEO' || userRole === 'RH';
  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  const selectedClientMetrics = clientMetrics
    .filter(m => m.clientId === selectedClientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentMetrics = selectedClientMetrics[0];
  const previousMetrics = selectedClientMetrics[1];

  const [newMetricForm, setNewMetricForm] = useState<Omit<ClientMetricRecord, 'id'>>({
    clientId: selectedClientId,
    date: new Date().toISOString(),
    periodType: 'weekly',
    metrics: {
      conversionRate: 0,
      viewRate: 0,
      conversationsStarted: 0,
      cpv: 0,
      cpm: 0
    },
    optimizationsDone: '',
    optimizationsDoing: '',
    optimizationsToNext: '',
    campaigns: []
  });

  useEffect(() => {
    if (selectedClientId) {
      setNewMetricForm(prev => ({ ...prev, clientId: selectedClientId }));
      generateAIInsight();
    }
  }, [selectedClientId]);

  const generateAIInsight = async () => {
    if (!currentMetrics) {
      setAiInsight('Aguardando dados para análise estratégica personalizada.');
      return;
    }
    setIsLoadingInsight(true);
    try {
      const prompt = `Análise estratégica para o cliente ${selectedClient?.name}:
      - Conversão: ${currentMetrics.metrics.conversionRate}%
      - Conversas: ${currentMetrics.metrics.conversationsStarted}
      - Otimizações: ${currentMetrics.optimizationsDone}
      Forneça 2 recomendações táticas curtas.`;

      const text = await generateInsight(prompt);
      setAiInsight(text);
    } catch (error) {
      setAiInsight('Otimizar criativos de topo de funil para reduzir o CPM.');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    addClientMetric(newMetricForm);
    setIsManagerModalOpen(false);
  };

  const calculateChange = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1) + '%',
      trend: change >= 0 ? 'up' : 'down'
    };
  };

  return (
    <div className="space-y-12">
      {/* Header & Client Selector */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Strategic Growth</p>
            <h2 className="text-4xl font-headline font-bold text-white uppercase tracking-tight">Estratégia & Métricas</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <select 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-surface-high border border-white/10 pl-12 pr-10 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none min-w-[240px]"
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id} className="bg-surface">{client.name}</option>
                ))}
              </select>
            </div>
            
            {isManager && (
              <button 
                onClick={() => setIsManagerModalOpen(true)}
                className="p-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Nova Atualização</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-surface-high border border-white/10 px-5 py-2.5 rounded-full hover:bg-surface-highest transition-colors">
            <Calendar size={16} />
            <span className="font-label text-[11px] uppercase tracking-wider">Histórico</span>
          </button>
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Taxa de Conversão', val: currentMetrics?.metrics.conversionRate, prev: previousMetrics?.metrics.conversionRate, suffix: '%', icon: TrendingUp },
          { label: 'Taxa de Visualização', val: currentMetrics?.metrics.viewRate, prev: previousMetrics?.metrics.viewRate, suffix: '%', icon: Eye },
          { label: 'Conversas', val: currentMetrics?.metrics.conversationsStarted, prev: previousMetrics?.metrics.conversationsStarted, suffix: '', icon: MessageSquare },
          { label: 'CPM', val: currentMetrics?.metrics.cpm, prev: previousMetrics?.metrics.cpm, prefix: 'R$ ', icon: DollarSign },
        ].map((m, i) => {
          const change = calculateChange(m.val || 0, m.prev);
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl ghost-border space-y-4 group hover:bg-white/5 transition-all">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">{m.label}</p>
                {change && (
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${change.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {change.value}
                  </div>
                )}
              </div>
              <h3 className="text-3xl font-headline font-bold text-white">
                {m.prefix}{m.val?.toLocaleString() || '0'}{m.suffix}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Growth & Manager Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl ghost-border space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="font-headline font-bold text-white uppercase tracking-tight flex items-center gap-3">
              <Activity size={20} className="text-white" />
              Crescente do Cliente
            </h3>
          </div>
          <div className="h-64 flex items-end gap-4 px-4">
            {selectedClientMetrics.slice(0, 8).reverse().map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full relative h-full flex items-end">
                  <div 
                    className="w-full bg-white/20 rounded-t-lg transition-all duration-700 group-hover:bg-white group-hover:signature-glow" 
                    style={{ height: `${(m.metrics.conversionRate / 20) * 100}%` }} 
                  />
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant">{format(parseISO(m.date), 'dd/MM')}</span>
              </div>
            ))}
            {selectedClientMetrics.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs italic">
                Nenhum dado histórico disponível.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl ghost-border space-y-8 bg-white/2">
          <h3 className="font-headline font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <Sparkles size={20} className="text-white" />
            Insights do Gestor
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">O que foi feito</p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-on-surface-variant leading-relaxed min-h-[60px]">
                {currentMetrics?.optimizationsDone || 'Nenhuma atualização registrada.'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">O que está sendo feito</p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-on-surface-variant leading-relaxed min-h-[60px]">
                {currentMetrics?.optimizationsDoing || 'Aguardando plano de ação.'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">O que será feito</p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-on-surface-variant leading-relaxed min-h-[60px]">
                {currentMetrics?.optimizationsToNext || 'Definindo próximos passos.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <section className="glass-panel rounded-2xl ghost-border overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-headline font-bold text-white uppercase tracking-tight">Performance por Campanha</h3>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Atualização do Gestor</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Campanha</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Gasto</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Leads</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">CPA</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentMetrics?.campaigns.map((c, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-white">{c.name}</td>
                  <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">R$ {c.spend.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">{c.leads}</td>
                  <td className="px-6 py-4 text-xs font-mono text-emerald-400 font-bold">R$ {c.cpa.toFixed(2)}</td>
                  <td className="px-6 py-4 text-xs font-mono text-white font-bold">{c.roas}x</td>
                </tr>
              ))}
              {(!currentMetrics || currentMetrics.campaigns.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-xs italic">
                    Nenhuma campanha registrada para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Manager Modal */}
      <Modal 
        isOpen={isManagerModalOpen} 
        onClose={() => setIsManagerModalOpen(false)} 
        title={`Atualizar Estratégia: ${selectedClient?.name}`}
      >
        <form onSubmit={handleAddMetric} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Data</label>
              <input 
                type="date" 
                value={newMetricForm.date.split('T')[0]}
                onChange={e => setNewMetricForm({...newMetricForm, date: new Date(e.target.value).toISOString()})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Período</label>
              <select 
                value={newMetricForm.periodType}
                onChange={e => setNewMetricForm({...newMetricForm, periodType: e.target.value as 'weekly' | 'monthly'})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none"
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Conversão (%)</label>
              <input 
                type="number" step="0.01"
                value={newMetricForm.metrics.conversionRate}
                onChange={e => setNewMetricForm({...newMetricForm, metrics: {...newMetricForm.metrics, conversionRate: parseFloat(e.target.value)}})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Visualização (%)</label>
              <input 
                type="number" step="0.01"
                value={newMetricForm.metrics.viewRate}
                onChange={e => setNewMetricForm({...newMetricForm, metrics: {...newMetricForm.metrics, viewRate: parseFloat(e.target.value)}})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Conversas</label>
              <input 
                type="number"
                value={newMetricForm.metrics.conversationsStarted}
                onChange={e => setNewMetricForm({...newMetricForm, metrics: {...newMetricForm.metrics, conversationsStarted: parseInt(e.target.value)}})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">CPM (R$)</label>
              <input 
                type="number" step="0.01"
                value={newMetricForm.metrics.cpm}
                onChange={e => setNewMetricForm({...newMetricForm, metrics: {...newMetricForm.metrics, cpm: parseFloat(e.target.value)}})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">O que foi feito</label>
              <textarea 
                value={newMetricForm.optimizationsDone}
                onChange={e => setNewMetricForm({...newMetricForm, optimizationsDone: e.target.value})}
                className="w-full h-24 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">O que está sendo feito</label>
              <textarea 
                value={newMetricForm.optimizationsDoing}
                onChange={e => setNewMetricForm({...newMetricForm, optimizationsDoing: e.target.value})}
                className="w-full h-24 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">O que será feito</label>
              <textarea 
                value={newMetricForm.optimizationsToNext}
                onChange={e => setNewMetricForm({...newMetricForm, optimizationsToNext: e.target.value})}
                className="w-full h-24 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none text-xs"
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Campanhas</label>
              <button 
                type="button"
                onClick={() => setNewMetricForm({
                  ...newMetricForm, 
                  campaigns: [...newMetricForm.campaigns, { name: '', spend: 0, leads: 0, cpa: 0, roas: 0 }]
                })}
                className="text-[10px] font-bold text-white bg-white/5 px-3 py-1 rounded-full hover:bg-white/10 transition-all"
              >
                + Adicionar Campanha
              </button>
            </div>
            
            {newMetricForm.campaigns.map((camp, idx) => (
              <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4 relative">
                <button 
                  type="button"
                  onClick={() => setNewMetricForm({
                    ...newMetricForm,
                    campaigns: newMetricForm.campaigns.filter((_, i) => i !== idx)
                  })}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>
                <input 
                  type="text" placeholder="Campanha"
                  value={camp.name}
                  onChange={e => {
                    const updated = [...newMetricForm.campaigns];
                    updated[idx].name = e.target.value;
                    setNewMetricForm({...newMetricForm, campaigns: updated});
                  }}
                  className="w-full bg-surface-highest ghost-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" placeholder="Gasto"
                    value={camp.spend}
                    onChange={e => {
                      const updated = [...newMetricForm.campaigns];
                      updated[idx].spend = parseFloat(e.target.value);
                      setNewMetricForm({...newMetricForm, campaigns: updated});
                    }}
                    className="bg-surface-highest ghost-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input 
                    type="number" placeholder="Leads"
                    value={camp.leads}
                    onChange={e => {
                      const updated = [...newMetricForm.campaigns];
                      updated[idx].leads = parseInt(e.target.value);
                      setNewMetricForm({...newMetricForm, campaigns: updated});
                    }}
                    className="bg-surface-highest ghost-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input 
                    type="number" step="0.01" placeholder="CPA"
                    value={camp.cpa}
                    onChange={e => {
                      const updated = [...newMetricForm.campaigns];
                      updated[idx].cpa = parseFloat(e.target.value);
                      setNewMetricForm({...newMetricForm, campaigns: updated});
                    }}
                    className="bg-surface-highest ghost-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input 
                    type="number" step="0.1" placeholder="ROAS"
                    value={camp.roas}
                    onChange={e => {
                      const updated = [...newMetricForm.campaigns];
                      updated[idx].roas = parseFloat(e.target.value);
                      setNewMetricForm({...newMetricForm, campaigns: updated});
                    }}
                    className="bg-surface-highest ghost-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest shadow-xl hover:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Save size={18} /> Salvar Atualização
          </button>
        </form>
      </Modal>
    </div>
  );
}
