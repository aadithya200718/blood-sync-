import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, ShieldAlert, CheckCircle2, Package, ThermometerSnowflake } from 'lucide-react';
import { inventoryApi, donorsApi } from '../services/api';

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [componentFilter, setComponentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Add unit modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnit, setNewUnit] = useState({
    unit_id: '',
    donor_id: '',
    blood_group: 'O+',
    component_type: 'Red Blood Cells',
    collection_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    storage_location: 'Fridge 1, Shelf A'
  });

  // Action status message
  const [notification, setNotification] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getAll({
        search: search || undefined,
        blood_group: bloodGroupFilter || undefined,
        component_type: componentFilter || undefined,
        status: statusFilter || undefined
      });
      setInventory(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    donorsApi.getAll().then((res) => setDonors(res.data || [])).catch(console.error);
  }, [bloodGroupFilter, componentFilter, statusFilter]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.addUnit({
        ...newUnit,
        donor_id: parseInt(newUnit.donor_id, 10) || 1
      });
      setNotification(`Unit ${newUnit.unit_id} accessioned into cold-chain vault.`);
      setShowAddModal(false);
      setNewUnit({
        unit_id: '',
        donor_id: '',
        blood_group: 'O+',
        component_type: 'Red Blood Cells',
        collection_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        storage_location: 'Fridge 1, Shelf A'
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to accession blood unit');
    }
  };

  const handleDiscard = async (unitId: string) => {
    const reason = window.prompt(`Discard Unit ${unitId}? Enter clinical/quality rationale:`, 'Expired shelf life horizon');
    if (!reason) return;

    try {
      await inventoryApi.discardUnit(unitId, reason);
      setNotification(`Unit ${unitId} marked as DISCARDED with audit trace.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Discard failed');
    }
  };

  const handleQuarantine = async (unitId: string) => {
    const reason = window.prompt(`Place Unit ${unitId} in Quarantine? Enter rationale:`, 'Serology confirmation pending');
    if (!reason) return;

    try {
      await inventoryApi.quarantineUnit(unitId, reason);
      setNotification(`Unit ${unitId} placed in QUARANTINE containment.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Quarantine failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <span className="badge badge-success">Available</span>;
      case 'RESERVED': return <span className="badge badge-warning">Reserved</span>;
      case 'ISSUED': return <span className="badge badge-info">Issued</span>;
      case 'EXPIRED': return <span className="badge badge-danger">Expired</span>;
      case 'DISCARDED': return <span className="badge badge-neutral">Discarded</span>;
      case 'QUARANTINE': return <span className="badge bg-purple-500/15 text-purple-300 border-purple-500/30">Quarantine</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Accession */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">COLD-CHAIN REPOSITORY</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cryogenic & Cell Inventory Vault
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            FEFO shelf-life tracking, temperature monitoring coordinates, and physical unit custody.
          </p>
        </div>
        <button
          onClick={() => {
            const autoId = `UNIT-${Date.now().toString().slice(-6)}`;
            setNewUnit(prev => ({ ...prev, unit_id: autoId }));
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>Accession Unit</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar: Dark Glass Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3 border border-white/[0.08]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search DIN barcode, vault shelf, donor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="input-field pl-10 py-2 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select 
            value={bloodGroupFilter} 
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="input-field py-2 text-xs font-mono w-auto bg-[#0B0D12]"
          >
            <option value="">All ABO / Rh</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select 
            value={componentFilter} 
            onChange={(e) => setComponentFilter(e.target.value)}
            className="input-field py-2 text-xs font-mono w-auto bg-[#0B0D12]"
          >
            <option value="">All Components</option>
            <option value="Red Blood Cells">Red Blood Cells</option>
            <option value="Whole Blood">Whole Blood</option>
            <option value="Platelets">Platelets</option>
            <option value="Plasma">Plasma</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs font-mono w-auto bg-[#0B0D12]"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="ISSUED">Issued</option>
            <option value="EXPIRED">Expired</option>
            <option value="DISCARDED">Discarded</option>
            <option value="QUARANTINE">Quarantine</option>
          </select>
        </div>
      </div>

      {/* Inventory Vault Table */}
      <div className="glass-panel overflow-hidden border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3.5">Unit Barcode</th>
                <th className="px-5 py-3.5">ABO / Rh</th>
                <th className="px-5 py-3.5">Component</th>
                <th className="px-5 py-3.5">Collection</th>
                <th className="px-5 py-3.5">FEFO Expiration</th>
                <th className="px-5 py-3.5">Storage Coordinates</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-mono">Synchronizing vault shelf sensors...</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-mono">No cellular units match the selected parameters.</td></tr>
              ) : (
                inventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((unit) => {
                  const daysToExpiry = Math.ceil((new Date(unit.expiry_date).getTime() - Date.now()) / (1000 * 3600 * 24));
                  const isExpired = daysToExpiry <= 0;
                  const isCritical = daysToExpiry > 0 && daysToExpiry <= 7;
                  
                  return (
                    <tr key={unit.unit_id} className="table-row">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-100">{unit.unit_id}</td>
                      <td className="px-5 py-3.5">
                        <span className="badge badge-danger">
                          {unit.blood_group}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-200">{unit.component_type}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{new Date(unit.collection_date).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-medium ${
                            isExpired ? 'text-rose-400 font-bold' : isCritical ? 'text-amber-400 font-bold' : 'text-slate-300'
                          }`}>
                            {new Date(unit.expiry_date).toLocaleDateString()}
                          </span>
                          {isCritical && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {daysToExpiry}d left
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              EXPIRED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{unit.storage_location}</td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(unit.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        {unit.status === 'AVAILABLE' && (
                          <>
                            <button
                              onClick={() => handleQuarantine(unit.unit_id)}
                              title="Containment / Quarantine"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDiscard(unit.unit_id)}
                              title="Discard with Rationale"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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
        {Math.ceil(inventory.length / itemsPerPage) > 1 && (
          <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, inventory.length)} of {inventory.length} units
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
                Page {currentPage} of {Math.ceil(inventory.length / itemsPerPage)}
              </span>
              <button
                disabled={currentPage === Math.ceil(inventory.length / itemsPerPage)}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(inventory.length / itemsPerPage), p + 1))}
                className="px-3 py-1 rounded-lg border border-white/10 bg-[#0B0D12] text-slate-300 hover:text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Unit Modal: Frosted Dark Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#07080B]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-elevated max-w-md w-full p-6 space-y-4 border border-white/20 animate-slide-up">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Package className="w-5 h-5" />
                <h3 className="font-display font-bold text-white text-base">Accession Blood Unit</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Unit ID / Barcode</label>
                <input
                  type="text"
                  required
                  value={newUnit.unit_id}
                  onChange={(e) => setNewUnit({ ...newUnit, unit_id: e.target.value })}
                  className="input-field text-sm font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Associated Donor</label>
                <select
                  required
                  value={newUnit.donor_id}
                  onChange={(e) => {
                    const d = donors.find(dn => String(dn.donor_id) === e.target.value);
                    setNewUnit({
                      ...newUnit,
                      donor_id: e.target.value,
                      blood_group: d?.blood_group || newUnit.blood_group
                    });
                  }}
                  className="input-field text-xs font-mono bg-[#0B0D12]"
                >
                  <option value="">-- Select Registered Donor --</option>
                  {donors.map(d => (
                    <option key={d.donor_id} value={d.donor_id} className="bg-[#0B0D12]">
                      {d.name} ({d.blood_group}) • DNR-{d.donor_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Blood Group</label>
                  <select
                    value={newUnit.blood_group}
                    onChange={(e) => setNewUnit({ ...newUnit, blood_group: e.target.value })}
                    className="input-field text-xs font-mono font-bold text-rose-400 bg-[#0B0D12]"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg} className="bg-[#0B0D12]">{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Component</label>
                  <select
                    value={newUnit.component_type}
                    onChange={(e) => setNewUnit({ ...newUnit, component_type: e.target.value })}
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Collection Date</label>
                  <input
                    type="date"
                    required
                    value={newUnit.collection_date}
                    onChange={(e) => setNewUnit({ ...newUnit, collection_date: e.target.value })}
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">FEFO Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newUnit.expiry_date}
                    onChange={(e) => setNewUnit({ ...newUnit, expiry_date: e.target.value })}
                    className="input-field text-xs font-mono text-rose-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Storage Coordinates</label>
                <input
                  type="text"
                  required
                  value={newUnit.storage_location}
                  onChange={(e) => setNewUnit({ ...newUnit, storage_location: e.target.value })}
                  placeholder="e.g. Fridge 1, Shelf A"
                  className="input-field text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Verify & Accession</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
