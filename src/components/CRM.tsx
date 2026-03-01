import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Phone, MapPin, History, ChevronRight, X, FileText, Users, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Task, Budget } from '../types';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export const CRM = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', cuit: '', address: '', phone: '', contact_person: '' });
  const [clientHistory, setClientHistory] = useState<{ tasks: Task[], budgets: Budget[] }>({ tasks: [], budgets: [] });
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyPortalLink = (id: number) => {
    const link = `${window.location.origin}/portal/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(data);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setNewClient({ name: '', cuit: '', address: '', phone: '', contact_person: '' });
      fetchClients();
    }
  };

  const viewClientDetails = async (client: Client) => {
    setSelectedClient(client);
    const res = await fetch(`/api/portal/${client.id}`);
    const data = await res.json();
    setClientHistory({ tasks: data.tasks, budgets: data.budgets });
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cuit?.includes(searchTerm)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 h-auto lg:h-[calc(100vh-12rem)]">
      {/* Client List */}
      <div className={cn(
        "lg:col-span-1 glass-card flex flex-col overflow-hidden",
        selectedClient && "hidden lg:flex"
      )}>
        <div className="p-4 md:p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Clientes</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-ili-cyan/10 text-ili-cyan rounded-lg hover:bg-ili-cyan/20"
            >
              <UserPlus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-ili-dark/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-ili-cyan outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 max-h-[400px] lg:max-h-none">
          {filteredClients.map(client => (
            <button
              key={client.id}
              onClick={() => viewClientDetails(client)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group",
                selectedClient?.id === client.id ? "bg-ili-cyan text-ili-dark" : "hover:bg-white/5"
              )}
            >
              <div className="truncate pr-4">
                <h4 className="font-semibold text-sm md:text-base truncate">{client.name}</h4>
                <p className={cn(
                  "text-[10px] md:text-xs",
                  selectedClient?.id === client.id ? "text-ili-dark/60" : "text-white/40"
                )}>
                  {client.contact_person || 'Sin contacto'}
                </p>
              </div>
              <ChevronRight size={18} className={selectedClient?.id === client.id ? 'text-ili-dark/40' : 'text-white/20'} />
            </button>
          ))}
        </div>
      </div>

      {/* Client Detail */}
      <div className={cn(
        "lg:col-span-2 glass-card overflow-hidden flex flex-col",
        !selectedClient && "hidden lg:flex"
      )}>
        {selectedClient ? (
          <div className="flex flex-col h-full">
            <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-br from-ili-cyan/5 to-transparent relative">
              <button 
                onClick={() => setSelectedClient(null)}
                className="lg:hidden absolute top-4 right-4 p-2 text-white/40"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{selectedClient.name}</h2>
                  <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-white/60">
                    <span className="flex items-center gap-1"><Phone size={14} /> {selectedClient.phone || 'N/A'}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {selectedClient.address || 'N/A'}</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded">CUIT: {selectedClient.cuit || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button className="btn-primary text-xs md:text-sm flex-1 md:flex-none">Editar</button>
                  <button 
                    onClick={() => copyPortalLink(selectedClient.id)}
                    className="px-4 py-2 bg-white/5 rounded-xl text-xs md:text-sm font-semibold hover:bg-white/10 flex-1 md:flex-none flex items-center justify-center gap-2"
                  >
                    {copiedId === selectedClient.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copiedId === selectedClient.id ? 'Copiado' : 'Copiar Link'}
                  </button>
                  <a 
                    href={`/portal/${selectedClient.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* History Tasks */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <History size={20} className="text-ili-cyan" />
                  Servicios Realizados
                </h3>
                <div className="space-y-3">
                  {clientHistory.tasks.map(task => (
                    <div key={task.id} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          task.status === 'Finalizado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {task.status}
                        </span>
                        <span className="text-[10px] text-white/40">{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{task.description}</p>
                    </div>
                  ))}
                  {clientHistory.tasks.length === 0 && <p className="text-white/20 text-sm italic">No hay historial de servicios.</p>}
                </div>
              </div>

              {/* History Budgets */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-blue-400" />
                  Presupuestos Enviados
                </h3>
                <div className="space-y-3">
                  {clientHistory.budgets.map(budget => (
                    <div key={budget.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-sm">{budget.budget_number}</h4>
                        <p className="text-xs text-white/40">{new Date(budget.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-ili-cyan">${budget.total.toLocaleString()}</p>
                        <button className="text-[10px] text-white/40 hover:text-ili-cyan underline">Ver PDF</button>
                      </div>
                    </div>
                  ))}
                  {clientHistory.budgets.length === 0 && <p className="text-white/20 text-sm italic">No hay presupuestos registrados.</p>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <Users size={64} strokeWidth={1} className="mb-4" />
            <p>Selecciona un cliente para ver su ficha completa</p>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
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
                <h3 className="text-2xl font-bold">Nuevo Cliente</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Nombre / Razón Social</label>
                  <input 
                    required
                    type="text" 
                    className="input-field w-full" 
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase mb-1 block">CUIT</label>
                    <input 
                      type="text" 
                      className="input-field w-full" 
                      value={newClient.cuit}
                      onChange={e => setNewClient({...newClient, cuit: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Teléfono</label>
                    <input 
                      type="text" 
                      className="input-field w-full" 
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Dirección</label>
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    value={newClient.address}
                    onChange={e => setNewClient({...newClient, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Contacto Principal</label>
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    value={newClient.contact_person}
                    onChange={e => setNewClient({...newClient, contact_person: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-3 mt-4">Guardar Cliente</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
