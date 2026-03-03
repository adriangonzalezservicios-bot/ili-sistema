import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, FileText, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';

export default function Accounting() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0 });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/accounting'),
        fetch('/api/accounting/summary')
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      setTransactions(tData || []);
      setSummary(sData || { total_income: 0, total_expenses: 0 });
    } catch (error) {
      console.error('Error fetching accounting data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });
      if (response.ok) {
        setShowForm(false);
        setFormData({
          type: 'expense',
          amount: '',
          description: '',
          category: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const balance = summary.total_income - summary.total_expenses;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Contabilidad</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Control de ingresos y gastos operativos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          <span className="uppercase tracking-widest text-sm">Nuevo Registro</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 border-emerald-500/10"
        >
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="label-caps !mb-1">Ingresos Totales</p>
              <p className="text-3xl font-black text-white tracking-tighter">${summary.total_income.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 border-rose-500/10"
        >
          <div className="flex items-center gap-5">
            <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
              <TrendingDown size={28} />
            </div>
            <div>
              <p className="label-caps !mb-1">Gastos Totales</p>
              <p className="text-3xl font-black text-white tracking-tighter">${summary.total_expenses.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 border-ili-cyan/10"
        >
          <div className="flex items-center gap-5">
            <div className="p-4 bg-ili-cyan/10 text-ili-cyan rounded-2xl border border-ili-cyan/20">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="label-caps !mb-1">Balance General</p>
              <p className={`text-3xl font-black tracking-tighter ${balance >= 0 ? 'text-ili-cyan' : 'text-rose-400'}`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Historial de Movimientos</h3>
          <button 
            onClick={() => alert('Próximamente: Exportación de informes detallados.')}
            className="text-xs text-ili-cyan font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <FileText size={16} />
            Exportar Informe
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-zinc-900/30 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 border-b border-white/5">
                <th className="px-8 py-5">Fecha</th>
                <th className="px-8 py-5">Descripción</th>
                <th className="px-8 py-5">Categoría</th>
                <th className="px-8 py-5">Tipo</th>
                <th className="px-8 py-5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t, i) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  key={t.id} 
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 text-zinc-400 font-medium text-xs">
                      <Calendar size={14} className="opacity-40" />
                      {t.date}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{t.description}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-zinc-900 text-zinc-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    )}>
                      {t.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </div>
                  </td>
                  <td className={cn(
                    "px-8 py-5 text-lg font-black text-right tracking-tight",
                    t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </td>
                </motion.tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <DollarSign size={48} strokeWidth={1} className="mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest italic">No hay movimientos registrados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
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
                  <h3 className="text-2xl font-bold text-white tracking-tight">Nuevo Registro</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Añade un movimiento contable</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="label-caps">Tipo de Movimiento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'income', label: 'Ingreso', icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { id: 'expense', label: 'Gasto', icon: ArrowDownRight, color: 'text-rose-400', bg: 'bg-rose-500/10' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id })}
                        className={cn(
                          "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                          formData.type === type.id 
                            ? `${type.bg} ${type.color} border-white/10` 
                            : "bg-zinc-900 text-zinc-500 border-white/5 hover:bg-zinc-800"
                        )}
                      >
                        <type.icon size={14} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="label-caps">Monto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="input-field w-full"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Fecha</label>
                    <input
                      type="date"
                      required
                      className="input-field w-full text-xs"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Descripción</label>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="Ej: Compra de repuestos, Pago servicio"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej: Materiales, Sueldos, Servicios"
                    className="input-field w-full"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-sm uppercase tracking-widest mt-4">
                  Guardar Movimiento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
