import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Droplet, Clock, CheckCircle2, BarChart3, Activity, ShieldCheck } from 'lucide-react';
import { analyticsApi } from '../services/api';

const LUXURY_PALETTE = ['#E11D48', '#38BDF8', '#10B981', '#F59E0B', '#818CF8', '#EC4899', '#06B6D4', '#64748B'];

const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getDashboard();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 rounded-2xl bg-[#0F1117]/80 border border-white/[0.08]">
        <div className="inline-block w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-3"></div>
        <p className="font-mono text-xs">Computing institutional analytical telemetry & wastage curves...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const bloodGroups = data?.bloodGroups || [];
  const components = data?.components || [];
  const shelfLife = data?.shelfLife || {};

  const shelfLifeData = [
    { name: '< 7 Days', units: Number(shelfLife.within_7_days || 0), fill: '#E11D48' },
    { name: '8–14 Days', units: Number(shelfLife.within_14_days || 0), fill: '#F59E0B' },
    { name: '15–30 Days', units: Number(shelfLife.within_30_days || 0), fill: '#38BDF8' },
    { name: '> 30 Days', units: Number(shelfLife.over_30_days || 0), fill: '#10B981' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-rose-400" />
              Institutional Telemetry
            </span>
            <span className="text-xs text-slate-500 font-mono">ISO 15189 & CAP Laboratory Standards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Analytical Intelligence & Transfusion Telemetry
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time wastage minimization analytics, C:T crossmatch ratios, and cryogenic shelf-life survival curves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Telemetry Stream: Live
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Available Vault Stock</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-white font-display">{kpis.availableUnits || 0}</h3>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Droplet className="w-5 h-5 fill-rose-500/20" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2 block">
            {kpis.reservedUnits || 0} units committed in 48hr time-locks
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Inventory Wastage Rate</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-white font-display">{kpis.wastageRate || '0.0%'}</h3>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Target &lt; 5.0% WHO Gold Benchmark
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Impending Expirations</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-amber-400 font-display">{kpis.expiringSoon || 0}</h3>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-amber-400/80 font-mono mt-2 block">
            Units entering &lt; 7-day critical window
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Active Donor Network</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-white font-display">{kpis.totalDonors || 0}</h3>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono mt-2 block">
            {kpis.eligibleDonors || 0} qualified for immediate mobilization
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Group Inventory Bar Chart */}
        <div className="p-6 rounded-2xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Inventory Reserve by Blood Phenotype</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Available vs. Committed Units</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Available
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Reserved
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bloodGroups}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="blood_group" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1117',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                    color: '#FFF'
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="available" name="Available Units" fill="#E11D48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reserved" name="Reserved Units" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component Distribution Pie Chart */}
        <div className="p-6 rounded-2xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Component Allocation Distribution</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Cellular fractions & cryogenic derivatives</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={components}
                  dataKey="available"
                  nameKey="component_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {components.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={LUXURY_PALETTE[index % LUXURY_PALETTE.length]} stroke="#0F1117" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1117',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                    color: '#FFF'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelf Life Distribution */}
        <div className="p-6 rounded-2xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card flex flex-col lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Shelf-Life Expiry Forecast Horizon</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                FEFO degradation risk categorizing units by days remaining before viability threshold
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              Real-Time Degradation Curve
            </span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shelfLifeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1117',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                    color: '#FFF'
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="units" name="Units in Shelf Horizon" radius={[6, 6, 0, 0]}>
                  {shelfLifeData.map((entry, index) => (
                    <Cell key={`horizon-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
