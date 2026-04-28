/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Production from './components/Production';
import Results from './components/Results';
import Clients from './components/Clients';
import Strategy from './components/Strategy';
import Capture from './components/Capture';
import ManagerView from './components/ManagerView';
import Login from './components/Login';
import Toast from './components/ui/Toast';
import { DataProvider, useData } from './context/DataContext';
import { LogOut, Clock, ShieldAlert } from 'lucide-react';
import { signOut, auth } from './lib/firebase';

function AppContent() {
  const { user, loading, toast, hideToast, userStatus } = useData();
  const [activeView, setActiveView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-lowest flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (userStatus === 'pending') {
    return (
      <div className="min-h-screen bg-surface-lowest flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 animate-pulse">
          <ShieldAlert size={40} className="text-amber-500" />
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight text-balance">Acesso Restrito</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Esta é uma área privada da <strong>Assessoria Omega</strong>. O seu acesso ainda não foi autorizado por um administrador.
          </p>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs text-on-surface-variant italic">
            Se você é um novo colaborador, solicite ao CEO que libere seu acesso enviando seu e-mail de login.
          </div>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs"
        >
          <LogOut size={16} /> Sair da Conta
        </button>
      </div>
    );
  }

  if (userStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-surface-lowest flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight">Acesso Recusado</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Sua solicitação de acesso foi recusada. Entre em contato com a administração caso acredite que isso seja um erro.
          </p>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs"
        >
          <LogOut size={16} /> Sair da Conta
        </button>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'manager':
        return <ManagerView />;
      case 'sales':
        return <Sales />;
      case 'capture':
        return <Capture />;
      case 'production':
        return <Production />;
      case 'results':
        return <Results />;
      case 'clients':
        return <Clients />;
      case 'strategy':
        return <Strategy />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout activeView={activeView} setActiveView={setActiveView}>
        {renderView()}
      </Layout>
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
