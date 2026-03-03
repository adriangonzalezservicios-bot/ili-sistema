import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Eye, Calendar, User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Budget } from '../types';
import html2pdf from 'html2pdf.js';

export const BudgetList = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/budgets').then(res => res.json()).then(setBudgets);
  }, []);

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
              <p style="margin: 0; font-weight: bold; font-size: 16px;">${budget.client_name}</p>
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

  const filteredBudgets = budgets.filter(b => 
    b.budget_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Historial de Presupuestos</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Consulta y descarga remitos anteriores</p>
        </div>
        <div className="relative group w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-ili-cyan transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por número o cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-12"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden border-white/10 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-zinc-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-white/5">
                <th className="px-8 py-5">Número</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Fecha</th>
                <th className="px-8 py-5">Total</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBudgets.map((budget, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={budget.id} 
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-8 py-5">
                    <span className="font-black text-ili-cyan text-sm tracking-tight">{budget.budget_number}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/5 text-zinc-600 group-hover:text-ili-cyan transition-colors">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{budget.client_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-zinc-500 font-medium text-xs">
                      <Calendar size={14} className="opacity-40" />
                      <span>{new Date(budget.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-black text-white text-lg tracking-tight">${budget.total.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => generatePDF(budget.id)}
                        disabled={loadingId === budget.id}
                        className="p-2.5 bg-zinc-900 border border-white/5 text-zinc-500 hover:text-ili-cyan hover:border-ili-cyan/30 rounded-xl transition-all disabled:opacity-50"
                        title="Descargar PDF"
                      >
                        {loadingId === budget.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      </button>
                      <button 
                        onClick={() => generatePDF(budget.id)}
                        className="p-2.5 bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 rounded-xl transition-all"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredBudgets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <FileText size={48} strokeWidth={1} className="mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest italic">No se encontraron presupuestos</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
