import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Plus, User, MessageSquare, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Client } from '../types';

export const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ client_id: '', description: '', priority: 'Media', technician_name: localStorage.getItem('ili_tech') || 'Adrian' });
  const [showBudgetPrompt, setShowBudgetPrompt] = useState<{ taskId: number, clientId: number } | null>(null);
  const [activeTab, setActiveTab] = useState('Pendiente');

  useEffect(() => {
    fetchTasks();
    fetch('/api/clients').then(res => res.json()).then(setClients);
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

  const updateStatus = async (id: number, status: string, clientId: number) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchTasks();
      if (status === 'Finalizado') {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-16rem)]">
        {columns.map(col => (
          <div 
            key={col.id} 
            className={cn(
              "glass-card flex flex-col overflow-hidden bg-white/[0.02]",
              activeTab !== col.id && "hidden lg:flex"
            )}
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <col.icon size={18} className={col.color} />
                <h3 className="font-bold uppercase text-xs tracking-wider">{col.label}</h3>
              </div>
              <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px] lg:max-h-none">
              {tasks.filter(t => t.status === col.id).map(task => (
                <motion.div 
                  layoutId={`task-${task.id}`}
                  key={task.id} 
                  className="p-4 bg-ili-card border border-white/5 rounded-xl shadow-lg group hover:border-ili-cyan/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-ili-cyan uppercase tracking-widest">{task.client_name}</span>
                      <span className="text-[9px] text-white/30 italic">Téc: {task.technician_name || 'Sin asignar'}</span>
                    </div>
                    <div className="flex gap-1">
                      {col.id !== 'Finalizado' && (
                        <button 
                          onClick={() => updateStatus(task.id, col.id === 'Pendiente' ? 'En Proceso' : 'Finalizado', task.client_id)}
                          className="p-1.5 bg-ili-cyan/10 text-ili-cyan rounded-lg hover:bg-ili-cyan/20 transition-colors"
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-white/80 mb-4">{task.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-white/30">
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded",
                      task.priority === 'Alta' ? 'bg-red-500/10 text-red-400' : 
                      task.priority === 'Media' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                    )}>
                      {task.priority}
                    </span>
                  </div>
                </motion.div>
              ))}
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="text-center py-8 text-white/10 text-xs italic">Sin tareas</div>
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass-card p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Nueva Tarea</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Cliente</label>
                  <select 
                    required
                    className="input-field w-full"
                    value={newTask.client_id}
                    onChange={e => setNewTask({...newTask, client_id: e.target.value})}
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Descripción del Trabajo</label>
                  <textarea 
                    required
                    rows={3}
                    className="input-field w-full resize-none" 
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Prioridad</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Baja', 'Media', 'Alta'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewTask({...newTask, priority: p})}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold transition-all",
                          newTask.priority === p ? "bg-ili-cyan text-ili-dark" : "bg-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Técnico Asignado</label>
                  <select 
                    className="input-field w-full"
                    value={newTask.technician_name}
                    onChange={e => setNewTask({...newTask, technician_name: e.target.value})}
                  >
                    <option value="Adrian">Adrian</option>
                    <option value="Tecnico 1">Técnico 1</option>
                    <option value="Tecnico 2">Técnico 2</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full py-3 mt-4">Crear Tarea</button>
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
              className="absolute inset-0 bg-ili-dark/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm glass-card p-8 text-center"
            >
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
