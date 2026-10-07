import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, RefreshCw, Check } from 'lucide-react';
import { alertsApi } from '../services/api';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Active');
  const [severityFilter, setSeverityFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState('');

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertsApi.getAll({
        status: statusFilter || undefined,
        severity: severityFilter || undefined
      });
      setAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  const handleRunChecks = async () => {
    try {
      setRefreshing(true);
      const res = await alertsApi.runChecks();
      setNotification(`Evaluated inventory rules. New alerts generated: ${res.alertsGenerated || 0}`);
      loadAlerts();
    } catch (err: any) {
      alert(err.message || 'Check execution failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await alertsApi.acknowledge(id);
      setNotification(`Alert #${id} marked as resolved and mitigated.`);
      loadAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert');
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await alertsApi.dismiss(id);
      setNotification(`Alert #${id} dismissed.`);
      loadAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss alert');
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
  const warningCount = alerts.filter(a => a.severity === 'Warning').length;

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
        );
      case 'Warning':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-cyan-400" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
              Live Invariant Sentinel
            </span>
            <span className="text-xs text-slate-500 font-mono">Real-Time Threat Detection</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Safety Invariant & Shortage Radar
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deterministic surveillance of inventory thresholds, days-of-supply minimums, and cryogenic chain integrity.
          </p>
        </div>

        <button
          onClick={handleRunChecks}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Evaluating Rules...' : 'Run Stock Checks Now'}</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Critical Stock Alarms</div>
          <div className="text-2xl font-bold text-rose-400 mt-1 font-display">{criticalCount}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Requires immediate replenishment</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Degradation Warnings</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-display">{warningCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Approaching FEFO threshold</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Rule Engine Frequency</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-display">60s Cycle</div>
          <div className="text-[11px] text-slate-400 mt-1">Continuous deterministic checks</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">System Invariants</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-display">100% Guarded</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> No critical breaches
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-[#181C26] p-1 rounded-xl border border-white/[0.06]">
          {['Active', 'Resolved', 'Dismissed', ''].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                statusFilter === st
                  ? 'bg-rose-600 text-white font-bold shadow-glow-crimson'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {st || 'All Alerts'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#181C26] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Info">Info</option>
          </select>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            {alerts.length} on radar
          </span>
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-[#0F1117]/80 border border-white/[0.08]">
            <div className="inline-block w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-2"></div>
            <p className="font-mono text-xs">Querying alert surveillance engine...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-base font-display">Surveillance Radar Clear</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              No invariant violations or stock shortages detected for current filter parameters.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'Critical';
            const isWarning = alert.severity === 'Warning';

            return (
              <div
                key={alert.alert_id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                  isCritical
                    ? 'bg-rose-500/[0.03] border-rose-500/30 hover:border-rose-500/50 shadow-glow-crimson'
                    : isWarning
                    ? 'bg-amber-500/[0.03] border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-cyan-500/[0.03] border-cyan-500/30 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {getSeverityIcon(alert.severity)}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {alert.type.replace('_', ' ')}
                      </span>
                      {alert.blood_group && (
                        <span className="font-bold text-xs font-mono bg-white/[0.05] text-white px-2 py-0.5 rounded border border-white/[0.1]">
                          Phenotype: {alert.blood_group}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{alert.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  {alert.status === 'Active' ? (
                    <>
                      <button
                        onClick={() => handleAcknowledge(alert.alert_id)}
                        className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-glow transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </button>
                      <button
                        onClick={() => handleDismiss(alert.alert_id)}
                        className="px-3 py-1.5 text-xs font-mono font-medium rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                      {alert.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Alerts;
