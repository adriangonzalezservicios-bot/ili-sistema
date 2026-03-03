import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList, FileText, Plus, Send, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Client, Task, Budget } from '../types';
import html2pdf from 'html2pdf.js';

export const ClientPortal = () => {
  const { clientId } = useParams();
  const [data, setData] = useState<{ client: Client, tasks: Task[], budgets: Budget[] } | null>(null);
  const [newRequest, setNewRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (clientId) {
      fetch(`/api/portal/${clientId}`).then(res => res.json()).then(setData);
    }
  }, [clientId]);

  const generatePDF = async (budgetId: number) => {
    setLoadingId(budgetId);
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
              <p style="margin: 0; font-weight: bold; font-size: 16px;">${budget.client_name || data?.client.name}</p>
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
      setLoadingId(null);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.trim()) return;

    setIsSubmitting(true);
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        description: newRequest,
        status: 'Pendiente',
        priority: 'Media'
      })
    });

    if (res.ok) {
      setNewRequest('');
      setShowSuccess(true);
      // Refresh data
      fetch(`/api/portal/${clientId}`).then(res => res.json()).then(setData);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    setIsSubmitting(false);
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center text-white/40">Cargando portal...</div>;

  return (
    <div className="min-h-screen bg-ili-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ili-cyan rounded-2xl flex items-center justify-center text-ili-dark font-black text-xl">ILI</div>
            <div>
              <h1 className="text-2xl font-bold">Portal del Cliente</h1>
              <p className="text-white/40 text-sm">{data.client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ili-cyan bg-ili-cyan/10 px-4 py-2 rounded-full border border-ili-cyan/20">
            <CheckCircle2 size={14} /> Conexión Segura
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Request Service */}
            <section className="glass-card p-6 border-ili-cyan/20">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-ili-cyan" />
                Solicitar Nuevo Servicio
              </h2>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <textarea 
                  placeholder="Describe el problema o necesidad técnica..."
                  className="input-field w-full min-h-[100px] resize-none"
                  value={newRequest}
                  onChange={e => setNewRequest(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newRequest.trim()}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Enviando...' : <><Send size={18} /> Enviar Solicitud</>}
                </button>
                {showSuccess && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-sm text-center font-semibold"
                  >
                    ¡Solicitud enviada con éxito! Adrian la revisará pronto.
                  </motion.p>
                )}
              </form>
            </section>

            {/* Active Jobs */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock size={20} className="text-yellow-400" />
                Trabajos en Curso
              </h2>
              <div className="space-y-3">
                {data.tasks.filter(t => t.status !== 'Finalizado').map(task => (
                  <div key={task.id} className="glass-card p-4 flex items-center justify-between border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        task.status === 'En Proceso' ? "bg-ili-cyan/10 text-ili-cyan" : "bg-yellow-500/10 text-yellow-400"
                      )}>
                        {task.status === 'En Proceso' ? <AlertCircle size={20} /> : <Clock size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{task.description}</p>
                        <p className="text-xs text-white/40">{task.status} • {new Date(task.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {data.tasks.filter(t => t.status !== 'Finalizado').length === 0 && (
                  <p className="text-center py-8 text-white/20 italic text-sm">No hay trabajos activos en este momento.</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-8">
            {/* History */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                Historial
              </h2>
              <div className="space-y-4">
                {data.budgets.map(budget => (
                  <div key={budget.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:border-ili-cyan/30 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-white/60">{budget.budget_number}</p>
                      <p className="text-[10px] text-white/30">{new Date(budget.date).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => generatePDF(budget.id)}
                      disabled={loadingId === budget.id}
                      className="text-ili-cyan text-[10px] font-bold uppercase hover:underline disabled:opacity-50"
                    >
                      {loadingId === budget.id ? <Loader2 size={12} className="animate-spin" /> : 'Ver PDF'}
                    </button>
                  </div>
                ))}
                {data.budgets.length === 0 && <p className="text-xs text-white/20 italic">No hay registros anteriores.</p>}
              </div>
            </section>

            {/* Contact Info */}
            <section className="glass-card p-6 bg-gradient-to-br from-ili-cyan/10 to-transparent border-ili-cyan/20">
              <h3 className="font-bold text-ili-cyan mb-2">Soporte Técnico ILI</h3>
              <p className="text-xs text-white/60 mb-4">¿Tienes una emergencia? Contáctanos directamente.</p>
              <a href="tel:+541112345678" className="btn-primary w-full py-2 text-center text-xs block">
                Llamar a Adrian
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
