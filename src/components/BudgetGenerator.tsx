import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, Save, User, Calendar, FileText, PenTool, X, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, BudgetItem, Task } from '../types';
import html2pdf from 'html2pdf.js';

export const BudgetGenerator = ({ initialClientId, initialTaskId }: { initialClientId?: number, initialTaskId?: number }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | string>(initialClientId || '');
  const [items, setItems] = useState<BudgetItem[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validity, setValidity] = useState(15);
  const [photo, setPhoto] = useState<string | null>(null);
  const [technician, setTechnician] = useState(() => {
    const user = JSON.parse(localStorage.getItem('ili_user') || '{}');
    return user.username || 'Adrian';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedNumber, setGeneratedNumber] = useState('');
  
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(setClients);
  }, []);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

  // Signature Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#00f2ea';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => {
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = async () => {
    if (!selectedClientId || items.some(i => !i.description)) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsGenerating(true);
    const signatureData = signatureRef.current?.toDataURL();

    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClientId,
        task_id: initialTaskId,
        date,
        validity_days: validity,
        items,
        signature_data: signatureData,
        photo_url: photo,
        technician_name: technician
      })
    });

    if (res.ok) {
      const data = await res.json();
      setGeneratedNumber(data.budget_number);
      setShowSuccess(true);
      generatePDF(data.budget_number);
    }
    setIsGenerating(false);
  };

  const generatePDF = (budgetNumber: string) => {
    const client = clients.find(c => c.id === Number(selectedClientId));
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
            <p style="margin: 5px 0; font-weight: bold; color: #00f2ea;">${budgetNumber}</p>
            <p style="margin: 0; font-size: 12px;">Fecha: ${date}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 10px;">Cliente</h3>
            <p style="margin: 0; font-weight: bold; font-size: 16px;">${client?.name}</p>
            <p style="margin: 5px 0; font-size: 13px;">${client?.address || ''}</p>
            <p style="margin: 0; font-size: 13px;">CUIT: ${client?.cuit || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 10px;">Validez</h3>
            <p style="margin: 0; font-size: 14px;">${validity} días</p>
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
            ${items.map(item => `
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
              <span>$${subtotal.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #00f2ea; border-top: 1px solid #ddd; padding-top: 10px;">
              <span>TOTAL</span>
              <span>$${subtotal.toLocaleString()}</span>
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
              ${signatureRef.current?.toDataURL() ? `<img src="${signatureRef.current.toDataURL()}" style="max-height: 70px;" />` : ''}
            </div>
            <p style="margin: 0; font-size: 12px; color: #666;">Firma Cliente</p>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `Presupuesto_${budgetNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Nuevo Presupuesto</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Genera un remito o presupuesto digital</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isGenerating}
          className="btn-primary flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 shadow-xl shadow-ili-cyan/10"
        >
          {isGenerating ? (
            <><Loader2 size={20} className="animate-spin" /> Generando...</>
          ) : (
            <><Save size={20} /> <span className="uppercase tracking-widest text-sm">Guardar y PDF</span></>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-8 space-y-8">
          <section className="glass-card p-6 md:p-10 space-y-8 border-white/10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="label-caps flex items-center gap-2">
                  <User size={14} className="text-ili-cyan" /> Cliente
                </label>
                <select 
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="input-field w-full appearance-none"
                >
                  <option value="">Seleccionar Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-caps flex items-center gap-2">
                    <Calendar size={14} className="text-ili-cyan" /> Fecha
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="input-field w-full text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-caps">Validez (Días)</label>
                  <input 
                    type="number" 
                    value={validity}
                    onChange={e => setValidity(Number(e.target.value))}
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Ítems del Presupuesto</h3>
                <button onClick={addItem} className="text-ili-cyan text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-125 transition-all bg-ili-cyan/10 px-3 py-1.5 rounded-lg border border-ili-cyan/20">
                  <Plus size={14} /> Agregar Ítem
                </button>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index} 
                    className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:p-0 bg-zinc-900/50 md:bg-transparent rounded-2xl md:rounded-none relative group border border-white/5 md:border-0"
                  >
                    <div className="md:col-span-6">
                      <input 
                        placeholder="Descripción del servicio o producto"
                        value={item.description}
                        onChange={e => updateItem(index, 'description', e.target.value)}
                        className="input-field w-full text-sm"
                      />
                    </div>
                    <div className="flex gap-4 md:col-span-5">
                      <div className="w-24">
                        <input 
                          type="number"
                          placeholder="Cant"
                          value={item.quantity}
                          onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                          className="input-field w-full text-sm text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                          <input 
                            type="number"
                            placeholder="Precio Unitario"
                            value={item.unit_price}
                            onChange={e => updateItem(index, 'unit_price', Number(e.target.value))}
                            className="input-field w-full text-sm pl-8"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 md:static md:col-span-1 flex justify-center items-center">
                      <button 
                        onClick={() => removeItem(index)}
                        className="p-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Eliminar ítem"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Signature Section */}
            <section className="glass-card p-8 border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                  <PenTool size={14} className="text-ili-cyan" /> Firma del Cliente
                </h3>
                <button onClick={clearSignature} className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Limpiar</button>
              </div>
              <div className="bg-white rounded-2xl overflow-hidden cursor-crosshair shadow-inner ring-1 ring-black/5">
                <canvas 
                  ref={signatureRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-40"
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-4 text-center font-bold uppercase tracking-widest italic">Firma directamente en pantalla</p>
            </section>

            {/* Photo Upload Section */}
            <section className="glass-card p-8 border-white/10 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-6">
                <Camera size={14} className="text-ili-cyan" /> Foto de Respaldo
              </h3>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-8 hover:border-ili-cyan/30 bg-zinc-900/30 transition-all cursor-pointer relative overflow-hidden group min-h-[200px]">
                {photo ? (
                  <>
                    <img src={photo} alt="Respaldo" className="max-h-48 rounded-xl shadow-2xl" />
                    <button 
                      onClick={() => setPhoto(null)}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-xl hover:scale-110 transition-transform"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/5">
                      <Camera size={32} className="text-zinc-700 group-hover:text-ili-cyan transition-colors" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">Subir foto del equipo</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Summary Section */}
        <div className="lg:col-span-4">
          <div className="glass-card p-8 sticky top-8 border-white/10 shadow-2xl space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-6">Resumen</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-zinc-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-white font-bold">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-500 font-medium">
                  <span>IVA (0%)</span>
                  <span className="text-white font-bold">$0</span>
                </div>
                <div className="h-px bg-white/5 my-6"></div>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Total Final</span>
                  <span className="text-4xl font-black text-ili-cyan tracking-tighter">${subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Vista Previa de Ítems</h4>
              <div className="space-y-3">
                {items.filter(i => i.description).map((item, i) => (
                  <div key={i} className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-400 truncate max-w-[180px]">{item.description}</span>
                    <span className="text-white font-bold">${(item.quantity * item.unit_price).toLocaleString()}</span>
                  </div>
                ))}
                {items.filter(i => i.description).length === 0 && (
                  <p className="text-xs text-zinc-700 italic font-medium">Sin ítems cargados</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-3 p-4 bg-ili-cyan/5 border border-ili-cyan/10 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-ili-cyan/10 flex items-center justify-center text-ili-cyan">
                  <PenTool size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-ili-cyan">Técnico Responsable</p>
                  <p className="text-sm font-bold text-white">{technician}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccess(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card p-10 text-center shadow-2xl border-white/10"
            >
              <button 
                onClick={() => setShowSuccess(false)}
                className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="w-24 h-24 bg-ili-cyan/10 text-ili-cyan rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-ili-cyan/10 border border-ili-cyan/20">
                <FileText size={48} />
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tight mb-3">¡Presupuesto Generado!</h3>
              <p className="text-zinc-500 font-medium mb-10">
                El presupuesto <span className="text-ili-cyan font-black">{generatedNumber}</span> ha sido guardado correctamente y el PDF se está descargando.
              </p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="btn-primary w-full py-4 text-sm uppercase tracking-widest font-black"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
