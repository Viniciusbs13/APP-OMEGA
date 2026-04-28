import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { ShieldCheck, LogIn, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Login() {
  const { showToast } = useData();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const handleLogin = async (isAuto = false) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      
      if (!isAuto) {
        if (error.code === 'auth/popup-closed-by-user') {
          showToast('Login cancelado. Por favor, conclua na janela do Google.', 'info');
        } else if (error.code === 'auth/popup-blocked') {
          showToast('O navegador bloqueou o pop-up. Clique no botão para entrar.', 'error');
        } else {
          showToast('Erro ao entrar. Verifique sua conexão.', 'error');
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!attempted) {
      setAttempted(true);
      // Small delay to ensure UI is ready, then try auto-login
      const timer = setTimeout(() => handleLogin(true), 800);
      return () => clearTimeout(timer);
    }
  }, [attempted]);

  return (
    <div className="min-h-screen bg-surface-lowest flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-12 animate-in fade-in zoom-in duration-700">
        <div className="space-y-6">
          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto ghost-border shadow-2xl">
            <ShieldCheck size={48} className="text-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold text-white tracking-tighter uppercase italic">
              Assessoria <span className="text-white/40">Omega</span>
            </h1>
            <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.3em] font-bold">
              Gestão de Alta Performance
            </p>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={() => handleLogin(false)}
            disabled={isLoggingIn}
            className={`group relative w-full py-6 rounded-2xl bg-white text-on-primary font-bold uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-4 ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoggingIn ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <LogIn size={24} className="group-hover:translate-x-1 transition-transform" />
            )}
            <span>{isLoggingIn ? 'Sincronizando...' : 'Entrar Agora'}</span>
          </button>
          
          <p className="mt-8 text-[9px] text-white/20 uppercase tracking-widest font-medium">
            Sistema de Acesso Restrito
          </p>
        </div>
      </div>
    </div>
  );
}

