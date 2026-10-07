import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Search, XCircle, Lock } from 'lucide-react';
import { requestsApi } from '../services/api';

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Active');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const loadReservations = async () => {
    try {
      setLoading(true);
      const res = await requestsApi.getAllReservations(statusFilter || undefined);
      setReservations(res.data || []);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [statusFilter]);

  const handleIssue = async (res: any) => {
    const reason = window.prompt(
      `Authorize issuance for Unit ${res.unit_id} (Docket: ${res.request_id})?\nEnter clinical justification / surgeon authorization code:`,
      'Emergency Operating Theatre Release'
    );
    if (!reason) return;

    try {
      setActionError('');
      await requestsApi.issue(res.request_id, res.unit_id, reason);
      setActionSuccess(`Unit ${res.unit_id} authorized & issued for request ${res.request_id}.`);
      loadReservations();
    } catch (err: any) {
      setActionError(err.message || 'Issuance failed');
    }
  };

  const handleRelease = async (res: any) => {
    if (!window.confirm(`Unlock and release reservation for unit ${res.unit_id}? Unit will immediately return to AVAILABLE inventory vault.`)) return;

    try {
      setActionError('');
      await requestsApi.cancelReservation(res.request_id, res.unit_id);
      setActionSuccess(`Time-lock on unit ${res.unit_id} revoked. Returned to available stock.`);
      loadReservations();
    } catch (err: any) {
      setActionError(err.message || 'Failed to release reservation');
    }
  };

  // Filtered list by search
  const filtered = reservations.filter(r => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (r.unit_id && r.unit_id.toLowerCase().includes(term)) ||
      (r.request_id && r.request_id.toLowerCase().includes(term)) ||
      (r.patient_name && r.patient_name.toLowerCase().includes(term)) ||
      (r.hospital && r.hospital.toLowerCase().includes(term)) ||
      (r.blood_group && r.blood_group.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="badge badge-warning">
            <Clock className="w-3 h-3 text-amber-400" /> Active Time-Lock
          </span>
        );
      case 'Fulfilled':
        return (
          <span className="badge badge-success">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fulfilled
          </span>
        );
      case 'Cancelled':
        return (
          <span className="badge badge-neutral">
            <XCircle className="w-3 h-3 text-slate-400" /> Revoked
          </span>
        );
      case 'Expired':
        return (
          <span className="badge badge-danger">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Expired Hold
          </span>
        );
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">PRE-ISSUANCE ALLOCATION</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Unit Reservations & Time-Lock Vault
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            48-hour automated time-locks allocated to specific patients pending crossmatch verification and surgical prep.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/matching" className="btn-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>Matching Engine</span>
          </Link>
          <Link to="/requests" className="btn-secondary text-xs font-mono flex items-center gap-2">
            <span>Clinical Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/30 flex items-center gap-2 text-xs font-mono animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-500/10 text-rose-300 rounded-xl border border-rose-500/30 flex items-center gap-2 text-xs font-mono animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar: Dark Glass */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3 border border-white/[0.08]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search DIN unit, docket hash, patient MRN, or surgical ward..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field pl-10 py-2 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs font-mono w-auto bg-[#0B0D12]"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active Time-Locks</option>
            <option value="Fulfilled">Fulfilled / Released</option>
            <option value="Cancelled">Revoked</option>
            <option value="Expired">Expired Holds</option>
          </select>
        </div>
      </div>

      {/* Reservations Table: Dark Glass */}
      <div className="glass-panel overflow-hidden border border-white/[0.08]">
        <div className="p-3.5 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center text-xs font-mono text-slate-400">
          <span className="text-slate-200 font-semibold">
            Tracked Time-Locks ({filtered.length} total)
          </span>
          <span className="text-[11px] text-slate-400">
            Auto-Release Rule: unissued units return to stock after 48h limit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3.5">Unit Barcode</th>
                <th className="px-5 py-3.5">ABO / Rh</th>
                <th className="px-5 py-3.5">Patient Dossier & Hospital</th>
                <th className="px-5 py-3.5">Request Docket</th>
                <th className="px-5 py-3.5">Locked Timestamp</th>
                <th className="px-5 py-3.5">Hold Expiration</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-mono">Synchronizing time-lock ledger...</td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-mono">
                    No reservations matching current parameters. Reserve units directly via the Matching Engine.
                  </td>
                </tr>
              ) : (
                paginated.map((res) => (
                  <tr key={res.reservation_id} className="table-row">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-100">{res.unit_id}</td>
                    <td className="px-5 py-3.5">
                      <span className="badge badge-danger">
                        {res.blood_group}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{res.component_type}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-200">{res.patient_name || 'Patient Dossier'}</p>
                      <p className="text-[11px] font-mono text-slate-400">{res.hospital || 'Hospital Operating Theatre'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/matching?requestId=${res.request_id}`} className="text-xs font-mono font-bold text-rose-400 hover:text-rose-300">
                        {res.request_id}
                      </Link>
                      {res.urgency && (
                        <span className={`block text-[10px] font-mono uppercase ${res.urgency === 'Emergency' ? 'text-rose-400 font-bold' : res.urgency === 'Urgent' ? 'text-amber-400' : 'text-slate-400'}`}>
                          {res.urgency}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">
                      {new Date(res.reserved_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-amber-300 font-semibold text-xs">
                      {new Date(res.expires_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(res.status)}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {res.status === 'Active' ? (
                        <>
                          <button
                            onClick={() => handleIssue(res)}
                            className="btn-primary text-xs py-1 px-3 inline-block"
                          >
                            Release & Issue
                          </button>
                          <button
                            onClick={() => handleRelease(res)}
                            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-white/[0.04] text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 inline-block transition-all"
                          >
                            Unlock Hold
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-mono text-slate-500">Archived</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-white/10 bg-[#0B0D12] text-slate-300 hover:text-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-200">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-white/10 bg-[#0B0D12] text-slate-300 hover:text-white disabled:opacity-40"
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

export default Reservations;
