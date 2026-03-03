import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Plus, User as UserIcon, MessageSquare, ArrowRight, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Client, User } from '../types';

export const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    client_id: '', 
    description: '', 
    priority: 'Media', 
    type: 'Espontáneo',
    technician_name: JSON.parse(localStorage.getItem('ili_user') || '{}').username || 'Adrian' 
  });
  const [showBudgetPrompt, setShowBudgetPrompt] = useState<{ taskId: number, clientId: number } | null>(null);
  const [activeTab, setActiveTab] = useState('Pendiente');

  useEffect(() => {
    fetchTasks();
    fetch('/api/clients').then(res => res.json()).then(setClients);
    fetch('/api/users').then(res => res.json()).then(setUsers);
  }, []);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setNewTask({ client_id: '', description: '', priority: 'Media' });
      fetchTasks();
    }
  };

  const updateTask = async (id: number, updates: any, clientId?: number) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      fetchTasks();
      if (updates.status === 'Finalizado' && clientId) {
        setShowBudgetPrompt({ taskId: id, clientId });
      }
    }
  };

  const columns = [
    { id: 'Pendiente', label: 'Pendientes', icon: Clock, color: 'text-yellow-400' },
    { id: 'En Proceso', label: 'En Proceso', icon: AlertCircle, color: 'text-ili-cyan' },
    { id: 'Finalizado', label: 'Finalizados', icon: CheckCircle2, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Pendientes</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={18} /> <span className="hidden sm:inline">Nueva Tarea</span>
        </button>
      </div>

      {/* Mobile Tabs */}
      <div className="flex lg:hidden bg-ili-card border border-white/5 rounded-xl p-1">
        {columns.map(col => (
          <button
            key={col.id}
            onClick={() => setActiveTab(col.id)}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
              activeTab === col.id ? "bg-ili-cyan text-ili-dark" : "text-white/40"
            )}
          >
            {col.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[calc(100vh-16rem)]">
        {columns.map(col => (
          <div 
            key={col.id} 
            className={cn(
              "flex flex-col overflow-hidden",
              activeTab !== col.id && "hidden lg:flex"
            )}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg bg-white/5", col.color)}>
                  <col.icon size={16} />
                </div>
                <h3 className="font-bold uppercase text-xs tracking-widest text-zinc-400">{col.label}</h3>
              </div>
              <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md text-[10px] font-black border border-white/5">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {tasks.filter(t => t.status === col.id).map(task => (
                <motion.div 
                  layoutId={`task-${task.id}`}
                  key={task.id} 
                  className="p-5 glass-card group hover:border-ili-cyan/30 transition-all cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-ili-cyan uppercase tracking-widest">{task.client_name}</span>
                        <span className="text-[9px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-white/5 font-mono">{task.ticket_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon size={10} className="text-zinc-600" />
                        <select 
                          className="bg-transparent text-[10px] text-zinc-500 font-medium outline-none border-none p-0 cursor-pointer hover:text-ili-cyan transition-colors appearance-none"
                          value={task.technician_name || ''}
                          onChange={(e) => updateTask(task.id, { technician_name: e.target.value })}
                        >
                          <option value="">Sin asignar</option>
                          {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                        </select>
                        <span className="text-[10px] text-zinc-700">•</span>
                        <span className="text-[10px] text-zinc-500 font-medium italic">{task.type}</span>
                      </div>
                    </div>
                    <div className="relative group/select">
                      <select 
                        className={cn(
                          "text-[10px] font-black px-2.5 py-1 rounded-lg outline-none border border-white/5 cursor-pointer transition-all appearance-none text-center min-w-[90px]",
                          task.status === 'Pendiente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          task.status === 'En Proceso' ? 'bg-ili-cyan/10 text-ili-cyan border-ili-cyan/20' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        )}
                        value={task.status}
                        onChange={(e) => updateTask(task.id, { status: e.target.value }, task.client_id)}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                    </div>
                  </div>
                  
                  <p className="text-sm text-zinc-300 leading-relaxed mb-5 font-medium">{task.description}</p>
                  
                  {task.budget_number && (
                    <div className="mb-5 p-2.5 bg-ili-cyan/5 border border-ili-cyan/10 rounded-xl flex items-center gap-2 text-[10px] font-bold text-ili-cyan">
                      <FileText size={14} />
                      VINCULADO: {task.budget_number}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">{new Date(task.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        task.priority === 'Alta' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                        task.priority === 'Media' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                        'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                      )} />
                      <select 
                        className={cn(
                          "text-[10px] font-black bg-transparent outline-none border-none cursor-pointer uppercase tracking-widest",
                          task.priority === 'Alta' ? 'text-red-400' : 
                          task.priority === 'Media' ? 'text-amber-400' : 'text-blue-400'
                        )}
                        value={task.priority}
                        onChange={(e) => updateTask(task.id, { priority: e.target.value })}
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="glass-card p-12 text-center border-dashed border-white/5">
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Sin tareas</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 shadow-2xl border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Nuevo Ticket</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Completa los detalles del servicio</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="label-caps">Cliente</label>
                  <select 
                    required
                    className="input-field w-full appearance-none"
                    value={newTask.client_id}
                    onChange={e => setNewTask({...newTask, client_id: e.target.value})}
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Descripción del Trabajo</label>
                  <textarea 
                    required
                    rows={3}
                    className="input-field w-full resize-none" 
                    placeholder="¿Qué trabajo se debe realizar?"
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="label-caps">Tipo de Ticket</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Espontáneo', 'Programado', 'Presupuestado'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewTask({...newTask, type: t as any})}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          newTask.type === t 
                            ? "bg-ili-cyan/10 text-ili-cyan border-ili-cyan/30" 
                            : "bg-zinc-900 text-zinc-500 border-white/5 hover:bg-zinc-800"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="label-caps">Prioridad</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Baja', 'Media', 'Alta'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewTask({...newTask, priority: p})}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          newTask.priority === p 
                            ? p === 'Alta' ? "bg-red-500/10 text-red-400 border-red-500/30" :
                              p === 'Media' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                              "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-zinc-900 text-zinc-500 border-white/5 hover:bg-zinc-800"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Técnico Asignado</label>
                  <select 
                    className="input-field w-full appearance-none"
                    value={newTask.technician_name}
                    onChange={e => setNewTask({...newTask, technician_name: e.target.value})}
                  >
                    <option value="">Seleccionar Técnico</option>
                    {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                  </select>
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-sm uppercase tracking-widest mt-4">
                  Generar Ticket
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Budget Prompt Modal */}
      <AnimatePresence>
        {showBudgetPrompt && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBudgetPrompt(null)}
              className="absolute inset-0 bg-ili-dark/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm glass-card p-8 text-center"
            >
              <button 
                onClick={() => setShowBudgetPrompt(null)}
                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">¡Trabajo Finalizado!</h3>
              <p className="text-white/60 mb-8 text-sm">¿Deseas generar el remito/presupuesto de este trabajo ahora?</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    window.location.href = `/presupuestos/nuevo?clientId=${showBudgetPrompt.clientId}&taskId=${showBudgetPrompt.taskId}`;
                  }}
                  className="btn-primary py-3"
                >
                  Sí, Generar Ahora
                </button>
                <button 
                  onClick={() => setShowBudgetPrompt(null)}
                  className="py-3 text-white/40 hover:text-white transition-colors"
                >
                  Quizás más tarde
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
