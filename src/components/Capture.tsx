/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  User, 
  CheckCircle2, 
  Upload, 
  ChevronRight, 
  Maximize, 
  Plus, 
  Search, 
  Cloud,
  Calendar as CalendarIcon,
  Building2,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ExternalLink,
  Loader2,
  FolderPlus,
  FolderMinus,
  Navigation,
  ClipboardList
} from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from './ui/Modal';
import { Capture } from '../types';
import GoogleMapReact from 'google-map-react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AnyReactComponent = ({ text, lat, lng }: { text: string; lat?: number; lng?: number }) => (
  <div className="relative group">
    <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-high px-3 py-1.5 rounded-lg text-[10px] font-bold ghost-border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
      {text}
    </div>
  </div>
);

export default function CaptureSector() {
  const { captures, addCapture, updateCapture, deleteCapture, showToast } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 10, 1)); // Nov 2024
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2024, 10, 4));
  const [googleTokens, setGoogleTokens] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const [newCapture, setNewCapture] = useState<Omit<Capture, 'id'>>({
    title: '',
    location: '',
    lat: -23.5505,
    lng: -46.6333,
    clientContact: '',
    date: '',
    time: '',
    startDateTime: '',
    endDateTime: '',
    status: 'Confirmado',
    type: 'Studio',
    script: ''
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setNewCapture(prev => ({ ...prev, lat: loc.lat, lng: loc.lng }));
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  // Load tokens from localStorage
  useEffect(() => {
    const tokens = localStorage.getItem('google_calendar_tokens');
    if (tokens) setGoogleTokens(JSON.parse(tokens));

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        setGoogleTokens(tokens);
        localStorage.setItem('google_calendar_tokens', JSON.stringify(tokens));
        showToast('Conectado ao Google com sucesso!', 'success');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const syncToGoogle = async (capture: Capture) => {
    if (!googleTokens) {
      showToast('Por favor, conecte sua conta Google primeiro.', 'info');
      return;
    }
    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: googleTokens, capture })
      });
      if (response.ok) {
        showToast('Sincronizado com Google Agenda!', 'success');
      } else {
        showToast('Falha na sincronização.', 'error');
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const createDriveFolder = async (capture: Capture) => {
    if (!googleTokens) {
      showToast('Por favor, conecte sua conta Google primeiro.', 'info');
      return;
    }
    setIsCreatingFolder(capture.id);
    try {
      const response = await fetch('/api/drive/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: googleTokens, folderName: `OMEGA - ${capture.title}` })
      });
      const data = await response.json();
      if (data.success) {
        updateCapture(capture.id, { driveFolderId: data.folderId });
        showToast('Pasta criada no Google Drive!', 'success');
      }
    } catch (error) {
      console.error('Drive error:', error);
    } finally {
      setIsCreatingFolder(null);
    }
  };

  const deleteDriveFolder = async (capture: Capture) => {
    if (!googleTokens || !capture.driveFolderId) return;
    if (!confirm('Tem certeza que deseja apagar a pasta no Drive?')) return;
    
    setIsCreatingFolder(capture.id);
    try {
      const response = await fetch(`/api/drive/folder/${capture.driveFolderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: googleTokens })
      });
      if (response.ok) {
        updateCapture(capture.id, { driveFolderId: undefined });
        showToast('Pasta removida do Drive.', 'success');
      }
    } catch (error) {
      console.error('Drive delete error:', error);
    } finally {
      setIsCreatingFolder(null);
    }
  };

  const handleCheckIn = (capture: Capture) => {
    // Mark current as finished (Pendente)
    updateCapture(capture.id, { status: 'Pendente' });
    
    // Find next capture for today
    const today = new Date();
    const next = captures.find(c => 
      c.id !== capture.id && 
      c.status === 'Confirmado' && 
      isSameDay(parseISO(c.startDateTime), today)
    );

    if (next) {
      updateCapture(next.id, { status: 'Ativo Agora' });
      showToast(`Check-in realizado para ${capture.title}. Próxima captação: ${next.title}`, 'success');
    } else {
      showToast(`Check-in realizado para ${capture.title}. Não há mais captações para hoje.`, 'success');
    }
  };

  const activeCapture = captures.find(c => c.status === 'Ativo Agora');
  const selectedDateCaptures = captures.filter(c => isSameDay(parseISO(c.startDateTime), selectedDate));
  const finishedToday = captures.filter(c => 
    c.status === 'Pendente' && 
    isSameDay(parseISO(c.startDateTime), new Date())
  );
  const upcomingCaptures = captures.filter(c => 
    c.status === 'Confirmado' && 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCapture = (e: React.FormEvent) => {
    e.preventDefault();
    const isoDate = format(selectedDate, 'yyyy-MM-dd');
    const startISO = `${isoDate}T${newCapture.time}:00Z`;
    const endISO = `${isoDate}T${String(parseInt(newCapture.time.split(':')[0]) + 2).padStart(2, '0')}:${newCapture.time.split(':')[1]}:00Z`;

    addCapture({
      ...newCapture,
      date: format(selectedDate, 'dd MMM', { locale: ptBR }),
      startDateTime: startISO,
      endDateTime: endISO
    });
    setIsModalOpen(false);
    setNewCapture({
      title: '',
      location: '',
      lat: userLocation?.lat || -23.5505,
      lng: userLocation?.lng || -46.6333,
      clientContact: '',
      date: '',
      time: '',
      startDateTime: '',
      endDateTime: '',
      status: 'Confirmado',
      type: 'Studio'
    });
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline text-xl font-bold text-white capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-full hover:bg-white/5 text-on-surface-variant">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-full hover:bg-white/5 text-on-surface-variant">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return (
      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map((d, i) => (
          <span key={i} className="font-label text-[9px] uppercase text-center opacity-40 text-white font-bold">{d}</span>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, i) => {
          const hasEvents = captures.some(c => isSameDay(parseISO(c.startDateTime), day));
          return (
            <div 
              key={i} 
              onClick={() => setSelectedDate(day)}
              className={`aspect-square flex flex-col items-center justify-center text-xs rounded-full cursor-pointer transition-all relative ${
                !isSameMonth(day, monthStart) ? 'opacity-20' : 
                isSameDay(day, selectedDate) ? 'bg-white text-on-primary font-bold shadow-lg scale-110' : 
                'text-on-surface-variant hover:bg-white/5'
              }`}
            >
              {format(day, 'd')}
              {hasEvents && !isSameDay(day, selectedDate) && (
                <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Operações de Campo</p>
          <h2 className="text-4xl font-headline text-5xl md:text-6xl font-bold tracking-tighter text-white uppercase tracking-tight">Agenda de Captação</h2>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={connectGoogle}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-all ${
              googleTokens ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-surface-high text-white border border-white/10 hover:bg-white/5'
            }`}
          >
            <ExternalLink size={16} />
            {googleTokens ? 'Google Conectado' : 'Conectar Google'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-on-primary font-label text-sm font-bold py-3 px-8 rounded-full signature-glow hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
          >
            Nova Ordem
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar: Calendar & Weather */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-low rounded-2xl p-8 ghost-border">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <div className="space-y-6 pt-8 mt-8 border-t border-white/5">
              <h4 className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                Agenda: {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h4>
              <div className="space-y-6 relative pl-6 border-l border-white/10">
                {selectedDateCaptures.length > 0 ? selectedDateCaptures.map((c, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
                    <p className="font-label text-[10px] text-on-surface-variant font-bold">{c.time}</p>
                    <p className="text-sm font-medium text-white group-hover:text-glow transition-all">{c.title}</p>
                    <p className="text-[10px] text-on-surface-variant">{c.location}</p>
                  </div>
                )) : (
                  <p className="text-xs text-on-surface-variant italic">Nenhuma captação para este dia.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface-low rounded-2xl p-6 ghost-border flex items-center justify-between group hover:bg-white/5 transition-all">
            <div className="space-y-1">
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Condições Externas</p>
              <p className="text-2xl font-headline font-bold text-white">24°C <span className="text-sm font-normal opacity-50 ml-1">Nublado</span></p>
            </div>
            <Cloud size={32} className="text-on-surface-variant group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Main Content: Active Capture & List */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {activeCapture ? (
            <div className="bg-surface-high rounded-2xl overflow-hidden ghost-border relative group">
              <div className="absolute top-6 right-6 z-10 flex gap-2">
                <button 
                  onClick={() => syncToGoogle(activeCapture)}
                  disabled={isSyncing}
                  className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white border border-white/10 hover:bg-white/20 transition-all"
                  title="Sincronizar com Google Agenda"
                >
                  {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <CalendarIcon size={14} />}
                </button>
                <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-label font-bold text-white border border-white/10 uppercase tracking-widest animate-pulse">
                  Ativo Agora
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="h-64 lg:h-auto relative overflow-hidden">
                  <img 
                    src={activeCapture.img || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800"} 
                    alt="Active Capture" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface-high via-transparent to-transparent hidden lg:block" />
                </div>
                <div className="p-10 flex flex-col justify-center space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-headline text-3xl font-bold text-white">{activeCapture.title}</h3>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <MapPin size={14} />
                      <span className="text-xs uppercase tracking-widest font-bold">{activeCapture.location}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Contato do Cliente</p>
                        <p className="text-sm font-bold text-white">{activeCapture.clientContact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <ClipboardList size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Scripts do Dia</p>
                        <p className="text-[10px] text-white line-clamp-2">{activeCapture.script || 'Nenhum script definido.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => handleCheckIn(activeCapture)}
                      className="flex-1 bg-white text-on-primary py-4 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform"
                    >
                      <CheckCircle2 size={16} /> Check-in
                    </button>
                    <div className="flex-1 flex gap-2">
                      {activeCapture.driveFolderId ? (
                        <>
                          <a 
                            href={`https://drive.google.com/drive/folders/${activeCapture.driveFolderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-white/5 text-white py-4 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                          >
                            <Upload size={16} /> Drive
                          </a>
                          <button 
                            onClick={() => deleteDriveFolder(activeCapture)}
                            className="p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                          >
                            <FolderMinus size={16} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => createDriveFolder(activeCapture)}
                          disabled={isCreatingFolder === activeCapture.id}
                          className="flex-1 bg-white/5 text-white py-4 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                        >
                          {isCreatingFolder === activeCapture.id ? <Loader2 size={16} className="animate-spin" /> : <FolderPlus size={16} />}
                          Criar Pasta
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-high rounded-2xl p-12 ghost-border text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-on-surface-variant">
                <Camera size={32} />
              </div>
              <h3 className="text-xl font-headline font-bold text-white">Nenhuma captação ativa</h3>
              <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
                {captures.some(c => c.status === 'Confirmado' && isSameDay(parseISO(c.startDateTime), new Date())) 
                  ? "Você tem captações agendadas para hoje. Inicie uma para começar."
                  : "Não há captações agendadas para o dia de hoje."}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {finishedToday.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-label text-xs uppercase tracking-[0.3em] text-emerald-400 font-bold px-2">Captações Realizadas Hoje</h3>
                <div className="space-y-4">
                  {finishedToday.map((capture) => (
                    <div 
                      key={capture.id} 
                      className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10 flex items-center justify-between gap-6 opacity-60"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex items-center justify-center bg-emerald-500/20 w-12 h-12 rounded-xl text-emerald-400">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-headline font-bold text-white line-through">{capture.title}</h4>
                          <p className="text-xs text-on-surface-variant">Finalizado em: {capture.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-2">
              <h3 className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant font-bold">Próximas Captações</h3>
              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-surface-low border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-white/30 transition-all w-40"
                />
              </div>
            </div>

            <div className="space-y-4">
              {upcomingCaptures.map((capture) => (
                <div 
                  key={capture.id} 
                  className="bg-surface-low rounded-2xl p-6 ghost-border flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="flex flex-col items-center justify-center bg-surface-high w-16 h-16 rounded-2xl ghost-border group-hover:border-white/30 transition-colors">
                      <span className="font-headline text-xl font-bold text-white">{capture.date.split(' ')[0]}</span>
                      <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">{capture.date.split(' ')[1]}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-headline font-bold text-white group-hover:text-glow transition-all">{capture.title}</h4>
                      <p className="text-xs text-on-surface-variant font-medium">Local: {capture.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5">
                      <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">Status: {capture.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateCapture(capture.id, { status: 'Ativo Agora' })}
                        className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                        title="Iniciar Captação"
                      >
                        <Navigation size={18} />
                      </button>
                      {capture.driveFolderId ? (
                        <a 
                          href={`https://drive.google.com/drive/folders/${capture.driveFolderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                          title="Abrir no Drive"
                        >
                          <ExternalLink size={18} />
                        </a>
                      ) : (
                        <button 
                          onClick={() => createDriveFolder(capture)}
                          className="p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                          title="Criar Pasta no Drive"
                        >
                          <FolderPlus size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => syncToGoogle(capture)}
                        className="p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                        title="Sincronizar com Google Agenda"
                      >
                        <CalendarIcon size={18} />
                      </button>
                      <button 
                        onClick={() => deleteCapture(capture.id)}
                        className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real Map Section */}
      <section className="mt-12">
        <div className="bg-surface-low rounded-3xl overflow-hidden ghost-border h-[400px] relative group">
          {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY.length > 20 && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY.includes('MY_') ? (
            <GoogleMapReact
              center={userLocation || { lat: -23.5505, lng: -46.6333 }}
              defaultZoom={12}
              options={{
                styles: [
                  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
                  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
                  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
                  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
                  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
                  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] }
                ]
              }}
            >
              {userLocation && (
                <AnyReactComponent
                  lat={userLocation.lat}
                  lng={userLocation.lng}
                  text="Sua Localização"
                />
              )}
              {captures.map(c => c.lat && c.lng && (
                <AnyReactComponent
                  key={c.id}
                  lat={c.lat}
                  lng={c.lng}
                  text={c.title}
                />
              ))}
            </GoogleMapReact>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-on-surface-variant p-8 text-center">
              <MapPin size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Chave de API do Maps Ausente</p>
              <p className="text-xs mt-2 opacity-60">Configure a variável VITE_GOOGLE_MAPS_API_KEY nos Secrets para ativar o mapa.</p>
            </div>
          )}
          
          <div className="absolute bottom-8 left-8 z-10 glass-panel ghost-border px-8 py-6 rounded-2xl max-w-xs">
            <h4 className="font-headline font-bold text-xl text-white mb-2">Roteiro do Dia</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">Mapa em tempo real com sua localização e locações de captação.</p>
          </div>
          <button 
            onClick={() => userLocation && setUserLocation({...userLocation})} // Trigger re-center
            className="absolute top-8 right-8 bg-white/10 backdrop-blur-md p-4 rounded-full ghost-border text-white hover:bg-white/20 transition-all"
          >
            <Navigation size={20} />
          </button>
        </div>
      </section>

      {/* Modal Nova Captação */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Ordem de Captação">
        <form onSubmit={handleAddCapture} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Título do Projeto</label>
            <input 
              required
              type="text" 
              value={newCapture.title}
              onChange={e => setNewCapture({...newCapture, title: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Ex: Entrevista CEO Nexus"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Data Selecionada</label>
              <div className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white/50">
                {format(selectedDate, 'dd/MM/yyyy')}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Horário</label>
              <input 
                required
                type="time" 
                value={newCapture.time}
                onChange={e => setNewCapture({...newCapture, time: e.target.value})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Localização (Endereço)</label>
            <PlacesAutocomplete 
              onSelect={(address, lat, lng) => {
                setNewCapture(prev => ({ ...prev, location: address, lat, lng }));
              }}
              defaultValue={newCapture.location}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Latitude</label>
              <input 
                type="number" 
                step="any"
                value={newCapture.lat}
                onChange={e => setNewCapture({...newCapture, lat: parseFloat(e.target.value)})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Longitude</label>
              <input 
                type="number" 
                step="any"
                value={newCapture.lng}
                onChange={e => setNewCapture({...newCapture, lng: parseFloat(e.target.value)})}
                className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Contato do Cliente</label>
            <input 
              required
              type="text" 
              value={newCapture.clientContact}
              onChange={e => setNewCapture({...newCapture, clientContact: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Scripts / Roteiro</label>
            <textarea 
              value={newCapture.script}
              onChange={e => setNewCapture({...newCapture, script: e.target.value})}
              className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 h-24"
              placeholder="Descreva os scripts ou roteiro para esta captação..."
            />
          </div>
          <button type="submit" className="w-full py-4 rounded-xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow hover:scale-[0.98] transition-transform mt-4">
            Criar Ordem
          </button>
        </form>
      </Modal>
    </div>
  );
}

function PlacesAutocomplete({ onSelect, defaultValue }: { onSelect: (address: string, lat: number, lng: number) => void, defaultValue: string }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here */
    },
    debounce: 300,
    defaultValue
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(address, lat, lng);
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  return (
    <Combobox onSelect={handleSelect}>
      <ComboboxInput
        value={value}
        onChange={handleInput}
        disabled={!ready}
        className="w-full bg-surface-highest ghost-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        placeholder="Pesquisar endereço no Google Maps..."
      />
      <ComboboxPopover className="z-[1000] bg-surface-high border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl">
        <ComboboxList>
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption 
                key={place_id} 
                value={description} 
                className="px-4 py-3 text-xs text-white hover:bg-white/5 cursor-pointer transition-colors"
              />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
}
