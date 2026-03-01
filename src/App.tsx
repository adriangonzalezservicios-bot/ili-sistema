import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Calendar as CalendarIcon, 
  FileText, 
  Plus, 
  Menu, 
  X,
  Bell,
  Search,
  ChevronRight,
  LogOut,
  Globe,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';
import { BudgetList } from './components/BudgetList';
import { CRM } from './components/CRM';
import { TaskManager } from './components/TaskManager';
import { Agenda } from './components/Agenda';
import { BudgetGenerator } from './components/BudgetGenerator';
import { ClientPortal } from './components/ClientPortal';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

// Sidebar Component
const Sidebar = ({ isOpen, toggle, currentTech }: { isOpen: boolean, toggle: () => void, currentTech: string }) => {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: ClipboardList, label: 'Pendientes', path: '/pendientes' },
    { icon: CalendarIcon, label: 'Agenda', path: '/agenda' },
    { icon: FileText, label: 'Presupuestos', path: '/presupuestos' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -300 }}
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-ili-card border-r border-white/5 z-50 transition-all duration-300 lg:translate-x-0",
          !isOpen && "lg:w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !isOpen && "lg:opacity-0 lg:w-0")}>
            <div className="w-8 h-8 bg-ili-cyan rounded-lg flex items-center justify-center text-ili-dark font-black">ILI</div>
            <span className="font-bold text-xl tracking-tight">SISTEMA ILI</span>
          </div>
          <button onClick={toggle} className="lg:hidden text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-ili-cyan text-ili-dark font-semibold shadow-[0_0_20px_rgba(0,242,234,0.3)]" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={22} className={cn("shrink-0", isActive ? "text-ili-dark" : "group-hover:text-ili-cyan")} />
                <span className={cn("transition-all duration-300", !isOpen && "lg:opacity-0 lg:w-0")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-3">
          <button className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all">
            <LogOut size={22} />
            <span className={cn("transition-all duration-300", !isOpen && "lg:opacity-0 lg:w-0")}>Cerrar Sesión</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

// Layout Component
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [currentTech, setCurrentTech] = useState(localStorage.getItem('ili_tech') || 'Adrian');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('ili_tech', currentTech);
  }, [currentTech]);

  return (
    <div className="min-h-screen bg-ili-dark flex">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} currentTech={currentTech} />
      
      <main className={cn(
        "flex-1 transition-all duration-300 p-3 md:p-6 lg:p-8 w-full overflow-x-hidden",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        <header className="flex items-center justify-between mb-6 md:mb-8 sticky top-0 bg-ili-dark/80 backdrop-blur-md z-20 py-2">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-2xl font-bold truncate max-w-[150px] md:max-w-none">Panel ILI</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <select 
              value={currentTech}
              onChange={(e) => setCurrentTech(e.target.value)}
              className="bg-ili-card border border-white/10 rounded-xl px-2 py-1 text-xs md:text-sm focus:border-ili-cyan outline-none"
            >
              <option value="Adrian">Adrian</option>
              <option value="Tecnico 1">Técnico 1</option>
              <option value="Tecnico 2">Técnico 2</option>
            </select>
            <button className="p-2 bg-ili-card border border-white/10 rounded-full text-white/60 hover:text-ili-cyan relative hidden sm:block">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-ili-card"></span>
            </button>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-ili-cyan to-blue-500 flex items-center justify-center font-bold text-ili-dark text-sm md:text-base">
              {currentTech[0]}
            </div>
          </div>
        </header>

        <div className="max-w-full">
          {children}
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => navigate('/presupuestos/nuevo')}
          className="fixed bottom-8 right-8 w-14 h-14 bg-ili-cyan text-ili-dark rounded-full shadow-[0_0_30px_rgba(0,242,234,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-30"
        >
          <Plus size={28} />
        </button>
      </main>
    </div>
  );
};

// --- Pages ---

// Dashboard
const Dashboard = () => {
  const [stats, setStats] = useState({ todayJobs: 0, pendingTasks: 0, activeClients: 0 });
  const [todayAgenda, setTodayAgenda] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const publicUrl = window.location.origin;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Fetch stats
    fetch('/api/tasks').then(res => res.json()).then(data => {
      setStats(prev => ({ ...prev, pendingTasks: data.filter((t: any) => t.status !== 'Finalizado').length }));
    });
    fetch('/api/clients').then(res => res.json()).then(data => {
      setStats(prev => ({ ...prev, activeClients: data.length }));
    });
    fetch('/api/agenda').then(res => res.json()).then(data => {
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = data.filter((e: any) => e.start_time.startsWith(today));
      setTodayAgenda(todayEvents);
      setStats(prev => ({ ...prev, todayJobs: todayEvents.length }));
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {[
          { label: 'Hoy', value: stats.todayJobs, icon: CalendarIcon, color: 'text-ili-cyan' },
          { label: 'Pendientes', value: stats.pendingTasks, icon: ClipboardList, color: 'text-yellow-400' },
          { label: 'Clientes', value: stats.activeClients, icon: Users, color: 'text-blue-400', hideMobile: true },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "glass-card p-4 md:p-6 flex items-center justify-between",
              stat.hideMobile && "hidden md:flex"
            )}
          >
            <div>
              <p className="text-white/40 text-[10px] md:text-sm font-medium uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl md:text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
            <div className={cn("p-2 md:p-4 bg-white/5 rounded-xl md:rounded-2xl", stat.color)}>
              <stat.icon size={20} className="md:w-7 md:h-7" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Agenda */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Agenda de Hoy</h2>
            <Link to="/agenda" className="text-ili-cyan text-sm hover:underline">Ver todo</Link>
          </div>
          <div className="space-y-4">
            {todayAgenda.length > 0 ? todayAgenda.map((event, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-ili-cyan/30 transition-colors">
                <div className="w-12 h-12 bg-ili-cyan/10 rounded-xl flex flex-col items-center justify-center text-ili-cyan">
                  <span className="text-xs font-bold uppercase">{event.type === 'Visita' ? 'VIS' : 'MANT'}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{event.title}</h4>
                  <p className="text-sm text-white/40">{event.client_name} • {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <ChevronRight size={20} className="text-white/20" />
              </div>
            )) : (
              <div className="text-center py-8 text-white/20">No hay trabajos programados para hoy</div>
            )}
          </div>
        </section>

        {/* Quick Actions / Recent Activity */}
        <section className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-6">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/presupuestos/nuevo" className="p-4 bg-ili-cyan/10 border border-ili-cyan/20 rounded-2xl flex flex-col items-center gap-2 hover:bg-ili-cyan/20 transition-all">
                <FileText className="text-ili-cyan" />
                <span className="text-sm font-semibold">Nuevo Presupuesto</span>
              </Link>
              <Link to="/clientes" className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col items-center gap-2 hover:bg-blue-500/20 transition-all">
                <Users className="text-blue-400" />
                <span className="text-sm font-semibold">Agregar Cliente</span>
              </Link>
              <Link to="/pendientes" className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col items-center gap-2 hover:bg-yellow-500/20 transition-all">
                <ClipboardList className="text-yellow-400" />
                <span className="text-sm font-semibold">Ver Pendientes</span>
              </Link>
              <Link to="/agenda" className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex flex-col items-center gap-2 hover:bg-purple-500/20 transition-all">
                <CalendarIcon className="text-purple-400" />
                <span className="text-sm font-semibold">Ver Calendario</span>
              </Link>
            </div>
          </div>

          {/* Online Deployment Info */}
          <div className="glass-card p-6 bg-gradient-to-br from-ili-cyan/10 to-transparent border-ili-cyan/20">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-ili-cyan" size={24} />
              <h2 className="text-xl font-bold">Publicar con Cloudflare</h2>
            </div>
            <p className="text-sm text-white/60 mb-6">
              Tu infraestructura usa Cloudflare. Aquí tienes los pasos para conectar este sistema a <code className="text-ili-cyan">ili.com.ar</code>.
            </p>
            
            <div className="space-y-4">
              <div className="bg-ili-dark/50 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-4">
                <span className="text-xs font-mono text-ili-cyan truncate">{publicUrl}</span>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold uppercase mb-2">1. Cloudflare Tunnel (Recomendado)</h4>
                  <p className="text-[11px] text-white/40 mb-2">Usa <code className="text-ili-cyan">cloudflared</code> para exponer este puerto 3000 de forma segura sin abrir puertos en tu router.</p>
                  <code className="text-[10px] bg-black/30 p-1 rounded block text-white/60">cloudflared tunnel --url http://localhost:3000</code>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold uppercase mb-2">2. DNS & Proxy</h4>
                  <p className="text-[11px] text-white/40">Crea un registro CNAME o A en tu panel de Cloudflare apuntando a la IP de este servidor y activa el "Proxy" (Nube Naranja).</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold uppercase mb-2">3. SSL/TLS</h4>
                  <p className="text-[11px] text-white/40">Asegúrate de configurar el modo SSL en "Full" o "Full (Strict)" en Cloudflare para que el candado funcione correctamente.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Main App ---
const NewBudgetWrapper = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const taskId = searchParams.get('taskId');
  return <BudgetGenerator initialClientId={clientId ? parseInt(clientId) : undefined} initialTaskId={taskId ? parseInt(taskId) : undefined} />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/clientes" element={<Layout><CRM /></Layout>} />
        <Route path="/pendientes" element={<Layout><TaskManager /></Layout>} />
        <Route path="/agenda" element={<Layout><Agenda /></Layout>} />
        <Route path="/presupuestos" element={<Layout><BudgetList /></Layout>} />
        <Route path="/presupuestos/nuevo" element={<Layout><NewBudgetWrapper /></Layout>} />
        <Route path="/portal/:clientId" element={<ClientPortal />} />
      </Routes>
    </BrowserRouter>
  );
}
