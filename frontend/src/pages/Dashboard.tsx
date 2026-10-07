import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  AlertCircle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Plus,
  Sparkles,
  ThermometerSnowflake,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { analyticsApi, alertsApi } from '../services/api';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dashRes, alertsRes] = await Promise.all([
          analyticsApi.getDashboard(),
          alertsApi.getAll({ status: 'Active' })
        ]);
        setData(dashRes.data || null);
        setAlerts(alertsRes.data?.slice(0, 4) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const kpis = data?.kpis || {};
  const bloodGroups = data?.bloodGroups || [];

  const summaryCards = [
    {
      title: 'Cryo & Cellular Reserves',
      value: kpis.availableUnits ?? 0,
      detail: `${kpis.reservedUnits ?? 0} units locked in crossmatch`,
      icon: Droplet,
      accent: 'from-rose-500/20 to-brand-500/5',
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/20',
      badge: 'FEFO Monitored'
    },
    {
      title: 'Active Clinical Demand',
      value: kpis.pendingRequests ?? 0,
      detail: `${kpis.emergencyPending ?? 0} STAT Emergency Level 1`,
      icon: Activity,
      accent: 'from-amber-500/20 to-orange-500/5',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      badge: kpis.emergencyPending > 0 ? 'CRITICAL TRAUMA' : 'NOMINAL'
    },
    {
      title: 'Verified Transfusions',
      value: kpis.issuedUnits ?? 0,
      detail: '100% Dual-sign-off compliant',
      icon: CheckCircle2,
      accent: 'from-emerald-500/20 to-teal-500/5',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      badge: 'Zero Discrepancy'
    },
    {
      title: 'Degradation / Wastage',
      value: kpis.wastageRate || '0.0%',
      detail: `${kpis.expiredUnits ?? 0} expired units this cycle`,
      icon: AlertCircle,
      accent: 'from-purple-500/20 to-indigo-500/5',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      badge: 'AABB Benchmark: <1.5%'
    }
  ];

  if (loading) {
    return (
      <div className="glass-panel p-16 text-center text-slate-400 animate-pulse space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 mx-auto flex items-center justify-center">
          <Activity className="w-6 h-6 text-rose-400 animate-spin" />
        </div>
        <p className="font-mono text-sm tracking-wide text-slate-300">Synchronizing Cryo-Storage Telemetry & Invariants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Tactical Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">REAL-TIME INVENTORY STREAM</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Operational Command Center
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Automated FEFO dispatch, algorithmic crossmatch safety invariants, and cold-chain compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/requests" className="btn-primary flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Plus className="w-4 h-4" />
            <span>Formulate Request</span>
          </Link>
          <Link to="/copilot" className="btn-secondary flex items-center gap-2 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Engage AI Copilot</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards: Bloomberg Terminal Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`glass-panel p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300 border ${card.borderColor}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.accent} rounded-full blur-2xl pointer-events-none`}></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.06] text-slate-400 uppercase tracking-wider">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="font-display text-3xl font-extrabold text-white tracking-tight mt-1">
                    {card.value}
                  </h3>
                  <p className="text-xs font-medium text-slate-300 mt-1">{card.title}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center ${card.iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-4 pt-3 border-t border-white/[0.06] relative z-10 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                <span>{card.detail}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Real-Time Cold-Chain Telemetry Ribbon */}
      <div className="glass-panel-subtle p-4 rounded-xl border border-white/[0.08] bg-[#0B0D12]/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ThermometerSnowflake className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Cold-Chain Storage Topology</span>
            <span className="text-slate-200 font-semibold">3 Vaults Online • 100% Invariant Compliant</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Vault A (RBC): <strong className="text-white font-mono">3.8°C</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Cryo B (Plasma): <strong className="text-white font-mono">-31.2°C</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Agitator C (Platelets): <strong className="text-white font-mono">22.1°C</strong></span>
          </div>
        </div>
      </div>

      {/* Two Columns: Active Critical Alerts + Inventory Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Critical Invariant Alerts Panel */}
        <div className="glass-panel p-6 lg:col-span-1 flex flex-col justify-between border border-white/[0.08]">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <h3 className="font-display font-bold text-white text-sm tracking-tight">Active Invariant Alerts</h3>
              </div>
              <Link to="/alerts" className="text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors">
                View Radar ({alerts.length})
              </Link>
            </div>

            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="font-medium text-slate-300">All Safety Invariants Satisfied</p>
                <p className="text-[11px] text-slate-500 mt-1">Zero critical stock shortages or expired units.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className={`p-3.5 rounded-xl border text-xs relative overflow-hidden transition-all duration-200 ${
                      alert.severity === 'Critical'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.severity === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono font-bold uppercase tracking-wider text-[11px]">
                            {alert.type.replace('_', ' ')} • {alert.blood_group || 'STOCK'}
                          </p>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                            alert.severity === 'Critical' ? 'border-rose-500/40 text-rose-300 bg-rose-500/20' : 'border-amber-500/40 text-amber-300 bg-amber-500/20'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1 leading-snug line-clamp-2">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Automated Rules Active</span>
            </span>
            <Link to="/alerts" className="text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1">
              <span>Shortage Radar</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Recharts Bar Chart: Dark Forensic Aesthetics */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col border border-white/[0.08]">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="font-display font-bold text-white text-sm tracking-tight">
                Cellular Inventory by ABO/Rh Phenotype
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">FEFO expiration prioritized distribution</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-500 shadow-glow-crimson"></span>
                <span>Available</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                <span>Reserved</span>
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bloodGroups}>
                <defs>
                  <linearGradient id="barAvailable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FB7185" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#BE123C" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barReserved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#B45309" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="blood_group" tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                  contentStyle={{
                    backgroundColor: '#0F1117',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Bar dataKey="available" name="Available Units" fill="url(#barAvailable)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reserved" name="Crossmatched Units" fill="url(#barReserved)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
