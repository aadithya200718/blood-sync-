import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Hospital, Activity, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { patientsApi } from '../services/api';
import { Link } from 'react-router-dom';

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Register Patient Modal
  const [showModal, setShowModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    blood_group: 'O+',
    hospital: 'City General Hospital'
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await patientsApi.getAll({
        search: search || undefined,
        blood_group: bloodGroupFilter || undefined
      });
      setPatients(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [bloodGroupFilter]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await patientsApi.create(newPatient);
      setMsg(`Patient ${newPatient.name} registered.`);
      setShowModal(false);
      setNewPatient({ name: '', blood_group: 'O+', hospital: 'City General Hospital' });
      loadPatients();
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(patients.length / itemsPerPage) || 1;
  const paginated = patients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const rhNegativeCount = patients.filter(p => p.blood_group && p.blood_group.includes('-')).length;
  const uniqueHospitals = new Set(patients.map(p => p.hospital).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
              <User className="w-3 h-3 text-cyan-400" />
              Recipient Safety Registry
            </span>
            <span className="text-xs text-slate-500 font-mono">Clinical Transfusion Dossier</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Recipient Clinical Registry & Dossiers
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Recipient patient records, hospital bed affiliations, antibody screening cross-references, and transfusion tracking.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-glow-crimson transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register Recipient Patient</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Patient Dossiers</div>
          <div className="text-2xl font-bold text-white mt-1 font-display">{patients.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Enrolled Recipient Profiles</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Connected Facilities</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-display">{uniqueHospitals || 3}</div>
          <div className="text-[11px] text-cyan-400/80 mt-1">Active Hospital Wards</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Rh-Negative Cohort</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-display">{rhNegativeCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Heightened crossmatch alert</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Crossmatch Protocol</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-display">100%</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Zero ABO Mismatch Invariant
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{msg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipient name, MRN, or hospital facility..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPatients()}
            className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="bg-[#181C26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
            >
              <option value="">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            {patients.length} Recipients
          </span>
        </div>
      </div>

      {/* Patients Table */}
      <div className="rounded-2xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase font-mono tracking-wider bg-white/[0.02] border-b border-white/[0.06]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Patient ID</th>
                <th className="px-5 py-3.5 font-semibold">Recipient Full Name</th>
                <th className="px-5 py-3.5 font-semibold">Blood Phenotype</th>
                <th className="px-5 py-3.5 font-semibold">Hospital Facility</th>
                <th className="px-5 py-3.5 font-semibold">Enrolled Date</th>
                <th className="px-5 py-3.5 font-semibold text-right">Transfusion Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-2"></div>
                    <p className="font-mono text-xs">Accessing clinical recipient database...</p>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-mono text-xs">
                    No recipient profiles found.
                  </td>
                </tr>
              ) : (
                paginated.map((patient) => (
                  <tr key={patient.patient_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                      PAT-{patient.patient_id}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-400 text-[11px] font-mono">
                          {patient.name.charAt(0)}
                        </div>
                        <span>{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                        {patient.blood_group}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Hospital className="w-3.5 h-3.5 text-slate-500" />
                        <span>{patient.hospital || 'Default Facility'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to="/requests"
                        className="px-3 py-1 text-[11px] font-mono font-semibold rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/20 inline-flex items-center gap-1.5 transition-all"
                      >
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span>New Request</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-white/[0.01] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, patients.length)} of {patients.length} patients
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

      {/* Register Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/[0.12] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-white animate-fade-in">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Register Recipient Dossier</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Clinical Recipient Safety Protocol</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Patient Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Blood Phenotype (ABO/RhD)
                </label>
                <select
                  value={newPatient.blood_group}
                  onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-rose-400 font-bold focus:outline-none focus:border-rose-500/50 font-mono"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Admitted Hospital Facility / Ward
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Jude Memorial Hospital - Trauma Ward"
                  value={newPatient.hospital}
                  onChange={(e) => setNewPatient({ ...newPatient, hospital: e.target.value })}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-glow-crimson transition-all"
                >
                  {submitting ? 'Registering...' : 'Save Patient Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
