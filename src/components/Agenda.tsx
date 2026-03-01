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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
          <p className="text-white/40 text-sm">Agenda de trabajos programados</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-ili-card border border-white/5 rounded-xl p-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 text-xs font-bold uppercase tracking-wider hover:bg-white/5 rounded-lg transition-colors">Hoy</button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Programar
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-bold uppercase text-white/20 tracking-widest py-2">
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
      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        {calendarDays.map((day, i) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={i} 
              className={cn(
                "min-h-[120px] p-2 transition-colors flex flex-col gap-1",
                isCurrentMonth ? "bg-ili-card/50" : "bg-ili-dark/30 opacity-30",
                isToday && "bg-ili-cyan/5"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                  isToday ? "bg-ili-cyan text-ili-dark" : "text-white/40"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                {dayEvents.map(event => (
                  <div 
                    key={event.id} 
                    className={cn(
                      "text-[10px] p-1.5 rounded-lg border truncate cursor-pointer hover:scale-[1.02] transition-transform",
                      event.type === 'Visita' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-ili-cyan/10 border-ili-cyan/20 text-ili-cyan"
                    )}
                  >
                    <span className="font-bold">{format(new Date(event.start_time), 'HH:mm')}</span> {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-card p-8">
      {renderHeader()}
      {renderDays()}
      {renderCells()}

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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass-card p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Programar Trabajo</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Cliente</label>
                  <select 
                    required
                    className="input-field w-full"
                    value={newEvent.client_id}
                    onChange={e => setNewEvent({...newEvent, client_id: e.target.value})}
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Título / Motivo</label>
                  <input 
                    required
                    type="text"
                    className="input-field w-full" 
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Inicio</label>
                    <input 
                      required
                      type="datetime-local"
                      className="input-field w-full text-xs" 
                      value={newEvent.start_time}
                      onChange={e => setNewEvent({...newEvent, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Fin</label>
                    <input 
                      required
                      type="datetime-local"
                      className="input-field w-full text-xs" 
                      value={newEvent.end_time}
                      onChange={e => setNewEvent({...newEvent, end_time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Tipo de Trabajo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Visita', 'Mantenimiento'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewEvent({...newEvent, type: t as any})}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold transition-all",
                          newEvent.type === t ? "bg-ili-cyan text-ili-dark" : "bg-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-3 mt-4">Guardar en Agenda</button>
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
