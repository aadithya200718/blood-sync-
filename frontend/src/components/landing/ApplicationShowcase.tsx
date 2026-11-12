import React, { useState } from 'react';
import {
  Package,
  GitMerge,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ThermometerSnowflake,
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';

export const ApplicationShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'matching' | 'intelligence'>('inventory');

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      {/* Tab Navigation Pill Selector (Agiloft-style refined tabs) */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1.5 rounded-2xl bg-[#13151B] border border-white/10 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-brand-600 to-rose-600 text-white shadow-glow-crimson font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('matching')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeTab === 'matching'
                ? 'bg-gradient-to-r from-brand-600 to-rose-600 text-white shadow-glow-crimson font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>Compatibility Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeTab === 'intelligence'
                ? 'bg-gradient-to-r from-brand-600 to-rose-600 text-white shadow-glow-crimson font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Copilot & Telemetry</span>
          </button>
        </div>
      </div>

      {/* Showcase Product Frame Container */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#0E1016] border border-white/[0.12] shadow-2xl shadow-black/80 overflow-hidden">
        {/* Top Window Chrome / Institutional Bar */}
        <div className="h-12 bg-[#090A0E] border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="ml-3 text-[11px] font-mono text-slate-400 hidden sm:inline">
              bloodsync.telemetry.internal/console/v2
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>DEMO REPRESENTER • VERIFIED INVARIANTS</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-cyan-400">
              <ThermometerSnowflake className="w-3.5 h-3.5" />
              <span>COLD VAULT: 3.8°C</span>
            </div>
          </div>
        </div>

        {/* Tab Content 1: Inventory View */}
        {activeTab === 'inventory' && (
          <div className="p-6 sm:p-8 animate-fade-in space-y-6">
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Total Units Stored</div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">428</div>
                <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                  <span>● 382 Available</span> • <span>46 Reserved</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Critical O- Negative</div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-rose-400 mt-1">14 <span className="text-xs font-normal text-slate-400">units</span></div>
                <div className="text-[10px] font-mono text-rose-300 mt-1">Below target reserve (20)</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Expiring ≤ 48 Hours</div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-amber-400 mt-1">6 <span className="text-xs font-normal text-slate-400">units</span></div>
                <div className="text-[10px] font-mono text-amber-300 mt-1">Priority crossmatch flagged</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Cold-Chain Compliance</div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-emerald-400 mt-1">99.98%</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">Sensors: 24/24 Operational</div>
              </div>
            </div>

            {/* Blood Group Availability Bar Grid */}
            <div className="p-5 rounded-2xl bg-[#12151D] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300">Blood-Group Stock Distribution</span>
                <span className="text-[11px] font-mono text-slate-500">Live Telemetry Synchronized</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {[
                  { group: 'O-', count: 14, status: 'urgent', pct: 40 },
                  { group: 'O+', count: 88, status: 'healthy', pct: 90 },
                  { group: 'A-', count: 24, status: 'moderate', pct: 60 },
                  { group: 'A+', count: 112, status: 'healthy', pct: 95 },
                  { group: 'B-', count: 18, status: 'moderate', pct: 50 },
                  { group: 'B+', count: 72, status: 'healthy', pct: 85 },
                  { group: 'AB-', count: 8, status: 'urgent', pct: 30 },
                  { group: 'AB+', count: 32, status: 'healthy', pct: 70 },
                ].map((item) => (
                  <div key={item.group} className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col items-center">
                    <span className="text-base font-bold text-white font-sans">{item.group}</span>
                    <span className="text-lg font-mono font-bold text-rose-300 mt-1">{item.count}</span>
                    <span className="text-[9px] font-mono text-slate-400">units</span>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.status === 'urgent' ? 'bg-rose-500' : item.status === 'moderate' ? 'bg-amber-500' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${item.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Unit Table */}
            <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-black/20">
              <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300">Monitored Blood Units</span>
                <span className="text-xs text-rose-400 font-mono">RFID Scan Realtime</span>
              </div>
              <div className="divide-y divide-white/[0.04] text-xs font-mono">
                <div className="grid grid-cols-5 px-4 py-2.5 text-slate-400 bg-white/[0.01]">
                  <span>UNIT ID</span>
                  <span>BLOOD GROUP</span>
                  <span>COMPONENT</span>
                  <span>EXPIRY COUNTDOWN</span>
                  <span>STATUS</span>
                </div>
                <div className="grid grid-cols-5 px-4 py-2.5 text-slate-200 items-center">
                  <span className="font-semibold text-white">BS-PRBC-08892</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span>O NEG</span>
                  <span className="text-slate-400">Packed Red Cells</span>
                  <span className="text-amber-300 font-medium">3 Days (Oct 13)</span>
                  <span className="inline-flex"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">AVAILABLE</span></span>
                </div>
                <div className="grid grid-cols-5 px-4 py-2.5 text-slate-200 items-center">
                  <span className="font-semibold text-white">BS-FFP-09104</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400"></span>AB POS</span>
                  <span className="text-slate-400">Fresh Frozen Plasma</span>
                  <span className="text-slate-300">318 Days (-28°C)</span>
                  <span className="inline-flex"><span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px]">CRYOVAT 2</span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Matching View */}
        {activeTab === 'matching' && (
          <div className="p-6 sm:p-8 animate-fade-in space-y-6">
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold">STAT EMERGENCY</span>
                    <span className="text-sm font-bold text-white">REQ-2026-0941 // Trauma Center ICU 4</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Patient: Liam O'Connor • Blood Group: O Negative • 2 Units PRBC Requested</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono text-slate-400">ALGORITHMIC MATCH</div>
                <div className="text-lg font-mono font-bold text-emerald-400">99.8% BIO-FIT</div>
              </div>
            </div>

            {/* Candidate Matching Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#12151D] border border-brand-500/40 shadow-glow-crimson relative">
                <div className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRIMARY RECOMMENDATION
                </div>
                <span className="text-xs font-mono text-slate-400">Unit ID</span>
                <div className="text-lg font-bold text-white font-mono mt-0.5">BS-PRBC-08892</div>
                <div className="mt-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Blood Group:</span> <span className="text-white font-bold">O Negative</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Antigen Match:</span> <span className="text-emerald-400 font-bold">Kell (-), Duffy (+)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Shelf Life:</span> <span className="text-amber-300">3 Days (FIFO Optimal)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Crossmatch:</span> <span className="text-emerald-400 font-bold">Immediate Spin Compatible</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Confidence: 99.8%</span>
                  <button className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">
                    Lock Reserve
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#12151D] border border-white/[0.08]">
                <div className="text-[10px] font-mono text-slate-400 mb-1">SECONDARY CANDIDATE</div>
                <div className="text-lg font-bold text-white font-mono">BS-PRBC-08915</div>
                <div className="mt-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Blood Group:</span> <span className="text-white font-bold">O Negative</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Antigen Match:</span> <span className="text-slate-300">Standard O- Panel</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Shelf Life:</span> <span className="text-emerald-300">14 Days</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Recommendation:</span> <span className="text-slate-400">Alternate Backup</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Confidence: 97.2%</span>
                  <button className="px-3 py-1 rounded-lg bg-white/10 text-slate-200 text-xs font-semibold hover:bg-white/20 transition-colors">
                    Stage Unit
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#12151D] border border-white/[0.08]">
                <div className="text-[10px] font-mono text-slate-400 mb-1">SAFETY & CHAIN VERIFICATION</div>
                <div className="mt-3 space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Antibody Screen: Negative</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Donor ID Double-Keyed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cold Chain Verified: 3.8°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Patient Wristband Hash Ready</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-slate-400">
                  Requires 2-Technician Biometric Signoff
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Intelligence View */}
        {activeTab === 'intelligence' && (
          <div className="p-6 sm:p-8 animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Copilot Guidance Card */}
              <div className="p-5 rounded-2xl bg-[#131722] border border-white/[0.08] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-500 flex items-center justify-center text-white shadow-glow-crimson">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Neural Copilot Telemetry</h4>
                    <p className="text-[11px] font-mono text-slate-400">Decision-Support Neural Guidance</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono space-y-2 text-slate-300">
                  <div className="text-rose-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Predictive Wastage Prevention Warning</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    6 units of A+ PRBC in Fridge 1 will breach shelf life within 48h. Recommended allocation: 
                    Prioritize for Scheduled Cardiac Surgery #402 tomorrow morning to eliminate expiry loss.
                  </p>
                  <div className="text-[10px] text-emerald-400">Estimated Wastage Prevention: 100% ($1,840 saved)</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Next 7-Day Demand Forecast:</span>
                  <span className="text-white font-semibold">O- Surge Expected (+32%)</span>
                </div>
              </div>

              {/* Demand Forecasting & Cold Vault Metrics */}
              <div className="p-5 rounded-2xl bg-[#131722] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Real-time Cold Chain & Security Telemetry</span>
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400">HEALTHY</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/[0.05]">
                    <span className="text-[10px] font-mono text-slate-400">Cryo-Storage Sensor A</span>
                    <div className="text-xl font-bold font-mono text-cyan-400 mt-1">3.8°C</div>
                    <span className="text-[9px] font-mono text-slate-500">Target Range: 2.0°C – 6.0°C</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/[0.05]">
                    <span className="text-[10px] font-mono text-slate-400">Plasma Deep Freeze</span>
                    <div className="text-xl font-bold font-mono text-sky-400 mt-1">-28.4°C</div>
                    <span className="text-[9px] font-mono text-slate-500">Target Range: &lt; -25.0°C</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono">
                  <div className="text-slate-400 mb-1 flex items-center justify-between">
                    <span>Audit Trail Integrity (SHA-256)</span>
                    <span className="text-emerald-400">VERIFIED</span>
                  </div>
                  <div className="text-[10px] text-slate-500 break-all font-mono">
                    BLOCK #98412 • 4b88f3...e91a0c • 0 INVARIANT BREACHES
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Refined Metadata Strip */}
        <div className="px-6 py-3 bg-[#08090C] border-t border-white/[0.06] flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Chain-of-Custody Logging</span>
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="hidden sm:inline">AABB / CAP Clinical Standard Alignment</span>
          </div>
          <div className="text-slate-400">
            Interactive Product Preview • Local Offline Compatible
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationShowcase;
