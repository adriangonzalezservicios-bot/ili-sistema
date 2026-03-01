import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, Save, User, Calendar, FileText, PenTool, X, Camera } from 'lucide-react';
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
  const [technician, setTechnician] = useState(localStorage.getItem('ili_tech') || 'Adrian');
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
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">Nuevo Presupuesto</h2>
        <button 
          onClick={handleSave}
          disabled={isGenerating}
          className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
        >
          {isGenerating ? 'Generando...' : <><Save size={20} /> Guardar y PDF</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block flex items-center gap-2">
                  <User size={14} /> Cliente
                </label>
                <select 
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="input-field w-full text-sm"
                >
                  <option value="">Seleccionar Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-2 block flex items-center gap-2">
                    <Calendar size={14} /> Fecha
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="input-field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Validez</label>
                  <input 
                    type="number" 
                    value={validity}
                    onChange={e => setValidity(Number(e.target.value))}
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-white/40">Ítems</h3>
                <button onClick={addItem} className="text-ili-cyan text-xs flex items-center gap-1 hover:underline">
                  <Plus size={14} /> Agregar
                </button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={index} 
                    className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-3 p-3 md:p-0 bg-white/5 md:bg-transparent rounded-xl md:rounded-none relative"
                  >
                    <div className="md:col-span-6">
                      <input 
                        placeholder="Descripción"
                        value={item.description}
                        onChange={e => updateItem(index, 'description', e.target.value)}
                        className="input-field w-full text-sm"
                      />
                    </div>
                    <div className="flex gap-2 md:col-span-5">
                      <div className="w-1/3 md:w-auto">
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
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                          <input 
                            type="number"
                            placeholder="Precio"
                            value={item.unit_price}
                            onChange={e => updateItem(index, 'unit_price', Number(e.target.value))}
                            className="input-field w-full text-sm pl-8"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 md:static md:col-span-1 flex justify-center">
                      <button 
                        onClick={() => removeItem(index)}
                        className="p-2 text-white/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Signature Section */}
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase text-white/40 flex items-center gap-2">
                <PenTool size={14} /> Firma Digital del Cliente
              </h3>
              <button onClick={clearSignature} className="text-xs text-white/40 hover:text-white">Limpiar</button>
            </div>
            <div className="bg-white rounded-xl overflow-hidden cursor-crosshair">
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
            <p className="text-[10px] text-white/40 mt-2 text-center italic">El cliente puede firmar directamente en la pantalla</p>
          </section>

          {/* Photo Upload Section */}
          <section className="glass-card p-6">
            <h3 className="text-sm font-bold uppercase text-white/40 flex items-center gap-2 mb-4">
              <Camera size={14} /> Foto de Respaldo (Equipo)
            </h3>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-ili-cyan/30 transition-all cursor-pointer relative overflow-hidden">
              {photo ? (
                <>
                  <img src={photo} alt="Respaldo" className="max-h-64 rounded-xl" />
                  <button 
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Camera size={48} className="text-white/10 mb-4" />
                  <p className="text-sm text-white/40">Haz clic para subir una foto del equipo</p>
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

        {/* Summary Section */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-8">
            <h3 className="text-lg font-bold mb-6">Resumen</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>IVA (0%)</span>
                <span>$0</span>
              </div>
              <div className="h-px bg-white/10 my-4"></div>
              <div className="flex justify-between text-2xl font-bold text-ili-cyan">
                <span>TOTAL</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="p-4 bg-ili-cyan/5 border border-ili-cyan/20 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase text-ili-cyan">Vista Previa</h4>
              <div className="space-y-2">
                {items.filter(i => i.description).map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="truncate max-w-[150px]">{item.description}</span>
                    <span className="font-mono">${(item.quantity * item.unit_price).toLocaleString()}</span>
                  </div>
                ))}
                {items.filter(i => i.description).length === 0 && <p className="text-xs text-white/20 italic">Sin ítems cargados</p>}
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
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass-card p-8 text-center"
            >
              <div className="w-20 h-20 bg-ili-cyan/20 text-ili-cyan rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2">¡Presupuesto Generado!</h3>
              <p className="text-white/60 mb-8">El presupuesto <span className="text-ili-cyan font-bold">{generatedNumber}</span> ha sido guardado y el PDF se está descargando.</p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="btn-primary w-full py-3"
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
