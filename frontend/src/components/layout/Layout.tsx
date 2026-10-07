import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Package,
  LogOut,
  Bell,
  Sparkles,
  Users,
  UserSquare2,
  Clock,
  Send,
  FileText,
  BarChart2,
  GitMerge,
  ShieldCheck,
  Radio,
  ThermometerSnowflake
} from 'lucide-react';
import { alertsApi } from '../../services/api';

const Layout: React.FC = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const location = useLocation();

  const [activeAlertCount, setActiveAlertCount] = useState(0);

  useEffect(() => {
    alertsApi.getAll({ status: 'Active' })
      .then((res) => setActiveAlertCount(res.data?.length || 0))
      .catch(() => {});
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory Vault', path: '/inventory', icon: Package },
    { name: 'Blood Requests', path: '/requests', icon: Activity },
    { name: 'Matching Engine', path: '/matching', icon: GitMerge },
    { name: 'Reservations', path: '/reservations', icon: Clock },
    { name: 'Issuance & Release', path: '/issuance', icon: Send },
    { name: 'Donor Registry', path: '/donors', icon: Users },
    { name: 'Patient Dossiers', path: '/patients', icon: UserSquare2 },
    { name: 'Safety Radar', path: '/alerts', icon: Bell, badge: activeAlertCount > 0 ? activeAlertCount : null },
    { name: 'Audit Ledger', path: '/audit', icon: FileText },
    { name: 'Analytics Hub', path: '/analytics', icon: BarChart2 },
    { name: 'Neural Copilot', path: '/copilot', icon: Sparkles },
  ];

  const currentTitle = navItems.find((i) => location.pathname.startsWith(i.path))?.name || 'Command Center';

  return (
    <div className="flex h-screen overflow-hidden bg-[#07080B] text-slate-100">
      {/* Luxury Obsidian Sidebar */}
      <aside className="w-64 bg-[#0B0D12]/95 border-r border-white/[0.08] flex flex-col shrink-0 z-20">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.08] justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-rose-600 to-rose-400 text-white flex items-center justify-center shadow-glow-crimson group-hover:scale-105 transition-transform duration-300">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                BloodSync
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-rose-300 border border-brand-500/30 uppercase tracking-widest">PRO</span>
              </span>
              <p className="text-[10px] font-mono text-slate-400 tracking-wider">CLINICAL TELEMETRY</p>
            </div>
          </Link>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">Operations & Registry</div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-600/20 to-rose-600/10 text-white border border-brand-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'text-rose-400 bg-brand-500/20' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="tracking-tight">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[11px] font-semibold animate-pulse shadow-glow-crimson">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Operator Profile & Signout Footer */}
        <div className="p-3 border-t border-white/[0.08] space-y-2 bg-[#08090E]/60">
          {user && (
            <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{user.role} • Tier 1</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-mono text-slate-300 font-semibold border border-white/10">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BS'}
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Apple-Style Ultra-Thin Frosted Glass Topbar */}
        <header className="h-14 bg-[#0B0D12]/80 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h1 className="font-display font-semibold text-base text-slate-100 tracking-tight flex items-center gap-2">
              <span>{currentTitle}</span>
            </h1>
            <span className="text-white/20">|</span>
            {/* Live Institutional Telemetry Pills */}
            <div className="hidden lg:flex items-center gap-2.5">
              <div className="badge badge-success text-[11px] py-0.5 px-2">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>TELEMETRY: ONLINE</span>
              </div>
              <div className="badge badge-neutral text-[11px] py-0.5 px-2">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                <span>INVARIANTS: 100% SECURE</span>
              </div>
              <div className="badge badge-neutral text-[11px] py-0.5 px-2">
                <ThermometerSnowflake className="w-3 h-3 text-cyan-400" />
                <span>COLD-CHAIN: 3.8°C</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/alerts"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] rounded-xl transition-all relative border border-white/[0.05] hover:border-white/10"
              title="Alert Notifications"
            >
              <Bell className="w-4 h-4" />
              {activeAlertCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              )}
            </Link>

            <Link
              to="/copilot"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 text-rose-300 hover:bg-brand-500/20 border border-brand-500/25 text-xs font-mono font-medium transition-all shadow-glow-crimson"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">AI COPILOT</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Canvas */}
        <main className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto animate-fade-in pb-16">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
