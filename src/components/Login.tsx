import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { User } from '../types';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const user = await response.json();
        onLogin(user);
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ili-dark flex items-center justify-center p-4 selection:bg-ili-cyan/30 selection:text-ili-cyan mesh-bg">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-ili-cyan/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.07, 0.05],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 md:p-10 border-white/10 shadow-2xl backdrop-blur-3xl">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex p-5 bg-ili-cyan/10 text-ili-cyan rounded-3xl mb-6 shadow-lg shadow-ili-cyan/20 border border-ili-cyan/20 animate-float"
            >
              <Shield size={48} className="glow-text" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter glow-text">SISTEMA ILI</h1>
            <p className="text-zinc-500 mt-3 font-bold uppercase tracking-[0.2em] text-[10px]">Gestión de Refrigeración y Mantenimiento</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="label-caps">Usuario</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-ili-cyan transition-colors" size={18} />
                <input
                  type="text"
                  required
                  className="input-field w-full pl-12"
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-caps">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-ili-cyan transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="input-field w-full pl-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold text-center uppercase tracking-wider"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-3 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-600 font-medium">
              ¿Olvidaste tu contraseña? Contacta al administrador.
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-zinc-700 text-[10px] font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} ILI Refrigeración • v2.0
        </p>
      </motion.div>
    </div>
  );
}
