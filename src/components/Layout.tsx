import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  User, 
  Menu, 
  Bell, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  ArrowRight, 
  Download, 
  Settings, 
  Building2, 
  Calendar, 
  BarChart3, 
  StickyNote, 
  BellRing, 
  TrendingUp, 
  TrendingDown, 
  Timer, 
  AlertTriangle, 
  Hourglass, 
  Building, 
  Zap, 
  Target, 
  Brain, 
  CheckCircle, 
  X, 
  History, 
  FlaskConical, 
  Layout as LayoutIcon, 
  Globe, 
  MessageSquare, 
  CheckCircle2, 
  Lock, 
  ShieldCheck,
  Send, 
  Upload, 
  ChevronsLeft, 
  Layers, 
  FileText, 
  Film, 
  Camera, 
  Play, 
  CheckCheck, 
  ChevronDown, 
  Maximize, 
  MapPin, 
  UserCheck, 
  Cloud, 
  Bot, 
  LineChart, 
  Sparkles, 
  BadgeCheck, 
  Store, 
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Re-mapping some icons to match the Material Symbols used in the HTML
const Icons = {
  Dashboard: LayoutDashboard,
  Clients: Users,
  Tasks: ClipboardList,
  Profile: User,
  Menu: Menu,
  Notifications: Bell,
  Search: Search,
  Filter: Filter,
  Plus: Plus,
  ChevronRight: ChevronRight,
  ArrowRight: ArrowRight,
  Download: Download,
  Settings: Settings,
  Groups: Users,
  Architecture: Building2,
  Calendar: Calendar,
  Analytics: BarChart3,
  Planning: StickyNote,
  Alerts: BellRing,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  Timer: Timer,
  Warning: AlertTriangle,
  Hourglass: Hourglass,
  Corporate: Building,
  Bolt: Zap,
  Target: Target,
  Psychology: Brain,
  CheckCircle: CheckCircle,
  Cancel: X,
  History: History,
  Biotech: FlaskConical,
  Split: LayoutIcon,
  Web: Globe,
  Chat: MessageSquare,
  Verified: CheckCircle2,
  Lock: Lock,
  Send: Send,
  Upload: Upload,
  FirstPage: ChevronsLeft,
  Layers: Layers,
  FileDownload: Download,
  CloudUpload: Upload,
  Movie: Film,
  Camera: Camera,
  Description: FileText,
  Play: Play,
  DoneAll: CheckCheck,
  ArrowDown: ChevronDown,
  Fullscreen: Maximize,
  Location: MapPin,
  CheckIn: UserCheck,
  CloudIcon: Cloud,
  Robot: Bot,
  Stats: LineChart,
  AI: Sparkles,
  Badge: BadgeCheck,
  Store: Store,
  Apartment: Building,
  Health: Stethoscope,
  ChevronRightSmall: ChevronRight
};

import { useData } from '../context/DataContext';
import { UserRole } from '../types';
import { signOut, auth } from '../lib/firebase';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Layout({ children, activeView, setActiveView }: LayoutProps) {
  const { userRole, setUserRole, user } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut(auth);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'manager', label: 'Gestor', icon: Icons.CheckIn, roles: ['CEO', 'Vendedor', 'RH'] },
    { id: 'sales', label: 'Vendas', icon: Icons.Store, roles: ['CEO', 'Vendedor'] },
    { id: 'capture', label: 'Captação', icon: Icons.Camera, roles: ['CEO', 'Vendedor', 'Colaborador'] },
    { id: 'production', label: 'Produção', icon: Icons.Movie, roles: ['CEO', 'Colaborador', 'RH'] },
    { id: 'results', label: 'Resultados', icon: Icons.Analytics, roles: ['CEO', 'RH'] },
    { id: 'clients', label: 'Portfolio', icon: Icons.Groups, roles: ['CEO', 'RH'] },
    { id: 'strategy', label: 'Estratégia', icon: Icons.Target, roles: ['CEO', 'Vendedor', 'Colaborador'] },
  ].filter(item => !item.roles || item.roles.includes(userRole));

  return (
    <div className="flex min-h-screen bg-surface-lowest text-on-surface font-body">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col h-screen w-72 bg-surface py-8 px-6 gap-4 sticky top-0 rounded-r-[2rem] shadow-2xl shadow-white/5 z-40">
          <div className="flex flex-col mb-8 px-2">
            <span className="text-white uppercase tracking-[0.2em] font-label text-[10px] mb-6">ASSESSORIA OMEGA</span>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-highest overflow-hidden ghost-border">
                <img 
                  className="w-full h-full object-cover" 
                  src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCCO1vcL3ZFFRKC_o-Sg61-cRVy765R_BChZYBvU4XXIlziwcPOysSJ-DvpGoYc9B73WG8Xm5g8Oa02UxL_ZkUsG20ymTF8nDPoIcQvMqNRpt4ge-BlJmgk6GIfJqRuUo53xCiay_wsnE0dmt4dWUMzl4yo9AopSnryCyFOGr8oNH7qDPlhwO2zvmJ0IiKpkuhJwi4UrCViOfK4DjNyeogU-Li2p7YCSGbHFlQSZmThoqiVgjCdfR9496pSXzCjilgFoj2U4Z1TWlnQ"} 
                  alt="Profile"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold leading-tight truncate max-w-[120px]">{user?.displayName || "Usuário"}</span>
                <span className="text-neutral-500 text-[10px] uppercase tracking-widest">{userRole}</span>
              </div>
            </div>
          </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                activeView === item.id 
                  ? 'bg-white/5 text-white border-l-2 border-white' 
                  : 'text-neutral-500 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'fill-current' : ''} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 text-neutral-600 font-label text-[10px] tracking-widest uppercase">
          V0.1-Alpha
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Top Bar */}
        <header className="fixed top-0 right-0 left-0 lg:left-72 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-8 h-16 shadow-[0_8px_32px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-white p-2 hover:bg-white/5 rounded-full transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Icons.Menu size={20} />
            </button>
            <h1 className="text-xl font-bold tracking-tighter text-white font-headline uppercase">ASSESSORIA OMEGA</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-8 text-sm font-label uppercase tracking-widest">
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`transition-colors duration-300 ${activeView === 'dashboard' ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveView('clients')}
                className={`transition-colors duration-300 ${activeView === 'clients' ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
              >
                Portfolio
              </button>
              <button 
                onClick={() => setActiveView('strategy')}
                className={`transition-colors duration-300 ${activeView === 'strategy' ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
              >
                Network
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                <ShieldCheck size={14} className={userRole === 'CEO' ? 'text-blue-400' : userRole === 'Colaborador' ? 'text-neutral-500' : 'text-emerald-400'} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">{userRole}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-neutral-500 hover:text-red-400 p-2 hover:bg-white/5 rounded-full transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
              <div className="w-8 h-8 rounded-full border border-white/20 p-0.5 cursor-pointer active:scale-95 transition-transform overflow-hidden">
                <img 
                  className="w-full h-full rounded-full object-cover" 
                  src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCepsfdzlr_DKOpggHtohMXWd0kblEaZC9x484YhiUFdY5d4fOeqfezjv-KX68kYIVXXx35Ysn55TiPQx-J0hwkPgWlBRqREBKP8yNAO83Szlp83MjwFyYKASK7D9dlbeD6FkwdkOyETQqa5CV9D1ASywIll1wQ8mLVrLqx5LWA3ZeL8YauRLBNd_P5mlxz7mHpUlkaIaWCmHY8-vu_N-ZDhcQLZ_Z6e75Pfgr7iEnbVgqURWeZJzSlAt9p1RmumgYQhOQUcJEKQeBv"} 
                  alt="User"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="mt-16 p-6 md:p-12 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Nav (Mobile) */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full h-20 bg-surface/90 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center px-6 pb-8 pt-4 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-50">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${
                activeView === item.id 
                  ? 'bg-white text-surface-lowest rounded-full px-6 py-2 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                  : 'text-neutral-500 hover:text-neutral-200'
              }`}
            >
              <item.icon size={activeView === item.id ? 18 : 20} className={activeView === item.id ? 'fill-current' : ''} />
              <span className="font-label uppercase text-[9px] tracking-widest mt-0.5">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-surface z-[70] lg:hidden p-8 flex flex-col gap-8 rounded-r-[2rem]"
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-headline font-bold text-xl uppercase tracking-tighter">ASSESSORIA OMEGA</span>
                <button onClick={() => setIsSidebarOpen(false)} className="text-white">
                  <Icons.Plus className="rotate-45" />
                </button>
              </div>
              
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                      activeView === item.id 
                        ? 'bg-white/10 text-white border-l-4 border-white' 
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={24} />
                    <span className="font-medium text-lg">{item.label}</span>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
