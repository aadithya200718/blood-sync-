import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
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
  ThermometerSnowflake,
  Menu,
  X,
  ExternalLink,
  Check,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import BloodSyncLogo from '../brand/BloodSyncLogo';
import { alertsApi, notificationsApi } from '../../services/api';

interface NotificationItem {
  notification_id: number;
  recipient_role: string;
  request_id: string | null;
  unit_id: string | null;
  event_type: string;
  severity: 'Info' | 'Warning' | 'Critical';
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

const Layout: React.FC = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const location = useLocation();
  const navigate = useNavigate();

  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System alerts count sync
  useEffect(() => {
    alertsApi
      .getAll({ status: 'Active' })
      .then((res) => setActiveAlertCount(res.data?.length || 0))
      .catch(() => {});
  }, [location.pathname]);

  // Phase 7 & 8: Real-time technician notification polling (2-second interval)
  useEffect(() => {
    if (!token || user?.role === 'Patient') return;

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await notificationsApi.getAll();
        if (!isMounted) return;
        if (res?.data) {
          setNotifications(res.data);
          setUnreadNotificationCount(res.unreadCount || 0);
        }
      } catch (err) {
        // Silent catch for polling
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, user?.role]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Redirect patient accounts to patient portal
  if (user?.role === 'Patient') {
    return <Navigate to="/patient-portal" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleAcknowledgeAll = async () => {
    try {
      await notificationsApi.acknowledgeAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadNotificationCount(0);
    } catch (e) {}
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

  const currentItem = navItems.find((i) => location.pathname.startsWith(i.path));
  const currentTitle = currentItem?.name || 'Clinical Command Center';

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090B] text-slate-100">
      
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Luxury Obsidian Clinical Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0D0F15] border-r border-white/[0.08] flex flex-col shrink-0 transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-white/[0.08] justify-between">
          <Link to="/dashboard" className="flex items-center group">
            <BloodSyncLogo variant="horizontal-dark" size="sm" />
          </Link>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Operations & Registry
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600/25 to-rose-600/10 text-white border border-brand-500/35 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1 rounded-lg transition-colors shrink-0 ${
                      isActive
                        ? 'text-rose-400 bg-brand-500/20'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="tracking-tight truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-semibold animate-pulse shadow-glow-crimson shrink-0 ml-1">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 px-3">
            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-white/[0.04]"
            >
              <span>Public Landing</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>

        {/* Operator Profile & Signout Footer */}
        <div className="p-3 border-t border-white/[0.08] space-y-2 bg-[#090A0E]">
          {user && (
            <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                    {user.role} • Clear Tier 1
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-rose-300 flex items-center justify-center text-xs font-mono font-semibold border border-brand-500/20 shrink-0">
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
        {/* High-Contrast Frosted Glass Topbar */}
        <header className="h-16 bg-[#0D0F15]/90 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-8 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/[0.05]"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="font-editorial text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2 font-normal">
              <span>{currentTitle}</span>
            </h1>

            <span className="hidden md:inline text-white/20">|</span>

            {/* Live Institutional Telemetry Pills */}
            <div className="hidden lg:flex items-center gap-2.5">
              <div className="badge badge-success text-[11px] py-0.5 px-2.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>TELEMETRY: ONLINE</span>
              </div>
              <div className="badge badge-neutral text-[11px] py-0.5 px-2.5">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                <span>INVARIANTS: SECURE</span>
              </div>
              <div className="badge badge-neutral text-[11px] py-0.5 px-2.5">
                <ThermometerSnowflake className="w-3 h-3 text-cyan-400" />
                <span>COLD-CHAIN: 3.8°C</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-Time Database-Backed Notification Bell (Phase 8) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-xl transition-all relative border ${
                  unreadNotificationCount > 0
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border-white/[0.05] hover:border-white/10'
                }`}
                title="Technician Emergency Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold animate-pulse shadow-glow-crimson">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0F1117] border border-white/[0.12] shadow-2xl backdrop-blur-2xl p-4 z-50 animate-slide-up">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                        Technician Alerts ({unreadNotificationCount})
                      </span>
                    </div>

                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        onClick={handleAcknowledgeAll}
                        className="text-[10px] font-mono text-slate-400 hover:text-rose-300 transition-colors"
                      >
                        Acknowledge All
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.05] mt-2 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs font-mono text-slate-500">
                        No active technician notifications.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.notification_id}
                          className={`p-2.5 rounded-xl transition-colors text-xs font-mono ${
                            n.is_read ? 'opacity-60 bg-transparent' : 'bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {n.severity === 'Critical' ? (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              <span className="font-semibold text-white tracking-tight">
                                {n.title}
                              </span>
                            </div>

                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                            {n.message}
                          </p>

                          {/* Quick Actions (Phase 8) */}
                          <div className="flex items-center gap-2 mt-2 pt-1">
                            {n.request_id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  navigate(`/matching?requestId=${n.request_id}`);
                                }}
                                className="px-2 py-1 rounded bg-brand-600/30 hover:bg-brand-600/50 text-rose-200 text-[10px] font-mono flex items-center gap-1"
                              >
                                <span>Open Matching</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {n.request_id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  navigate(`/requests?search=${n.request_id}`);
                                }}
                                className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[10px] font-mono"
                              >
                                View Request
                              </button>
                            )}
                            {!n.is_read && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(n.notification_id)}
                                className="px-2 py-1 rounded text-slate-400 hover:text-white text-[10px] font-mono flex items-center gap-1 ml-auto"
                              >
                                <Check className="w-3 h-3" />
                                <span>Ack</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto animate-fade-in pb-16">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
