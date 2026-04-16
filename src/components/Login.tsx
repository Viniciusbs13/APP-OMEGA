import React from 'react';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { LogIn, ShieldCheck } from 'lucide-react';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-surface-lowest flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-panel p-12 rounded-[2.5rem] ghost-border space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto ghost-border">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-headline font-bold text-white uppercase tracking-tight">ASSESSORIA OMEGA</h1>
            <p className="text-on-surface-variant text-xs font-label uppercase tracking-widest">Portal de Gestão Estratégica</p>
          </div>
        </div>

        <div className="pt-8">
          <button 
            onClick={handleLogin}
            className="w-full py-4 rounded-2xl bg-white text-on-primary font-bold uppercase tracking-widest signature-glow hover:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <LogIn size={20} />
            Entrar com Google
          </button>
        </div>

        <p className="text-[10px] text-neutral-600 uppercase tracking-widest">
          Acesso restrito a colaboradores autorizados
        </p>
      </div>
    </div>
  );
}
