import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Eye, Calendar, User } from 'lucide-react';
import { Budget } from '../types';

export const BudgetList = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/budgets').then(res => res.json()).then(setBudgets);
  }, []);

  const filteredBudgets = budgets.filter(b => 
    b.budget_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Historial de Presupuestos</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por número o cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-ili-card border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:border-ili-cyan outline-none w-64"
          />
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
          <thead>
            <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <th className="px-4 md:px-6 py-4">Número</th>
              <th className="px-4 md:px-6 py-4">Cliente</th>
              <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Fecha</th>
              <th className="px-4 md:px-6 py-4">Total</th>
              <th className="px-4 md:px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredBudgets.map(budget => (
              <tr key={budget.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 md:px-6 py-4">
                  <span className="font-bold text-ili-cyan text-xs md:text-sm">{budget.budget_number}</span>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-white/20 hidden md:block" />
                    <span className="text-xs md:text-sm truncate max-w-[100px] md:max-w-none">{budget.client_name}</span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-white/20" />
                    <span className="text-xs text-white/60">{new Date(budget.date).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4">
                  <span className="font-bold text-sm md:text-lg">${budget.total.toLocaleString()}</span>
                </td>
                <td className="px-4 md:px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 md:gap-2">
                    <button className="p-1.5 md:p-2 hover:bg-ili-cyan/10 text-ili-cyan rounded-lg transition-colors">
                      <Download size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <button className="p-1.5 md:p-2 hover:bg-white/10 text-white/60 rounded-lg transition-colors">
                      <Eye size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredBudgets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                  No se encontraron presupuestos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
