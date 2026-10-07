import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Heart, Award, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';
import { donorsApi, inventoryApi } from '../services/api';

const Donors: React.FC = () => {
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState<any | null>(null);

  // New Donor Form
  const [newDonor, setNewDonor] = useState({
    name: '',
    blood_group: 'O+',
    phone: '',
    status: 'Eligible',
    last_donation_date: ''
  });

  // Collect Donation Form
  const [newUnit, setNewUnit] = useState({
    component_type: 'Red Blood Cells',
    shelf_life_days: 35,
    storage_location: 'Fridge 1, Shelf A'
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadDonors = async () => {
    try {
      setLoading(true);
      const res = await donorsApi.getAll({
        search: search || undefined,
        blood_group: bloodGroupFilter || undefined,
        status: statusFilter || undefined
      });
      setDonors(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonors();
  }, [bloodGroupFilter, statusFilter]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await donorsApi.create(newDonor);
      setMessage(`Donor ${newDonor.name} registered successfully.`);
      setShowRegisterModal(false);
      setNewDonor({ name: '', blood_group: 'O+', phone: '', status: 'Eligible', last_donation_date: '' });
      loadDonors();
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCollectModal) return;

    try {
      setSubmitting(true);
      const today = new Date().toISOString().split('T')[0];
      const expiry = new Date(Date.now() + newUnit.shelf_life_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const unitId = `UNIT-${showCollectModal.blood_group.replace('+', 'P').replace('-', 'N')}-${Date.now().toString().slice(-4)}`;

      await inventoryApi.addUnit({
        unit_id: unitId,
        donor_id: showCollectModal.donor_id,
        blood_group: showCollectModal.blood_group,
        component_type: newUnit.component_type,
        collection_date: today,
        expiry_date: expiry,
        storage_location: newUnit.storage_location
      });

      // Update donor last donation date
      await donorsApi.update(showCollectModal.donor_id, { last_donation_date: today });

      setMessage(`Donation accessioned: Unit ${unitId} (${showCollectModal.blood_group} ${newUnit.component_type}) added to inventory.`);
      setShowCollectModal(null);
      loadDonors();
    } catch (err: any) {
      alert(err.message || 'Failed to accession donation');
    } finally {
      setSubmitting(false);
    }
  };

  const eligibleCount = donors.filter(d => d.status === 'Eligible').length;
  const deferredCount = donors.filter(d => d.status === 'Deferred').length;
  const rareCount = donors.filter(d => ['O-', 'AB-', 'B-'].includes(d.blood_group)).length;

  const totalPages = Math.ceil(donors.length / itemsPerPage) || 1;
  const paginated = donors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
              Donor Registry
            </span>
            <span className="text-xs text-slate-500 font-mono">Voluntary Donor Network</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Donor Registry & Accession Protocol
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Institutional voluntary donor registry, serological phenotype qualification, and cold-chain accession.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-glow-crimson transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register Voluntary Donor</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Donors Registered</div>
          <div className="text-2xl font-bold text-white mt-1 font-display">{donors.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Verified Clinical Profiles</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Eligible Donors</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-display">{eligibleCount}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready for draw
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Safety Deferrals</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-display">{deferredCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Temporary hold window</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Rare Phenotypes</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-display">{rareCount}</div>
          <div className="text-[11px] text-cyan-400/80 mt-1">O-, AB-, B- Priority Callout</div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0F1117]/80 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search donor name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDonors()}
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#181C26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
            >
              <option value="">All Statuses</option>
              <option value="Eligible">Eligible</option>
              <option value="Deferred">Deferred</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            {donors.length} in registry
          </span>
        </div>
      </div>

      {/* Donors Table */}
      <div className="rounded-2xl bg-[#0F1117]/80 border border-white/[0.08] shadow-vault-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase font-mono tracking-wider bg-white/[0.02] border-b border-white/[0.06]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Donor ID</th>
                <th className="px-5 py-3.5 font-semibold">Donor Name & Tier</th>
                <th className="px-5 py-3.5 font-semibold">Phenotype</th>
                <th className="px-5 py-3.5 font-semibold">Contact Phone</th>
                <th className="px-5 py-3.5 font-semibold">Last Donation</th>
                <th className="px-5 py-3.5 font-semibold">Eligibility Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-2"></div>
                    <p className="font-mono text-xs">Querying voluntary donor registry...</p>
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-mono text-xs">
                    No donors found matching query parameters.
                  </td>
                </tr>
              ) : (
                paginated.map((donor) => {
                  const isRare = ['O-', 'AB-', 'B-'].includes(donor.blood_group);
                  return (
                    <tr key={donor.donor_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                        DNR-{donor.donor_id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center font-bold text-white text-[11px] font-mono">
                            {donor.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{donor.name}</span>
                            {isRare && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-400 font-bold uppercase">
                                <Award className="w-2.5 h-2.5" /> Universal Hero
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                          {donor.blood_group}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {donor.phone || 'None recorded'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                        {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'First time donor'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                          donor.status === 'Eligible'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : donor.status === 'Deferred'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-white/[0.05] text-slate-400 border-white/[0.1]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            donor.status === 'Eligible' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}></span>
                          {donor.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {donor.status === 'Eligible' ? (
                          <button
                            onClick={() => setShowCollectModal(donor)}
                            className="px-3 py-1 text-[11px] font-mono font-semibold rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                          >
                            + Accession Unit
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500">Deferred</span>
                        )}
                      </td>
                    </tr>
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, donors.length)} of {donors.length} donors
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

      {/* Register Donor Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/[0.12] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-white animate-fade-in">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Register Voluntary Donor</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Voluntary Donor Network Accession</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={newDonor.name}
                  onChange={(e) => setNewDonor({ ...newDonor, name: e.target.value })}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={newDonor.blood_group}
                    onChange={(e) => setNewDonor({ ...newDonor, blood_group: e.target.value })}
                    className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-rose-400 font-bold focus:outline-none focus:border-rose-500/50 font-mono"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 234-8891"
                    value={newDonor.phone}
                    onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
                    className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Initial Eligibility
                  </label>
                  <select
                    value={newDonor.status}
                    onChange={(e) => setNewDonor({ ...newDonor, status: e.target.value })}
                    className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                  >
                    <option value="Eligible">Eligible</option>
                    <option value="Deferred">Deferred</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Last Donation Date
                  </label>
                  <input
                    type="date"
                    value={newDonor.last_donation_date}
                    onChange={(e) => setNewDonor({ ...newDonor, last_donation_date: e.target.value })}
                    className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-glow-crimson transition-all"
                >
                  {submitting ? 'Registering...' : 'Save & Register Donor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Donation Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/[0.12] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-white animate-fade-in">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Accession Blood Donation</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Cold-Chain Intake & Labelling</p>
                </div>
              </div>
              <button
                onClick={() => setShowCollectModal(null)}
                className="w-8 h-8 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Donor Source</span>
                <span className="font-semibold text-white">{showCollectModal.name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Phenotype</span>
                <span className="font-bold text-rose-400 font-mono text-sm">{showCollectModal.blood_group}</span>
              </div>
            </div>

            <form onSubmit={handleCollectDonation} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Component Processed & Shelf-Life
                </label>
                <select
                  value={newUnit.component_type}
                  onChange={(e) => {
                    const comp = e.target.value;
                    let days = 35;
                    if (comp === 'Platelets') days = 5;
                    else if (comp === 'Plasma') days = 365;
                    setNewUnit({ ...newUnit, component_type: comp, shelf_life_days: days });
                  }}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                >
                  <option value="Red Blood Cells">Red Blood Cells (35-42 days)</option>
                  <option value="Whole Blood">Whole Blood (35 days)</option>
                  <option value="Platelets">Platelets (5 days room agitator)</option>
                  <option value="Plasma">Fresh Frozen Plasma (365 days cryo)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Cold-Chain Storage Location
                </label>
                <input
                  type="text"
                  value={newUnit.storage_location}
                  onChange={(e) => setNewUnit({ ...newUnit, storage_location: e.target.value })}
                  className="w-full bg-[#181C26] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-glow transition-all"
                >
                  {submitting ? 'Accessioning...' : 'Accession Unit into Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors;
