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
  Check,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { BudgetList } from './components/BudgetList';
import { CRM } from './components/CRM';
import { TaskManager } from './components/TaskManager';
import { Agenda } from './components/Agenda';
import { BudgetGenerator } from './components/BudgetGenerator';
import { ClientPortal } from './components/ClientPortal';
import Accounting from './components/Accounting';
import UsersPage from './components/Users';
import Login from './components/Login';
import { User, Task } from './types';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

// Sidebar Component
const Sidebar = ({ isOpen, toggle, user, onLogout }: { isOpen: boolean, toggle: () => void, user: User, onLogout: () => void }) => {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: ClipboardList, label: 'Tickets', path: '/pendientes' },
    { icon: CalendarIcon, label: 'Agenda', path: '/agenda' },
    { icon: FileText, label: 'Presupuestos', path: '/presupuestos' },
  ];

  if (user.role === 'admin') {
    menuItems.push(
      { icon: TrendingUp, label: 'Contabilidad', path: '/contabilidad' },
      { icon: Shield, label: 'Usuarios', path: '/usuarios' }
    );
  }

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
          "fixed top-0 left-0 h-full w-64 bg-ili-card border-r border-ili-border z-50 transition-all duration-300 lg:translate-x-0",
          !isOpen && "lg:w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !isOpen && "lg:opacity-0 lg:w-0")}>
            <div className="w-9 h-9 bg-ili-cyan rounded-xl flex items-center justify-center text-ili-dark font-black shadow-lg shadow-ili-cyan/20">ILI</div>
            <span className="font-bold text-lg tracking-tight text-white">SISTEMA ILI</span>
          </div>
          <button 
            onClick={toggle} 
            className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggle();
                }}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-ili-cyan/10 text-ili-cyan font-semibold" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-ili-cyan rounded-r-full"
                  />
                )}
                <item.icon size={20} className={cn("shrink-0 transition-colors", isActive ? "text-ili-cyan" : "group-hover:text-ili-cyan")} />
                <span className={cn("transition-all duration-300 text-sm", !isOpen && "lg:opacity-0 lg:w-0")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-3">
          <button 
            onClick={onLogout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span className={cn("transition-all duration-300 text-sm", !isOpen && "lg:opacity-0 lg:w-0")}>Cerrar Sesión</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

// Layout Component
const Layout = ({ children, user, onLogout }: { children: React.ReactNode, user: User, onLogout: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ili-dark flex mesh-bg">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} user={user} onLogout={onLogout} />
      
      <main className={cn(
        "flex-1 transition-all duration-500 p-4 md:p-8 lg:p-10 w-full overflow-x-hidden relative",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Decorative background glow */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-ili-cyan/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <header className="flex items-center justify-between mb-8 md:mb-10 sticky top-0 bg-ili-dark/40 backdrop-blur-2xl z-20 py-4 border-b border-white/5 -mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10">
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white"
              aria-label={isSidebarOpen ? "Contraer menú" : "Expandir menú"}
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Panel de Control</h1>
              <p className="text-xs text-zinc-500 hidden sm:block">Bienvenido de nuevo, {user.username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-ili-cyan font-bold uppercase tracking-widest">{user.role}</p>
              <p className="text-sm font-semibold text-zinc-200">{user.username}</p>
            </div>
            <button 
              onClick={() => alert('Próximamente: Sistema de notificaciones en tiempo real.')}
              className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400 hover:text-ili-cyan hover:border-ili-cyan/20 transition-all relative hidden sm:block group"
            >
              <Bell size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-900"></span>
            </button>
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center font-bold text-ili-cyan text-sm md:text-base shadow-inner">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>

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
  const [pendingTickets, setPendingTickets] = useState<Task[]>([]);
  const user = JSON.parse(localStorage.getItem('ili_user') || '{}');

  useEffect(() => {
    fetch('/api/tasks').then(res => res.json()).then(data => {
      const pending = data.filter((t: any) => t.status !== 'Finalizado');
      setPendingTickets(pending.slice(0, 4));
      setStats(prev => ({ ...prev, pendingTasks: pending.length }));
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
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="px-1">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Hola, <span className="text-ili-cyan">{user.username || 'Técnico'}</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-2">Aquí tienes un resumen de tu actividad para hoy.</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
        {[
          { label: 'Trabajos Hoy', value: stats.todayJobs, icon: CalendarIcon, color: 'text-ili-cyan', bg: 'bg-ili-cyan/10', border: 'border-ili-cyan/20' },
          { label: 'Pendientes', value: stats.pendingTasks, icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
          { label: 'Clientes', value: stats.activeClients, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', hideMobile: true },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "glass-card p-6 md:p-10 flex items-center justify-between group border-white/5 relative overflow-hidden",
              stat.hideMobile && "hidden md:flex"
            )}
          >
            <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700", stat.color)}>
              <stat.icon size={128} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <p className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
            <div className={cn("relative z-10 p-4 md:p-5 rounded-2xl transition-all group-hover:shadow-lg group-hover:shadow-current/10 border shadow-inner", stat.bg, stat.color, stat.border)}>
              <stat.icon size={24} className="md:w-8 md:h-8" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Today's Agenda */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Agenda de Hoy</h2>
            <Link to="/agenda" className="text-ili-cyan text-xs font-black uppercase tracking-widest hover:brightness-125 flex items-center gap-2 transition-all">
              Ver Calendario <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            {todayAgenda.length > 0 ? todayAgenda.map((event, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-6 p-5 glass-card hover:bg-white/[0.03] transition-all cursor-pointer group border-white/5"
              >
                <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-ili-cyan group-hover:border-ili-cyan/40 transition-all shadow-inner">
                  <Clock size={18} className="mb-1 opacity-40" />
                  <span className="text-[10px] font-black">{format(new Date(event.start_time), 'HH:mm')}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border",
                      event.type === 'Visita' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-ili-cyan/10 text-ili-cyan border-ili-cyan/20"
                    )}>
                      {event.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-zinc-100 group-hover:text-white transition-colors">{event.title}</h4>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">{event.client_name}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-ili-cyan group-hover:bg-ili-cyan/10 transition-all">
                  <ChevronRight size={20} />
                </div>
              </motion.div>
            )) : (
              <div className="glass-card p-16 text-center border-dashed border-white/5">
                <CalendarIcon size={48} className="mx-auto text-zinc-800 mb-4" strokeWidth={1} />
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs italic">No hay trabajos programados para hoy</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-12">
          {/* Quick Actions */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-white tracking-tight px-1">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { to: '/presupuestos/nuevo', icon: FileText, label: 'Presupuesto', color: 'text-ili-cyan', bg: 'bg-ili-cyan/10', border: 'border-ili-cyan/20' },
                { to: '/pendientes', icon: ClipboardList, label: 'Nuevo Ticket', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
                { to: '/clientes', icon: Users, label: 'Clientes', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
                { to: '/agenda', icon: CalendarIcon, label: 'Agenda', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
              ].map((action, i) => (
                <Link 
                  key={i}
                  to={action.to} 
                  className="p-6 glass-card flex flex-col items-center gap-4 hover:bg-white/[0.05] hover:-translate-y-1 transition-all group border-white/5"
                >
                  <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110 border shadow-inner", action.bg, action.color, action.border)}>
                    <action.icon size={24} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Pending Tickets */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Tickets Pendientes</h2>
              <Link to="/pendientes" className="text-ili-cyan text-xs font-black uppercase tracking-widest hover:brightness-125 flex items-center gap-2 transition-all">
                Ver Todos <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {pendingTickets.length > 0 ? pendingTickets.map((ticket, i) => (
                <motion.div 
                  key={ticket.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 glass-card hover:bg-white/[0.03] transition-all group border-white/5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black text-ili-cyan bg-ili-cyan/10 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-ili-cyan/20 shadow-inner">
                      {ticket.ticket_number}
                    </span>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border shadow-inner ${
                      ticket.priority === 'Alta' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      ticket.priority === 'Media' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h4 className="font-bold text-zinc-100 mb-2 line-clamp-1 group-hover:text-ili-cyan transition-colors">{ticket.description}</h4>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
                    <span>{ticket.client_name}</span>
                    <span className="opacity-40 italic">{ticket.type}</span>
                  </div>
                </motion.div>
              )) : (
                <div className="glass-card p-10 text-center border-dashed border-white/5">
                  <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs italic">No hay tickets pendientes</p>
                </div>
              )}
            </div>
          </section>
        </div>
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
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ili_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ili_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ili_user');
  };

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/portal/:clientId" element={<ClientPortal />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} onLogout={handleLogout}><Dashboard /></Layout>} />
        <Route path="/clientes" element={<Layout user={user} onLogout={handleLogout}><CRM /></Layout>} />
        <Route path="/pendientes" element={<Layout user={user} onLogout={handleLogout}><TaskManager /></Layout>} />
        <Route path="/agenda" element={<Layout user={user} onLogout={handleLogout}><Agenda /></Layout>} />
        <Route path="/presupuestos" element={<Layout user={user} onLogout={handleLogout}><BudgetList /></Layout>} />
        <Route path="/presupuestos/nuevo" element={<Layout user={user} onLogout={handleLogout}><NewBudgetWrapper /></Layout>} />
        
        {/* Admin Routes */}
        <Route 
          path="/contabilidad" 
          element={user.role === 'admin' ? <Layout user={user} onLogout={handleLogout}><Accounting /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/usuarios" 
          element={user.role === 'admin' ? <Layout user={user} onLogout={handleLogout}><UsersPage /></Layout> : <Navigate to="/" />} 
        />

        <Route path="/portal/:clientId" element={<ClientPortal />} />
      </Routes>
    </BrowserRouter>
  );
}
