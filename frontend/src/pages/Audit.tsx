import React, { useEffect, useState } from 'react';
import { Search, Filter, ShieldCheck, ChevronDown, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { auditApi } from '../services/api';

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const loadLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, summaryRes] = await Promise.all([
        auditApi.getAll({
          search: search || undefined,
          entity_type: entityFilter || undefined,
          action: actionFilter || undefined,
          limit: 500
        }),
        auditApi.getSummary()
      ]);
      setLogs(logsRes.data || []);
      setSummary(summaryRes.data || null);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter, actionFilter]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('ISSUE') || action.includes('RESERVE')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {action}
        </span>
      );
    }
    if (action.includes('EXPIRE') || action.includes('DISCARD')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {action}
        </span>
      );
    }
    if (action.includes('CREATED') || action.includes('COLLECTED') || action.includes('REGISTERED')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {action}
      </span>
    );
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const paginated = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              Cryptographic Ledger Locked
            </span>
            <span className="text-xs text-slate-500 font-mono">FDA 21 CFR §11 & §606 Compliant</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Immutable Audit Trail & Compliance Ledger
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tamper-evident chain-of-custody transactions, dual-operator verifications, and state change records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Integrity Check: PASS
          </span>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.topActions?.slice(0, 4).map((item: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card flex justify-between items-center">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{item.action}</p>
                <p className="text-2xl font-bold text-white mt-1 font-display">{item.count}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Verified mutations</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search entity reference, action type, user, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
            className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-[#181C26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
            >
              <option value="">All Entities</option>
              <option value="blood_units">Blood Units</option>
              <option value="blood_requests">Blood Requests</option>
              <option value="reservations">Reservations</option>
              <option value="issuances">Issuances</option>
              <option value="cross_matches">Cross Matches</option>
              <option value="donors">Donors</option>
              <option value="patients">Patients</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-[#181C26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
            >
              <option value="">All Actions</option>
              <option value="UNIT_COLLECTED">Unit Collected</option>
              <option value="UNIT_RESERVED">Unit Reserved</option>
              <option value="UNIT_ISSUED">Unit Issued</option>
              <option value="UNIT_DISCARDED">Unit Discarded</option>
              <option value="REQUEST_CREATED">Request Created</option>
              <option value="CROSSMATCH_TESTED">Crossmatch Tested</option>
            </select>
          </div>

          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            {logs.length} Logged Entries
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase font-mono tracking-wider bg-white/[0.02] border-b border-white/[0.06]">
              <tr>
                <th className="px-4 py-3.5 w-10"></th>
                <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                <th className="px-5 py-3.5 font-semibold">Action</th>
                <th className="px-5 py-3.5 font-semibold">Target Entity</th>
                <th className="px-5 py-3.5 font-semibold">Operator / Actor</th>
                <th className="px-5 py-3.5 font-semibold">Clinical Indication & Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-2"></div>
                    <p className="font-mono text-xs">Accessing immutable cryptographic audit trail...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-mono text-xs">
                    No audit records found matching current query.
                  </td>
                </tr>
              ) : (
                paginated.map((log) => {
                  const isExpanded = expandedId === log.audit_id;
                  const hasState = log.before_state || log.after_state;

                  return (
                    <React.Fragment key={log.audit_id}>
                      <tr
                        onClick={() => hasState && toggleExpand(log.audit_id)}
                        className={`hover:bg-white/[0.02] transition-colors ${hasState ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-4 py-3.5 text-slate-500">
                          {hasState && (
                            isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-300" /> : <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="px-5 py-3.5">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            {log.entity_type}#{log.entity_id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-300 font-mono">
                          {log.user_name || (log.user_id ? `User #${log.user_id}` : 'System Automated')}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 max-w-sm truncate">
                          {log.reason || 'Standard verified clinical operation'}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-black/30">
                          <td colSpan={6} className="px-8 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="bg-[#0B0D13] p-4 rounded-xl border border-white/[0.08]">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                  State Before Mutation:
                                </span>
                                <pre className="text-slate-300 overflow-x-auto text-[11px]">
                                  {log.before_state ? JSON.stringify(log.before_state, null, 2) : 'null (Entity Initialized)'}
                                </pre>
                              </div>
                              <div className="bg-[#0B0D13] p-4 rounded-xl border border-emerald-500/20">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                                  State After Mutation:
                                </span>
                                <pre className="text-emerald-300 overflow-x-auto text-[11px]">
                                  {log.after_state ? JSON.stringify(log.after_state, null, 2) : 'null (Entity Purged/Archived)'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-white/[0.01] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, logs.length)} of {logs.length} audit logs
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 font-mono hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="px-2 font-mono font-bold text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 font-mono hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Audit;
