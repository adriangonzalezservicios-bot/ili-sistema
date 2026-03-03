import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgendaEvent, Client } from '../types';

export const Agenda = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ client_id: '', title: '', description: '', start_time: '', end_time: '', type: 'Visita' });

  useEffect(() => {
    fetchEvents();
    fetch('/api/clients').then(res => res.json()).then(setClients);
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('/api/agenda');
    const data = await res.json();
    setEvents(data);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setNewEvent({ client_id: '', title: '', description: '', start_time: '', end_time: '', type: 'Visita' });
      fetchEvents();
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 px-1">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Gestión de trabajos programados</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-zinc-900 border border-white/5 rounded-xl p-1 shadow-inner">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())} 
              className="px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-ili-cyan transition-colors"
            >
              Hoy
            </button>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm flex-1 md:flex-none justify-center">
            <Plus size={18} /> <span className="uppercase tracking-widest">Programar</span>
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] py-2">
            {day}
          </div>
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
      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {calendarDays.map((day, i) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={i} 
              className={cn(
                "min-h-[140px] p-3 transition-all duration-300 flex flex-col gap-2 relative group",
                isCurrentMonth ? "bg-zinc-900/40" : "bg-zinc-950/20 opacity-30",
                isToday && "bg-ili-cyan/[0.03]"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  "text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                  isToday 
                    ? "bg-ili-cyan text-ili-dark shadow-lg shadow-ili-cyan/20" 
                    : isCurrentMonth ? "text-zinc-400 group-hover:text-white" : "text-zinc-700"
                )}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-ili-cyan shadow-[0_0_8px_rgba(0,242,234,0.5)]" />
                )}
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[90px] custom-scrollbar">
                {dayEvents.map(event => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={event.id} 
                    className={cn(
                      "text-[9px] font-bold p-2 rounded-lg border transition-all cursor-pointer hover:brightness-110 active:scale-95",
                      event.type === 'Visita' 
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                        : "bg-ili-cyan/10 border-ili-cyan/20 text-ili-cyan"
                    )}
                  >
                    <div className="flex items-center gap-1 mb-0.5 opacity-60">
                      <Clock size={8} />
                      <span>{format(new Date(event.start_time), 'HH:mm')}</span>
                    </div>
                    <div className="truncate">{event.title}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 md:p-10">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      {/* Create Event Modal */}
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
                  <h3 className="text-2xl font-bold text-white tracking-tight">Programar Trabajo</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Añade un nuevo evento al calendario</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-6">
                <div className="space-y-2">
                  <label className="label-caps">Cliente</label>
                  <select 
                    required
                    className="input-field w-full appearance-none"
                    value={newEvent.client_id}
                    onChange={e => setNewEvent({...newEvent, client_id: e.target.value})}
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Título / Motivo</label>
                  <input 
                    required
                    type="text"
                    placeholder="Ej: Mantenimiento Preventivo"
                    className="input-field w-full" 
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="label-caps">Inicio</label>
                    <input 
                      required
                      type="datetime-local"
                      className="input-field w-full text-xs" 
                      value={newEvent.start_time}
                      onChange={e => setNewEvent({...newEvent, start_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Fin</label>
                    <input 
                      required
                      type="datetime-local"
                      className="input-field w-full text-xs" 
                      value={newEvent.end_time}
                      onChange={e => setNewEvent({...newEvent, end_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="label-caps">Tipo de Trabajo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Visita', 'Mantenimiento'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewEvent({...newEvent, type: t as any})}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          newEvent.type === t 
                            ? t === 'Visita' ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-ili-cyan/10 text-ili-cyan border-ili-cyan/30"
                            : "bg-zinc-900 text-zinc-500 border-white/5 hover:bg-zinc-800"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-sm uppercase tracking-widest mt-4">
                  Guardar en Agenda
                </button>
              </form>
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
