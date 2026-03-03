import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, User as UserIcon, Trash2, Key, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'technician'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowForm(false);
        setFormData({ username: '', password: '', role: 'technician' });
        fetchUsers();
      } else {
        const err = await response.json();
        alert(err.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (response.ok) fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Gestión de Usuarios</h2>
          <p className="text-white/40 text-sm">Administra los accesos de técnicos y administradores</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus size={20} />
          Nuevo Técnico
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <motion.div 
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 group hover:border-ili-cyan/30"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-ili-cyan/10 text-ili-cyan rounded-2xl flex items-center justify-center">
                <UserIcon size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                user.role === 'admin' 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                  : 'bg-ili-cyan/10 text-ili-cyan border-ili-cyan/20'
              }`}>
                {user.role === 'admin' ? 'Administrador' : 'Técnico'}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{user.username}</h3>
            <p className="text-xs text-white/30 mb-6">
              Miembro desde: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
            
            <div className="flex gap-3 pt-6 border-t border-white/5">
              <button 
                onClick={() => alert('Próximamente: Restablecimiento de contraseña.')}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-ili-cyan transition-colors"
              >
                <Key size={14} />
                Reset Pass
              </button>
              {user.username !== 'admin' && (
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative glass-card max-w-md w-full p-8 border-ili-cyan/20"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-white">Crear Acceso</h3>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Nombre de Usuario</label>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="ej: adrian_tecnico"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Contraseña</label>
                  <input
                    type="password"
                    required
                    className="input-field w-full"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Rol / Permisos</label>
                  <select
                    className="input-field w-full appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'technician' })}
                  >
                    <option value="technician" className="bg-ili-card">Técnico (Acceso limitado)</option>
                    <option value="admin" className="bg-ili-card">Administrador (Acceso total)</option>
                  </select>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary text-sm"
                  >
                    Crear Cuenta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
