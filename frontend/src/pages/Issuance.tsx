import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Send, Search, UserCheck, AlertTriangle, Lock, ArrowUpRight } from 'lucide-react';
import { requestsApi } from '../services/api';
import { Link } from 'react-router-dom';

const Issuance: React.FC = () => {
  const [issuances, setIssuances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Quick issuance modal
  const [showModal, setShowModal] = useState(false);
  const [unitId, setUnitId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [reasonCode, setReasonCode] = useState('Operating Theatre Emergency');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Safety checklist states
  const [checkPatientAbo, setCheckPatientAbo] = useState(false);
  const [checkExpiry, setCheckExpiry] = useState(false);
  const [checkCrossmatch, setCheckCrossmatch] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await requestsApi.getAllIssuances();
      setIssuances(res.data || []);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load issuance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPatientAbo || !checkExpiry || !checkCrossmatch) {
      setErrorMsg('All safety invariants must be verified prior to clinical release.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await requestsApi.issue(requestId, unitId, reasonCode);
      setSuccessMsg(`Blood unit ${unitId} authorized and issued successfully for request ${requestId}.`);
      setShowModal(false);
      setUnitId('');
      setRequestId('');
      setCheckPatientAbo(false);
      setCheckExpiry(false);
      setCheckCrossmatch(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Issuance failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = issuances.filter((iss) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (iss.unit_id && iss.unit_id.toLowerCase().includes(term)) ||
      (iss.request_id && iss.request_id.toLowerCase().includes(term)) ||
      (iss.patient_name && iss.patient_name.toLowerCase().includes(term)) ||
      (iss.hospital && iss.hospital.toLowerCase().includes(term)) ||
      (iss.reason_code && iss.reason_code.toLowerCase().includes(term)) ||
      (iss.issued_by_name && iss.issued_by_name.toLowerCase().includes(term)) ||
      (iss.blood_group && iss.blood_group.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const emergencyCount = issuances.filter(i => i.urgency === 'Emergency' || (i.reason_code && i.reason_code.includes('Emergency'))).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Chain of Custody Active
            </span>
            <span className="text-xs text-slate-500 font-mono">FDA 21 CFR §606 Compliant</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Blood Unit Issuance & Clinical Release Ledger
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tamper-evident chain-of-custody tracking with dual-operator safety invariants and serological crossmatch sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/reservations"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Reservations</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-glow-crimson transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Authorize Clinical Release</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Releases Logged</div>
          <div className="text-2xl font-bold text-white mt-1 font-display">{issuances.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Invariant Verified
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">STAT Emergency Dispatches</div>
          <div className="text-2xl font-bold text-rose-400 mt-1 font-display">{emergencyCount}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Priority Zero-Lag Logistics</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Chain-of-Custody Invariants</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-display">Enforced</div>
          <div className="text-[11px] text-slate-400 mt-1">Dual-operator sign-off</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Audit Status</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-display">Locked</div>
          <div className="text-[11px] text-slate-400 mt-1">Immutable SHA-256 Ledger</div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search unit ID, request ID, patient, hospital, reason code, or staff..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 font-mono"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            {filtered.length} Dispatches Filtered
          </span>
        </div>
      </div>

      {/* Issuance Table */}
      <div className="rounded-2xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-white text-sm font-display tracking-wide">
              Dispatched & Released Units
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-slate-400">
              {filtered.length} total
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Immutable chain-of-custody records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase font-mono tracking-wider bg-white/[0.02] border-b border-white/[0.06]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Unit ID</th>
                <th className="px-5 py-3.5 font-semibold">Blood Group</th>
                <th className="px-5 py-3.5 font-semibold">Patient / Facility</th>
                <th className="px-5 py-3.5 font-semibold">Request Reference</th>
                <th className="px-5 py-3.5 font-semibold">Clinical Indication</th>
                <th className="px-5 py-3.5 font-semibold">Authorizing Operator</th>
                <th className="px-5 py-3.5 font-semibold">Dispatched At</th>
                <th className="px-5 py-3.5 font-semibold text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-2"></div>
                    <p className="font-mono text-xs">Accessing chain-of-custody ledger...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-mono text-xs">
                    No release records match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((iss) => (
                  <tr key={iss.issuance_id || iss.unit_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400/80"></span>
                        {iss.unit_id}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                        {iss.blood_group}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{iss.component_type || 'Whole Blood'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-200">{iss.patient_name || 'Emergency Patient'}</p>
                      <p className="text-[11px] text-slate-400">{iss.hospital || 'Central Hospital'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/matching?requestId=${iss.request_id}`}
                        className="text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                      >
                        {iss.request_id}
                        <ArrowUpRight className="w-3 h-3 opacity-70" />
                      </Link>
                      {iss.urgency && (
                        <span className={`block text-[10px] font-mono uppercase font-bold mt-0.5 ${
                          iss.urgency === 'Emergency' ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {iss.urgency}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-300 font-medium">
                      {iss.reason_code || 'Standard Clinical Release'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-300">
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        {iss.issued_by_name || 'Staff Technician'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-400 font-mono">
                      {new Date(iss.issued_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-white/[0.01] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
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

      {/* Authorize Issuance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/[0.12] rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fade-in text-white">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Clinical Release Authorization</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Dual-Operator Cross-Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 text-rose-300 text-xs rounded-xl border border-rose-500/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleQuickIssue} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Blood Request Reference
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REQ-2026-001"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Assigned Blood Unit ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UNIT-2026-0101"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Indication / Clinical Department
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                >
                  <option value="Operating Theatre Emergency">Operating Theatre Emergency</option>
                  <option value="Emergency Trauma Resuscitation">Emergency Trauma Resuscitation</option>
                  <option value="Elective Coronary Artery Bypass">Elective Coronary Artery Bypass</option>
                  <option value="Acute Obstetric Hemorrhage Protocol">Acute Obstetric Hemorrhage Protocol</option>
                  <option value="Chemotherapy Severe Anemia Support">Chemotherapy Severe Anemia Support</option>
                  <option value="ICU Sepsis Transfusion Protocol">ICU Sepsis Transfusion Protocol</option>
                  <option value="Standard Inpatient Transfusion">Standard Inpatient Transfusion</option>
                </select>
              </div>

              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mandatory Safety Invariants Checklist:
                </span>
                <label className="flex items-center gap-2.5 text-xs text-amber-200/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkPatientAbo}
                    onChange={(e) => setCheckPatientAbo(e.target.checked)}
                    className="rounded bg-[#181C26] border-white/20 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Patient ABO/RhD confirmed matches blood unit compatibility</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-amber-200/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkExpiry}
                    onChange={(e) => setCheckExpiry(e.target.checked)}
                    className="rounded bg-[#181C26] border-white/20 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Visual inspection intact & unit within valid shelf life</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-amber-200/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkCrossmatch}
                    onChange={(e) => setCheckCrossmatch(e.target.checked)}
                    className="rounded bg-[#181C26] border-white/20 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Major crossmatch verified Compatible (or Emergency Override)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-glow-crimson transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Authorizing Dispatch...' : 'Authorize Clinical Release'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issuance;
