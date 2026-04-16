import React, { useState, useRef } from 'react';
import { 
  TrendingUp, 
  Users, 
  ClipboardList, 
  ArrowUpRight, 
  MoreVertical, 
  Bot,
  Loader2,
  CheckCircle2,
  FileDown,
  Upload
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const { clients, leads, projects, userRole, showToast } = useData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'success'>('idle');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const dashboardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const yearlyData: Record<number, { sales: number[]; revenue: number[] }> = {
    2024: {
      sales: [12, 15, 18, 22, 20, 25, 28, 30, 26, 32, 35, 40],
      revenue: [45000, 52000, 58000, 65000, 62000, 70000, 75000, 82000, 78000, 88000, 95000, 110000]
    },
    2023: {
      sales: [8, 10, 12, 14, 13, 16, 18, 20, 19, 22, 24, 28],
      revenue: [30000, 35000, 40000, 45000, 42000, 48000, 52000, 58000, 55000, 62000, 68000, 75000]
    }
  };

  const currentYearData = yearlyData[selectedYear] || yearlyData[2024];

  const isPrivileged = userRole === 'CEO' || userRole === 'RH';

  const parseRevenue = (revenueStr: string) => {
    if (!revenueStr) return 0;
    const clean = revenueStr.replace(/[R$\.\/mês\s]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // 1. Faturamento Mensal (Active clients + One-time projects)
  const activeClientsRevenue = clients
    .filter(c => c.status === 'Ativo')
    .reduce((acc, c) => acc + parseRevenue(c.revenue), 0);
  
  const oneTimeProjectsRevenue = projects
    .filter(p => p.type === 'Único')
    .reduce((acc, p) => acc + parseRevenue(p.value || '0'), 0);

  const totalRevenue = activeClientsRevenue + oneTimeProjectsRevenue;
  const formattedRevenue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue);

  // 2. Novos Leads (New clients this month)
  const newClientsThisMonth = clients.filter(c => isThisMonth(c.createdAt)).length;

  // 3. Projetos Ativos (One-time projects not finished)
  const activeOneTimeProjects = projects.filter(p => p.type === 'Único' && p.status !== 'Concluído').length;

  // 4. Clientes Ativos (Plan clients)
  const activePlanClients = clients.filter(c => c.status === 'Ativo').length;

  const stats = [
    { 
      label: 'Faturamento Mensal', 
      value: isPrivileged ? formattedRevenue : 'RESTRICTED', 
      change: isPrivileged ? '+12.4%' : '', 
      icon: TrendingUp, 
      trend: isPrivileged ? 'up' : 'neutral' 
    },
    { 
      label: 'Novos Leads', 
      value: isPrivileged ? newClientsThisMonth.toString() : 'RESTRICTED', 
      change: isPrivileged ? 'Este Mês' : '', 
      icon: Users, 
      trend: 'neutral' 
    },
    { 
      label: 'Projetos Ativos', 
      value: isPrivileged ? activeOneTimeProjects.toString() : 'RESTRICTED', 
      change: isPrivileged ? 'Em Produção' : '', 
      icon: ClipboardList, 
      trend: 'neutral' 
    },
    { 
      label: 'Clientes Ativos', 
      value: isPrivileged ? activePlanClients.toString() : 'RESTRICTED', 
      change: isPrivileged ? 'Total' : '', 
      icon: Users, 
      trend: 'neutral' 
    },
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('ASSESSORIA OMEGA', 15, 20);
      doc.setFontSize(10);
      doc.text(`RELATÓRIO MENSAL - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}`, 15, 30);
      
      // Content
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text('Resumo de Performance', 15, 55);
      
      doc.setFontSize(12);
      doc.text(`Faturamento Total: ${formattedRevenue}`, 15, 70);
      doc.text(`Novos Clientes no Mês: ${newClientsThisMonth}`, 15, 80);
      doc.text(`Projetos Únicos em Andamento: ${activeOneTimeProjects}`, 15, 90);
      doc.text(`Clientes de Plano Ativos: ${activePlanClients}`, 15, 100);

      // Add Dashboard Screenshot if available
      if (dashboardRef.current) {
        const canvas = await html2canvas(dashboardRef.current, {
          backgroundColor: '#0a0a0a',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          onclone: (clonedDoc) => {
            // Fix for html2canvas not supporting oklab/oklch in Tailwind v4
            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              // Remove backdrop-filter as it causes issues with html2canvas
              if (el.style.backdropFilter || (el.style as any).webkitBackdropFilter) {
                el.style.backdropFilter = 'none';
                (el.style as any).webkitBackdropFilter = 'none';
              }
              // Force standard colors for glass panels to avoid oklab parsing errors
              if (el.classList.contains('glass-panel')) {
                el.style.backgroundColor = 'rgba(20, 20, 20, 0.8)';
                el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
              }
            }
          }
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addPage();
        doc.text('Visão Geral do Dashboard', 15, 20);
        doc.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight);
      }

      doc.save(`Relatorio_Omega_${new Date().toISOString().split('T')[0]}.pdf`);
      setReportStatus('success');
      setTimeout(() => setReportStatus('idle'), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imgData = e.target?.result as string;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('ASSESSORIA OMEGA', 15, 20);
        doc.setFontSize(10);
        doc.text('RELATÓRIO DE PERFORMANCE - GERENCIADOR', 15, 30);
        
        // Content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('Análise de Resultados (Print do Gerenciador)', 15, 55);
        doc.setFontSize(10);
        doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 15, 62);

        // Image
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = pageWidth - 30;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        doc.addImage(imgData, 'JPEG', 15, 75, imgWidth, imgHeight);
        
        // Footer/Notes area
        const footerY = 75 + imgHeight + 20;
        if (footerY < 280) {
          doc.setFontSize(12);
          doc.text('Observações Estratégicas:', 15, footerY);
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text('Os dados acima refletem a performance capturada diretamente do gerenciador.', 15, footerY + 10);
          doc.text('Nossa equipe está monitorando as métricas para otimização contínua.', 15, footerY + 15);
        }

        doc.save(`Relatorio_Gerenciador_${new Date().toISOString().split('T')[0]}.pdf`);
        setReportStatus('success');
        setTimeout(() => setReportStatus('idle'), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const activities: any[] = [];

  return (
    <div className="space-y-12" ref={dashboardRef}>
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Visão Geral do Sistema</p>
          <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-white">Olá, {userRole}</h2>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-full bg-surface-highest ghost-border text-white font-label text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            Print Gerenciador
          </button>
          <button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-full bg-white text-on-primary font-label text-xs font-bold uppercase tracking-wider signature-glow hover:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : reportStatus === 'success' ? <CheckCircle2 size={16} /> : <FileDown size={16} />}
            {isGenerating ? 'Gerando...' : reportStatus === 'success' ? 'Relatório Gerado' : 'Gerar Relatório PDF'}
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-lg ghost-border space-y-4">
            <div className="flex justify-between items-start">
              <stat.icon size={20} className="text-white/40" />
              <span className={`text-[10px] font-label font-bold px-2 py-0.5 rounded-full ${
                stat.trend === 'up' ? 'text-green-400 bg-green-400/10' : 
                stat.trend === 'down' ? 'text-error bg-error/10' : 
                'text-white/60 bg-white/5'
              }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
              <h3 className="text-3xl font-headline font-bold text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </section>

      {/* Main Content Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-lg ghost-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div>
              <h4 className="text-xl font-headline font-bold text-white">Desempenho da Omega</h4>
              <p className="text-xs text-on-surface-variant font-body">Análise de vendas e faturamento mensal</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white/5 text-[10px] font-label text-white px-3 py-1 rounded-full ghost-border focus:outline-none cursor-pointer"
              >
                <option value={2024} className="bg-surface">2024</option>
                <option value={2023} className="bg-surface">2023</option>
              </select>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full ghost-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <span className="text-[10px] font-label text-white">Vendas</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full ghost-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                  <span className="text-[10px] font-label text-white/40">Faturamento</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-2 md:gap-4 group">
            {currentYearData.revenue.map((val, i) => {
              const maxRevenue = Math.max(...currentYearData.revenue);
              const h = (val / maxRevenue) * 100;
              return (
                <div 
                  key={i} 
                  className={`flex-1 transition-colors rounded-t-lg relative ${i === new Date().getMonth() ? 'bg-white/20 hover:bg-white/40' : 'bg-white/5 hover:bg-white/20'}`}
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center pointer-events-none">
                    <span className="text-[8px] text-white font-bold whitespace-nowrap">R$ {(val/1000).toFixed(1)}k</span>
                    <span className="text-[8px] text-white/60 whitespace-nowrap">{currentYearData.sales[i]} Vendas</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-6 text-[10px] font-label text-on-surface-variant uppercase tracking-widest px-1">
            <span>Jan</span>
            <span>Mar</span>
            <span>Mai</span>
            <span>Jul</span>
            <span>Set</span>
            <span>Dez</span>
          </div>
        </div>

        {/* Activity Card */}
        <div className="glass-panel p-8 rounded-lg ghost-border flex flex-col">
          <div className="mb-8">
            <h4 className="text-xl font-headline font-bold text-white">Atividades Recentes</h4>
            <p className="text-xs text-on-surface-variant font-body">Logs em tempo real da equipe</p>
          </div>
          <div className="space-y-8 flex-1">
            {activities.map((act, i) => (
              <div key={i} className={`flex gap-4 items-start ${act.isBot ? 'opacity-50' : ''}`}>
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ghost-border overflow-hidden">
                    {act.isBot ? (
                      <Bot size={16} className="text-white" />
                    ) : (
                      <img className="w-full h-full object-cover" src={act.img} alt={act.user} />
                    )}
                  </div>
                  {act.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-surface rounded-full"></div>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-white">
                    <span className="font-bold">{act.user}</span> {act.action} <span className="text-secondary">{act.target}</span>
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-tight">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => showToast('Carregando histórico completo de atividades...', 'info')}
            className="mt-8 w-full py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors border-t border-white/5 pt-6"
          >
            Ver todo o histórico
          </button>
        </div>
      </section>
    </div>
  );
}
