import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Clock, CheckCircle2, XCircle, Activity, GitMerge, FilePlus } from 'lucide-react';
import { requestsApi, patientsApi } from '../services/api';

const Requests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    patient_id: '',
    blood_group: 'O+',
    component_type: 'Red Blood Cells',
    quantity: 1,
    urgency: 'Routine'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await requestsApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        urgency: urgencyFilter || undefined
      });
      setRequests(res.data || []);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    patientsApi.getAll().then(res => setPatients(res.data || [])).catch(console.error);
  }, [statusFilter, urgencyFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');
      await requestsApi.create({
        patient_id: parseInt(newRequest.patient_id, 10),
        blood_group: newRequest.blood_group,
        component_type: newRequest.component_type,
        quantity: Number(newRequest.quantity),
        urgency: newRequest.urgency
      });
      setShowCreateModal(false);
      setNewRequest({
        patient_id: '',
        blood_group: 'O+',
        component_type: 'Red Blood Cells',
        quantity: 1,
        urgency: 'Routine'
      });
      loadRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to formulate clinical request');
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Emergency':
        return <span className="badge badge-danger animate-pulse shadow-glow-crimson"><AlertTriangle className="w-3 h-3" /> STAT EMERGENCY</span>;
      case 'Urgent':
        return <span className="badge badge-warning"><Clock className="w-3 h-3" /> URGENT</span>;
      default:
        return <span className="badge badge-neutral">ROUTINE</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="badge badge-warning">Pending Allocation</span>;
      case 'Partially Fulfilled':
        return <span className="badge badge-info">Partial Fulfillment</span>;
      case 'Fulfilled':
        return <span className="badge badge-success"><CheckCircle2 className="w-3 h-3" /> Fulfilled</span>;
      case 'Cancelled':
        return <span className="badge badge-neutral"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-rose-400" />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">CLINICAL DEMAND STREAM</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Blood Requests & Allocation Queue
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Trauma triage, surgeon requests, automated allocation, and crossmatch readiness.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>Formulate Request</span>
        </button>
      </div>

      {/* Filter and Search Bar: Dark Glass */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3 border border-white/[0.08]">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search request ID, patient MRN, surgical ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 py-2 text-xs font-mono"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs font-mono w-auto bg-[#0B0D12]"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Fulfilled">Partially Fulfilled</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="input-field py-2 text-xs font-mono w-auto bg-[#0B0D12]"
          >
            <option value="">All Urgencies</option>
            <option value="Emergency">STAT Emergency</option>
            <option value="Urgent">Urgent OR</option>
            <option value="Routine">Routine Elective</option>
          </select>
        </div>
      </div>

      {/* Requests Table: Dark Obsidian */}
      <div className="glass-panel overflow-hidden border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3.5">Docket ID</th>
                <th className="px-5 py-3.5">Patient Dossier & Hospital</th>
                <th className="px-5 py-3.5">Required Phenotype</th>
                <th className="px-5 py-3.5">Component</th>
                <th className="px-5 py-3.5">Dosage</th>
                <th className="px-5 py-3.5">Clinical Urgency</th>
                <th className="px-5 py-3.5">Pipeline Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-mono">
                    Querying clinical demand stream...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-mono">
                    No active blood requests found matching parameters.
                  </td>
                </tr>
              ) : (
                requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((req) => (
                  <tr key={req.request_id} className="table-row">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-100">{req.request_id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-200">{req.patient_name || `Patient #${req.patient_id}`}</div>
                      <div className="text-[11px] font-mono text-slate-400">{req.hospital || 'Hospital General Surgery'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="badge badge-danger">
                        {req.blood_group}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{req.component_type}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-200">{req.quantity} U</td>
                    <td className="px-5 py-3.5">{getUrgencyBadge(req.urgency)}</td>
                    <td className="px-5 py-3.5">{getStatusBadge(req.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {req.status === 'Pending' || req.status === 'Partially Fulfilled' ? (
                        <Link
                          to={`/matching?requestId=${req.request_id}`}
                          className="btn-primary text-xs py-1 px-3 inline-flex items-center gap-1.5"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                          <span>Match Units</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/matching?requestId=${req.request_id}`}
                          className="text-slate-400 hover:text-slate-200 font-mono text-xs underline underline-offset-2"
                        >
                          View Trace
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {Math.ceil(requests.length / itemsPerPage) > 1 && (
          <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, requests.length)} of {requests.length} requests
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
                Page {currentPage} of {Math.ceil(requests.length / itemsPerPage)}
              </span>
              <button
                disabled={currentPage === Math.ceil(requests.length / itemsPerPage)}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(requests.length / itemsPerPage), p + 1))}
                className="px-3 py-1 rounded-lg border border-white/10 bg-[#0B0D12] text-slate-300 hover:text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Request Modal: Frosted Dark Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#07080B]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-elevated max-w-lg w-full p-6 space-y-4 border border-white/20 animate-slide-up">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <FilePlus className="w-5 h-5" />
                <h3 className="font-display font-bold text-white text-base">Formulate Clinical Blood Request</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 text-rose-300 text-xs rounded-xl border border-rose-500/30 font-mono">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Select Patient Record
                </label>
                <select
                  required
                  value={newRequest.patient_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const p = patients.find((pat) => String(pat.patient_id) === pid);
                    setNewRequest({
                      ...newRequest,
                      patient_id: pid,
                      blood_group: p?.blood_group || newRequest.blood_group
                    });
                  }}
                  className="input-field text-xs font-mono bg-[#0B0D12]"
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map((pat) => (
                    <option key={pat.patient_id} value={pat.patient_id} className="bg-[#0B0D12]">
                      {pat.name} ({pat.blood_group}) • {pat.hospital} • MRN-{pat.patient_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    ABO / Rh Phenotype
                  </label>
                  <select
                    value={newRequest.blood_group}
                    onChange={(e) => setNewRequest({ ...newRequest, blood_group: e.target.value })}
                    className="input-field text-xs font-mono font-bold text-rose-400 bg-[#0B0D12]"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg} className="bg-[#0B0D12]">{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Component Type
                  </label>
                  <select
                    value={newRequest.component_type}
                    onChange={(e) => setNewRequest({ ...newRequest, component_type: e.target.value })}
                    className="input-field text-xs font-mono bg-[#0B0D12]"
                  >
                    <option value="Red Blood Cells" className="bg-[#0B0D12]">Red Blood Cells</option>
                    <option value="Whole Blood" className="bg-[#0B0D12]">Whole Blood</option>
                    <option value="Platelets" className="bg-[#0B0D12]">Platelets</option>
                    <option value="Plasma" className="bg-[#0B0D12]">Plasma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Prescribed Dosage (Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={newRequest.quantity}
                    onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="input-field text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Clinical Priority Tier
                  </label>
                  <select
                    value={newRequest.urgency}
                    onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value })}
                    className="input-field text-xs font-mono bg-[#0B0D12]"
                  >
                    <option value="Routine" className="bg-[#0B0D12]">Routine Elective</option>
                    <option value="Urgent" className="bg-[#0B0D12]">Urgent Operating Room</option>
                    <option value="Emergency" className="bg-[#0B0D12]">STAT Trauma Emergency</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {submitting ? 'Transmitting...' : 'Sign & Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
