import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, 
  TrendingUp, 
  Target, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Loader2,
  Calendar,
  Download,
  Users,
  Plus,
  Save,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Eye,
  MessageSquare,
  DollarSign,
  Activity,
  History,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Client, ClientMetricRecord } from '../types';
import Modal from './ui/Modal';
import { format, subWeeks, startOfWeek, isSameWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateInsight } from '../services/aiService';

export default function Results() {
  const { clients, clientMetrics, addClientMetric, updateClientMetric, userRole } = useData();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'success'>('idle');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  const isManager = userRole === 'CEO' || userRole === 'RH';
  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  // Get metrics for selected client, sorted by date desc
  const selectedClientMetrics = clientMetrics
    .filter(m => m.clientId === selectedClientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentMetrics = selectedClientMetrics[selectedPeriodIndex];
  const previousMetrics = selectedClientMetrics[selectedPeriodIndex + 1];

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
      setSelectedPeriodIndex(0);
      generateAIInsight();
    }
  }, [selectedClientId]);

  const generateAIInsight = async () => {
    if (!currentMetrics) {
      setAiInsight('Aguardando dados iniciais para análise estratégica.');
      return;
    }
    setIsLoadingInsight(true);
    try {
      const prompt = `Analise os seguintes dados de performance do cliente ${selectedClient?.name} e forneça um insight estratégico curto (máximo 3 frases):
      - Taxa de conversão: ${currentMetrics.metrics.conversionRate}%
      - Conversas iniciadas: ${currentMetrics.metrics.conversationsStarted}
      - CPM: R$ ${currentMetrics.metrics.cpm}
      - Otimizações feitas: ${currentMetrics.optimizationsDone}
      
      O tom deve ser profissional e focado em escala.`;

      const text = await generateInsight(prompt);
      setAiInsight(text);
    } catch (error) {
      setAiInsight('Foco em reduzir o CPA através de novos criativos e segmentação de público morno.');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    addClientMetric(newMetricForm);
    setIsManagerModalOpen(false);
  };

  const handleExportPDF = async () => {
    if (!resultsRef.current || !selectedClient) return;
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('OMEGA - RELATÓRIO DE PERFORMANCE', 15, 20);
      doc.setFontSize(10);
      doc.text(`CLIENTE: ${selectedClient.name.toUpperCase()}`, 15, 30);
      doc.text(`DATA: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 15, 30, { align: 'right' });

      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (el.style.backdropFilter || (el.style as any).webkitBackdropFilter) {
              el.style.backdropFilter = 'none';
              (el.style as any).webkitBackdropFilter = 'none';
            }
            if (el.classList.contains('glass-panel')) {
              el.style.backgroundColor = 'rgba(20, 20, 20, 0.9)';
              el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', 10, 50, imgWidth, imgHeight);
      
      doc.save(`Performance_${selectedClient.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setPdfStatus('success');
      setTimeout(() => setPdfStatus('idle'), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const calculateChange = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1) + '%',
      trend: change >= 0 ? 'up' : 'down'
    };
  };

  const metricCards = [
    { 
      label: 'Taxa de Conversão', 
      value: currentMetrics ? `${currentMetrics.metrics.conversionRate}%` : '0%', 
      icon: TrendingUp,
      change: calculateChange(currentMetrics?.metrics.conversionRate || 0, previousMetrics?.metrics.conversionRate)
    },
    { 
      label: 'Taxa de Visualização', 
      value: currentMetrics ? `${currentMetrics.metrics.viewRate}%` : '0%', 
      icon: Eye,
      change: calculateChange(currentMetrics?.metrics.viewRate || 0, previousMetrics?.metrics.viewRate)
    },
    { 
      label: 'Conversas Iniciadas', 
      value: currentMetrics ? currentMetrics.metrics.conversationsStarted.toString() : '0', 
      icon: MessageSquare,
      change: calculateChange(currentMetrics?.metrics.conversationsStarted || 0, previousMetrics?.metrics.conversationsStarted)
    },
    { 
      label: 'CPM Médio', 
      value: currentMetrics ? `R$ ${currentMetrics.metrics.cpm.toFixed(2)}` : 'R$ 0,00', 
      icon: DollarSign,
      change: calculateChange(currentMetrics?.metrics.cpm || 0, previousMetrics?.metrics.cpm)
    },
  ];

  return (
    <div className="space-y-12" ref={resultsRef}>
      {/* Header & Client Selector */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Performance & Analytics</p>
            <h2 className="text-4xl font-headline font-bold text-white uppercase tracking-tight">Resultados Estratégicos</h2>
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
                title="Adicionar Métricas Semanais"
              >
                <Plus size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Atualizar Métricas</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <select 
              value={selectedPeriodIndex}
              onChange={(e) => setSelectedPeriodIndex(parseInt(e.target.value))}
              className="bg-surface-high border border-white/10 pl-12 pr-10 py-2.5 rounded-full text-[11px] text-white uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none min-w-[180px]"
            >
              {selectedClientMetrics.length > 0 ? (
                selectedClientMetrics.map((m, i) => (
                  <option key={m.id} value={i} className="bg-surface">
                    {i === 0 ? 'Semana Atual' : `Semana ${format(parseISO(m.date), 'dd/MM')}`}
                  </option>
                ))
              ) : (
                <option value={0} className="bg-surface">Sem dados</option>
              )}
            </select>
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={isGeneratingPDF || !selectedClient}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-on-primary font-label text-xs font-bold uppercase tracking-wider signature-glow hover:scale-95 transition-transform disabled:opacity-50"
          >
            {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : pdfStatus === 'success' ? <CheckCircle2 size={16} /> : <Download size={16} />}
            <span>{isGeneratingPDF ? 'Gerando...' : pdfStatus === 'success' ? 'Relatório Gerado' : 'Exportar Relatório'}</span>
          </button>
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl ghost-border space-y-4 group hover:bg-white/5 transition-all">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold">{metric.label}</p>
              {metric.change && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${metric.change.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {metric.change.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {metric.change.value}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-headline font-bold text-white group-hover:text-glow transition-all">{metric.value}</h3>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Comparado à semana anterior</p>
            </div>
          </div>
        ))}
      </div>

      {/* Growth & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl ghost-border space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-white/5 text-white">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-headline font-bold text-white uppercase tracking-tight">Crescimento Semanal</h3>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Conversões</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-4 px-4">
            {selectedClientMetrics.slice(0, 7).reverse().map((m, i) => {
              const h = (m.metrics.conversionRate / 20) * 100; // Scale based on 20% max
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="w-full relative">
                    <div className="absolute bottom-0 w-full bg-white/10 rounded-t-lg h-full" />
                    <div 
                      className="absolute bottom-0 w-full bg-white rounded-t-lg transition-all duration-1000 group-hover:signature-glow" 
                      style={{ height: `${Math.min(100, h)}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    {format(parseISO(m.date), 'dd/MM')}
                  </span>
                </div>
              );
            })}
            {selectedClientMetrics.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs italic">
                Nenhum dado histórico disponível para este cliente.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl ghost-border bg-gradient-to-br from-surface to-surface-low space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-white/5 text-white">
                <Sparkles size={20} />
              </div>
              <h3 className="font-headline font-bold text-white uppercase tracking-tight">Análise do Gestor</h3>
            </div>
            <button 
              onClick={generateAIInsight}
              disabled={isLoadingInsight || !currentMetrics}
              className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-white transition-all disabled:opacity-50"
              title="Recalcular Insights"
            >
              <Zap size={16} className={isLoadingInsight ? 'animate-pulse' : ''} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-amber-400" />
                <p className="text-xs font-bold text-white uppercase tracking-widest">Otimizações Realizadas</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-on-surface-variant leading-relaxed min-h-[60px]">
                {currentMetrics?.optimizationsDone || 'Nenhuma otimização registrada para este período.'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-blue-400" />
                <p className="text-xs font-bold text-white uppercase tracking-widest">Em Execução</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-on-surface-variant leading-relaxed min-h-[60px]">
                {currentMetrics?.optimizationsDoing || 'Aguardando plano de ação.'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Target size={18} className="text-emerald-400" />
                <p className="text-xs font-bold text-white uppercase tracking-widest">Próximos Passos</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-on-surface-variant leading-relaxed min-h-[60px]">
                {currentMetrics?.optimizationsToNext || 'Definindo metas para a próxima semana.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Table */}
      <section className="glass-panel rounded-2xl ghost-border overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-headline font-bold text-white uppercase tracking-tight">Performance por Campanha</h3>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Dados do Gestor</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Campanha</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Investimento</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Leads</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">CPA</th>
                <th className="px-6 py-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentMetrics?.campaigns.map((camp, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-white">{camp.name}</td>
                  <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">R$ {camp.spend.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">{camp.leads}</td>
                  <td className="px-6 py-4 text-xs font-mono text-emerald-400 font-bold">R$ {camp.cpa.toFixed(2)}</td>
                  <td className="px-6 py-4 text-xs font-mono text-white font-bold">{camp.roas}x</td>
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
        title={`Atualizar Métricas: ${selectedClient?.name}`}
      >
        <form onSubmit={handleAddMetric} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Data do Relatório</label>
              <input 
                type="date" 
                value={newMetricForm.date.split('T')[0]}
                onChange={e => setNewMetricForm({...newMetricForm, date: new Date(e.target.value).toISOString()})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tipo de Período</label>
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Taxa de Conversão (%)</label>
              <input 
                type="number" step="0.01"
                value={newMetricForm.metrics.conversionRate}
                onChange={e => setNewMetricForm({...newMetricForm, metrics: {...newMetricForm.metrics, conversionRate: parseFloat(e.target.value)}})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Taxa de Visualização (%)</label>
              <input 
                type="number" step="0.01"
                value={newMetricForm.metrics.viewRate}
                onChange={e => setNewMetricForm({...newMetricForm, metrics: {...newMetricForm.metrics, viewRate: parseFloat(e.target.value)}})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Conversas Iniciadas</label>
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Otimizações Realizadas</label>
              <textarea 
                value={newMetricForm.optimizationsDone}
                onChange={e => setNewMetricForm({...newMetricForm, optimizationsDone: e.target.value})}
                className="w-full h-24 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none text-xs"
                placeholder="O que foi feito..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Em Execução</label>
              <textarea 
                value={newMetricForm.optimizationsDoing}
                onChange={e => setNewMetricForm({...newMetricForm, optimizationsDoing: e.target.value})}
                className="w-full h-24 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none text-xs"
                placeholder="O que está sendo feito..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Próximos Passos</label>
              <textarea 
                value={newMetricForm.optimizationsToNext}
                onChange={e => setNewMetricForm({...newMetricForm, optimizationsToNext: e.target.value})}
                className="w-full h-24 bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none text-xs"
                placeholder="O que será feito..."
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
                  type="text" 
                  placeholder="Nome da Campanha"
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
                    type="number" placeholder="Gasto (R$)"
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
                    type="number" step="0.01" placeholder="CPA (R$)"
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
            <Save size={18} /> Salvar Métricas
          </button>
        </form>
      </Modal>
    </div>
  );
}
