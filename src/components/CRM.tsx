import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Phone, MapPin, History, ChevronRight, X, FileText, Users, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Task, Budget } from '../types';
import html2pdf from 'html2pdf.js';

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
  const [loadingBudgetId, setLoadingBudgetId] = useState<number | null>(null);

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

  const generatePDF = async (budgetId: number) => {
    setLoadingBudgetId(budgetId);
    try {
      const res = await fetch(`/api/budgets/${budgetId}`);
      const budget = await res.json();
      
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 40px; font-family: 'Inter', sans-serif; color: #0a0e12; background: white;">
          <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #00f2ea; padding-bottom: 20px; margin-bottom: 30px;">
            <div>
              <h1 style="margin: 0; color: #00f2ea; font-size: 32px; font-weight: 800;">ILI</h1>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">Refrigeración y Mantenimiento</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 18px;">PRESUPUESTO / REMITO</h2>
              <p style="margin: 5px 0; font-weight: bold; color: #00f2ea;">${budget.budget_number}</p>
              <p style="margin: 0; font-size: 12px;">Fecha: ${budget.date}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
            <div>
              <h3 style="font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 10px;">Cliente</h3>
              <p style="margin: 0; font-weight: bold; font-size: 16px;">${budget.client_name || selectedClient?.name}</p>
            </div>
            <div style="text-align: right;">
              <h3 style="font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 10px;">Validez</h3>
              <p style="margin: 0; font-size: 14px;">${budget.validity_days} días</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <thead>
              <tr style="background: #f8f9fa; border-bottom: 1px solid #eee;">
                <th style="text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase;">Descripción</th>
                <th style="text-align: center; padding: 12px; font-size: 12px; text-transform: uppercase;">Cant.</th>
                <th style="text-align: right; padding: 12px; font-size: 12px; text-transform: uppercase;">P. Unit</th>
                <th style="text-align: right; padding: 12px; font-size: 12px; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${budget.items.map((item: any) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px; font-size: 14px;">${item.description}</td>
                  <td style="padding: 12px; text-align: center; font-size: 14px;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right; font-size: 14px;">$${item.unit_price.toLocaleString()}</td>
                  <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: bold;">$${(item.quantity * item.unit_price).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end; margin-bottom: 60px;">
            <div style="width: 250px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Subtotal</span>
                <span>$${budget.subtotal.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #00f2ea; border-top: 1px solid #ddd; padding-top: 10px;">
                <span>TOTAL</span>
                <span>$${budget.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div style="text-align: center;">
              <div style="border-bottom: 1px solid #ccc; height: 80px; margin-bottom: 10px;"></div>
              <p style="margin: 0; font-size: 12px; color: #666;">Firma ILI</p>
            </div>
            <div style="text-align: center;">
              <div style="border-bottom: 1px solid #ccc; height: 80px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
                ${budget.signature_data ? `<img src="${budget.signature_data}" style="max-height: 70px;" />` : ''}
              </div>
              <p style="margin: 0; font-size: 12px; color: #666;">Firma Cliente</p>
            </div>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Presupuesto_${budget.budget_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setLoadingBudgetId(null);
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[calc(100vh-14rem)]">
      {/* Client List */}
      <div className={cn(
        "lg:col-span-1 flex flex-col overflow-hidden",
        selectedClient && "hidden lg:flex"
      )}>
        <div className="mb-6 px-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Clientes</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-2.5 bg-ili-cyan/10 text-ili-cyan rounded-xl hover:bg-ili-cyan/20 transition-all border border-ili-cyan/20"
              aria-label="Agregar cliente"
            >
              <UserPlus size={20} />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-ili-cyan transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o CUIT..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-12"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {filteredClients.map(client => (
            <motion.button
              layoutId={`client-${client.id}`}
              key={client.id}
              onClick={() => viewClientDetails(client)}
              className={cn(
                "w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group border",
                selectedClient?.id === client.id 
                  ? "bg-ili-cyan/10 border-ili-cyan/30 text-ili-cyan" 
                  : "bg-zinc-900/50 border-white/5 hover:bg-white/5 hover:border-white/10"
              )}
            >
              <div className="truncate pr-4">
                <h4 className={cn(
                  "font-bold text-sm truncate transition-colors",
                  selectedClient?.id === client.id ? "text-ili-cyan" : "text-zinc-200 group-hover:text-white"
                )}>
                  {client.name}
                </h4>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest mt-1",
                  selectedClient?.id === client.id ? "text-ili-cyan/60" : "text-zinc-500"
                )}>
                  {client.contact_person || 'Sin contacto'}
                </p>
              </div>
              <ChevronRight size={18} className={cn(
                "transition-transform duration-300",
                selectedClient?.id === client.id ? 'text-ili-cyan translate-x-1' : 'text-zinc-700 group-hover:text-zinc-400'
              )} />
            </motion.button>
          ))}
          {filteredClients.length === 0 && (
            <div className="glass-card p-10 text-center border-dashed border-white/5">
              <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">No se encontraron clientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Client Detail */}
      <div className={cn(
        "lg:col-span-2 glass-card overflow-hidden flex flex-col border-white/10",
        !selectedClient && "hidden lg:flex"
      )}>
        {selectedClient ? (
          <div className="flex flex-col h-full">
            <div className="p-8 md:p-10 border-b border-white/5 bg-gradient-to-br from-ili-cyan/5 via-transparent to-transparent relative">
              <button 
                onClick={() => setSelectedClient(null)}
                className="lg:hidden absolute top-6 right-6 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-ili-cyan bg-ili-cyan/10 px-2.5 py-1 rounded-md uppercase tracking-widest border border-ili-cyan/20">Ficha de Cliente</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-3">{selectedClient.name}</h2>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-400 font-medium">
                    <span className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-xl border border-white/5">
                      <Phone size={14} className="text-ili-cyan" /> {selectedClient.phone || 'N/A'}
                    </span>
                    <span className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-xl border border-white/5">
                      <MapPin size={14} className="text-ili-cyan" /> {selectedClient.address || 'N/A'}
                    </span>
                    <span className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-black text-zinc-600">CUIT</span> {selectedClient.cuit || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => alert('Próximamente: Edición de datos de cliente.')}
                    className="btn-secondary text-xs uppercase tracking-widest flex-1 md:flex-none"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => copyPortalLink(selectedClient.id)}
                    className="btn-secondary text-xs uppercase tracking-widest flex-1 md:flex-none flex items-center justify-center gap-2"
                  >
                    {copiedId === selectedClient.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedId === selectedClient.id ? 'Copiado' : 'Link'}
                  </button>
                  <a 
                    href={`/portal/${selectedClient.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                    title="Ver Portal del Cliente"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 custom-scrollbar">
              {/* History Tasks */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-ili-cyan/10 rounded-xl text-ili-cyan">
                    <History size={18} />
                  </div>
                  Servicios Realizados
                </h3>
                <div className="space-y-4">
                  {clientHistory.tasks.map((task, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={task.id} 
                      className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                          task.status === 'Finalizado' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        )}>
                          {task.status}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-600">{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors leading-relaxed">{task.description}</p>
                    </motion.div>
                  ))}
                  {clientHistory.tasks.length === 0 && (
                    <div className="p-10 text-center border border-dashed border-white/5 rounded-2xl">
                      <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Sin historial de servicios</p>
                    </div>
                  )}
                </div>
              </section>

              {/* History Budgets */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-blue-400/10 rounded-xl text-blue-400">
                    <FileText size={18} />
                  </div>
                  Presupuestos Enviados
                </h3>
                <div className="space-y-4">
                  {clientHistory.budgets.map((budget, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={budget.id} 
                      className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-zinc-200 group-hover:text-ili-cyan transition-colors">{budget.budget_number}</h4>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{new Date(budget.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-ili-cyan text-lg tracking-tight">${budget.total.toLocaleString()}</p>
                        <button 
                          onClick={() => generatePDF(budget.id)}
                          disabled={loadingBudgetId === budget.id}
                          className="text-[10px] font-black text-zinc-500 hover:text-ili-cyan uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto"
                        >
                          {loadingBudgetId === budget.id ? <Loader2 size={10} className="animate-spin" /> : 'Descargar PDF'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {clientHistory.budgets.length === 0 && (
                    <div className="p-10 text-center border border-dashed border-white/5 rounded-2xl">
                      <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Sin presupuestos registrados</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
              <Users size={32} className="text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-500 tracking-tight">Ficha de Cliente</h3>
            <p className="text-sm text-zinc-700 font-medium max-w-[250px] mt-2">Selecciona un cliente de la lista para ver su información detallada e historial.</p>
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
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 shadow-2xl border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Nuevo Cliente</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Registra una nueva ficha de cliente</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="space-y-2">
                  <label className="label-caps">Nombre / Razón Social</label>
                  <input 
                    required
                    type="text" 
                    className="input-field w-full" 
                    placeholder="Ej: Empresa S.A. o Juan Pérez"
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="label-caps">CUIT / DNI</label>
                    <input 
                      type="text" 
                      className="input-field w-full" 
                      placeholder="20-XXXXXXXX-X"
                      value={newClient.cuit}
                      onChange={e => setNewClient({...newClient, cuit: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Teléfono</label>
                    <input 
                      type="text" 
                      className="input-field w-full" 
                      placeholder="+54 9..."
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Dirección</label>
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    placeholder="Calle, Número, Localidad"
                    value={newClient.address}
                    onChange={e => setNewClient({...newClient, address: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Contacto Principal</label>
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    placeholder="Nombre de la persona de contacto"
                    value={newClient.contact_person}
                    onChange={e => setNewClient({...newClient, contact_person: e.target.value})}
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-sm uppercase tracking-widest mt-4">
                  Guardar Cliente
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
