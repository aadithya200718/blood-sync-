import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Brain,
  GitMerge,
  FileCheck
} from 'lucide-react';
import { requestsApi, aiApi } from '../services/api';

const Matching: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRequestId = searchParams.get('requestId') || '';

  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState(initialRequestId);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [recommendedUnits, setRecommendedUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Guidance state
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Action states
  const [activeTab, setActiveTab] = useState<'matches' | 'reservations' | 'history'>('matches');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingUnitId, setProcessingUnitId] = useState('');

  // Crossmatch modal
  const [crossmatchModalUnit, setCrossmatchModalUnit] = useState<string | null>(null);
  const [crossmatchResult, setCrossmatchResult] = useState<'Compatible' | 'Incompatible'>('Compatible');

  useEffect(() => {
    requestsApi.getAll().then((res) => {
      setAllRequests(res.data || []);
      if (!selectedRequestId && res.data && res.data.length > 0) {
        setSelectedRequestId(res.data[0].request_id);
      }
    }).catch(console.error);
  }, []);

  const loadMatchData = async (reqId: string) => {
    if (!reqId) return;
    try {
      setLoading(true);
      setActionSuccess('');
      setActionError('');

      // Fetch request details and match recommendations
      const [detailsRes, matchRes] = await Promise.all([
        requestsApi.getById(reqId),
        requestsApi.match(reqId)
      ]);

      const req = detailsRes.data;
      setRequestDetails(req);
      setRecommendedUnits(matchRes.data?.recommendedUnits || []);

      // Trigger AI ML issuance advice in parallel
      if (req) {
        setAiLoading(true);
        try {
          const aiData = await aiApi.getIssuanceRecommendation({
            blood_group: req.blood_group,
            component_type: req.component_type,
            department: req.hospital || 'General Surgery',
            urgency: req.urgency,
            units_requested: req.quantity
          });
          setAiRecommendation(aiData);
        } catch (e) {
          console.warn('AI recommendation unavailable', e);
          setAiRecommendation(null);
        } finally {
          setAiLoading(false);
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Error loading match recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      loadMatchData(selectedRequestId);
    }
  }, [selectedRequestId]);

  const handleReserve = async (unitId: string) => {
    try {
      setProcessingUnitId(unitId);
      setActionError('');
      await requestsApi.reserve(selectedRequestId, unitId);
      setActionSuccess(`Success: Unit ${unitId} reserved for request ${selectedRequestId}`);
      loadMatchData(selectedRequestId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reserve unit');
    } finally {
      setProcessingUnitId('');
    }
  };

  const handleIssue = async (unitId: string) => {
    try {
      setProcessingUnitId(unitId);
      setActionError('');
      const reason = window.prompt('Enter clinical issuance justification / reason code:', 'Emergency Physician Authorization') || 'Routine Transfusion';
      await requestsApi.issue(selectedRequestId, unitId, reason);
      setActionSuccess(`Authorized & Issued: Unit ${unitId} has been successfully issued.`);
      loadMatchData(selectedRequestId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to issue unit');
    } finally {
      setProcessingUnitId('');
    }
  };

  const handleSaveCrossmatch = async () => {
    if (!crossmatchModalUnit) return;
    try {
      setActionError('');
      await requestsApi.recordCrossmatch(selectedRequestId, {
        unit_id: crossmatchModalUnit,
        result: crossmatchResult
      });
      setCrossmatchModalUnit(null);
      setActionSuccess(`Crossmatch result for ${crossmatchModalUnit} saved as ${crossmatchResult}.`);
      loadMatchData(selectedRequestId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to record crossmatch');
    }
  };

  const handleCancelReservation = async (unitId: string) => {
    if (!window.confirm(`Release reservation for unit ${unitId}?`)) return;
    try {
      await requestsApi.cancelReservation(selectedRequestId, unitId);
      setActionSuccess(`Reservation for unit ${unitId} released back to inventory.`);
      loadMatchData(selectedRequestId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to release reservation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Request Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitMerge className="w-4 h-4 text-rose-400" />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">ALGORITHMIC COMPATIBILITY ENGINE</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Matching & Allocation Engine
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Deterministic serological compatibility, FEFO prioritization, and Paper 10 ML wastage optimization.
          </p>
        </div>

        {/* Request selector dropdown */}
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Request Docket:</label>
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(e.target.value)}
            className="input-field text-xs font-mono py-2 bg-[#0F1117] border-white/10 text-white rounded-xl focus:ring-brand-500/40"
          >
            {allRequests.map((r) => (
              <option key={r.request_id} value={r.request_id} className="bg-[#0B0D12]">
                {r.request_id} — {r.blood_group} ({r.component_type}) [{r.urgency}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/30 flex items-center gap-3 animate-fade-in text-xs font-mono">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-500/10 text-rose-300 rounded-xl border border-rose-500/30 flex items-center gap-3 animate-fade-in text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Request Details Banner: Dark Glass Dossier */}
      {requestDetails && (
        <div className="glass-panel p-6 border-l-4 border-l-rose-500 relative overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Docket Identifier</span>
              <p className="font-mono font-bold text-white text-sm mt-0.5">{requestDetails.request_id}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Patient Dossier</span>
              <p className="font-medium text-slate-200 text-sm mt-0.5">{requestDetails.patient_name || 'Anonymous Emergency'}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Required Phenotype</span>
              <p className="mt-1">
                <span className="badge badge-danger text-xs px-2.5 py-0.5">
                  {requestDetails.blood_group}
                </span>
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Component Type</span>
              <p className="font-medium text-slate-200 text-sm mt-0.5">{requestDetails.component_type}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Dosage & Urgency</span>
              <p className="font-mono text-xs text-slate-200 mt-1">
                {requestDetails.quantity} Unit(s) • <span className={`font-bold ${requestDetails.urgency === 'Emergency' ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>{requestDetails.urgency}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Docket Status</span>
              <p className="mt-1">
                <span className="badge badge-neutral text-[11px]">{requestDetails.status}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Main Matching Table + AI Copilot Guidance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Matching Units Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-white/[0.08] gap-6">
            <button
              onClick={() => setActiveTab('matches')}
              className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'matches'
                  ? 'border-rose-500 text-rose-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Recommended Units</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/[0.06] text-[10px]">
                {recommendedUnits.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'reservations'
                  ? 'border-rose-500 text-rose-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Active Time-Locks</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/[0.06] text-[10px]">
                {requestDetails?.reservations?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-rose-500 text-rose-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Issuance Log</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/[0.06] text-[10px]">
                {requestDetails?.issuances?.length || 0}
              </span>
            </button>
          </div>

          {activeTab === 'matches' && (
            <div className="glass-panel overflow-hidden border border-white/[0.08]">
              <div className="p-3.5 bg-white/[0.02] border-b border-white/[0.06] flex justify-between items-center text-xs font-mono text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Stored Procedure Evaluated: <code className="text-rose-400 font-mono">match_request()</code> (Deterministic FEFO)
                </span>
                <span className="text-[11px] text-slate-400">Row-level locking active</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="table-header bg-white/[0.02]">
                    <tr>
                      <th className="px-5 py-3">Unit Barcode</th>
                      <th className="px-5 py-3">ABO / Rh</th>
                      <th className="px-5 py-3">FEFO Expiry</th>
                      <th className="px-5 py-3">Crossmatch Result</th>
                      <th className="px-5 py-3">Storage Location</th>
                      <th className="px-5 py-3 text-right">Clinical Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500 font-mono">Querying cryo-inventory index...</td></tr>
                    ) : recommendedUnits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-mono">
                          No compatible available units in stock. Check inventory vault or initiate emergency donor recall.
                        </td>
                      </tr>
                    ) : (
                      recommendedUnits.map((unit) => {
                        return (
                          <tr key={unit.unit_id} className="table-row">
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-100">{unit.unit_id}</td>
                            <td className="px-5 py-3.5">
                              <span className="badge badge-danger">
                                {unit.blood_group}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-300">
                              {new Date(unit.expiry_date).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5">
                              {unit.crossmatch_status === 'Compatible' ? (
                                <span className="badge badge-success">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Compatible
                                </span>
                              ) : unit.crossmatch_status === 'Incompatible' ? (
                                <span className="badge badge-danger">
                                  ✕ Incompatible
                                </span>
                              ) : (
                                <button
                                  onClick={() => setCrossmatchModalUnit(unit.unit_id)}
                                  className="text-xs font-mono text-sky-400 hover:text-sky-300 underline underline-offset-2 flex items-center gap-1"
                                >
                                  <FileCheck className="w-3 h-3" /> Record Test
                                </button>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-400">{unit.storage_location}</td>
                            <td className="px-5 py-3.5 text-right space-x-2">
                              <button
                                onClick={() => handleReserve(unit.unit_id)}
                                disabled={processingUnitId === unit.unit_id}
                                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                              >
                                Reserve 48h
                              </button>
                              <button
                                onClick={() => handleIssue(unit.unit_id)}
                                disabled={processingUnitId === unit.unit_id}
                                className="btn-primary text-xs py-1 px-3"
                              >
                                Issue Unit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="glass-panel overflow-hidden border border-white/[0.08]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="table-header bg-white/[0.02]">
                    <tr>
                      <th className="px-5 py-3">Reservation Hash</th>
                      <th className="px-5 py-3">Unit ID</th>
                      <th className="px-5 py-3">Locked At</th>
                      <th className="px-5 py-3">Auto-Release At</th>
                      <th className="px-5 py-3">Lock Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {requestDetails?.reservations?.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-mono">No active time-locked units for this docket.</td></tr>
                    ) : (
                      requestDetails?.reservations?.map((res: any) => (
                        <tr key={res.reservation_id} className="table-row">
                          <td className="px-5 py-3.5 font-mono text-slate-400">RES-{res.reservation_id}</td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-100">{res.unit_id}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-400">{new Date(res.reserved_at).toLocaleTimeString()}</td>
                          <td className="px-5 py-3.5 font-mono text-amber-300 font-semibold">{new Date(res.expires_at).toLocaleTimeString()}</td>
                          <td className="px-5 py-3.5">
                            <span className="badge badge-warning">{res.status}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            {res.status === 'Active' && (
                              <>
                                <button
                                  onClick={() => handleIssue(res.unit_id)}
                                  className="btn-primary text-xs py-1 px-2.5"
                                >
                                  Release & Issue
                                </button>
                                <button
                                  onClick={() => handleCancelReservation(res.unit_id)}
                                  className="px-2.5 py-1 text-xs font-mono rounded-lg bg-white/[0.05] hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-all"
                                >
                                  Unlock
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="glass-panel overflow-hidden border border-white/[0.08]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="table-header bg-white/[0.02]">
                    <tr>
                      <th className="px-5 py-3">Dispatch ID</th>
                      <th className="px-5 py-3">Unit ID</th>
                      <th className="px-5 py-3">Clinician</th>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Clinical Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {requestDetails?.issuances?.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-mono">No units issued yet for this docket.</td></tr>
                    ) : (
                      requestDetails?.issuances?.map((iss: any) => (
                        <tr key={iss.issuance_id} className="table-row">
                          <td className="px-5 py-3.5 font-mono text-slate-400">ISS-{iss.issuance_id}</td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-100">{iss.unit_id}</td>
                          <td className="px-5 py-3.5 text-slate-300">{iss.issued_by_name || `Staff #${iss.issued_by}`}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-400">{new Date(iss.issued_at).toLocaleString()}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-200">{iss.reason_code}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: AI Copilot & Safety Guidance */}
        <div className="space-y-6">
          {/* ML Issuance Guidance HUD (Paper 10) */}
          <div className="glass-panel p-6 border border-violet-500/20 bg-gradient-to-b from-violet-500/10 via-[#0F1117] to-[#0F1117] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center gap-2 text-violet-300 font-display font-bold text-sm mb-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <h3>Neural Issuance Guidance</h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mb-4">
              Paper 10 (arXiv:2411.14939) optimization model evaluating transfusion wastage vs. return probability.
            </p>

            {aiLoading ? (
              <div className="py-6 text-center text-xs font-mono text-slate-400 animate-pulse">
                Evaluating clinical request parameters...
              </div>
            ) : aiRecommendation ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Transfusion Return Risk</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-display text-2xl font-bold text-white">
                      {Math.round((aiRecommendation.return_probability || 0.25) * 100)}%
                    </span>
                    <span className={`badge ${
                      (aiRecommendation.return_probability || 0) > 0.5 ? 'badge-warning' : 'badge-success'
                    }`}>
                      {(aiRecommendation.return_probability || 0) > 0.5 ? 'Elevated Return' : 'Direct Transfusion'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Recommended Allocation Policy</span>
                  <p className="text-xs font-mono font-bold text-rose-300 mt-1">
                    {aiRecommendation.policy || 'FEFO Standard'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {aiRecommendation.rationale || aiRecommendation.recommendation || 'Issue oldest compatible unit to minimize shelf expiry.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-400 bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.06]">
                Standard FEFO algorithm active. Select a request to review automated guidance.
              </div>
            )}
          </div>

          {/* Clinical Safety Protocol Card */}
          <div className="glass-panel p-6 border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-white font-display font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4>Safety Invariant Enforcements</h4>
            </div>
            <ul className="text-xs font-mono text-slate-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Deterministic ABO compatibility verified via database stored procedure.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Row-level locking (`SELECT ... FOR UPDATE`) prevents concurrent double allocations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>AI guidance is strictly read-only; human clinical staff authorization required for final release.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Record Crossmatch Modal: High-Security Frosted Dialog */}
      {crossmatchModalUnit && (
        <div className="fixed inset-0 z-50 bg-[#07080B]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-elevated max-w-sm w-full p-6 space-y-4 border border-white/20 animate-slide-up">
            <div className="flex items-center gap-2 text-rose-400">
              <FileCheck className="w-5 h-5" />
              <h3 className="text-sm font-display font-bold text-white">Record Crossmatch Result</h3>
            </div>
            
            <p className="text-xs font-mono text-slate-300">
              Unit: <strong className="text-white">{crossmatchModalUnit}</strong> for request <strong className="text-white">{selectedRequestId}</strong>
            </p>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Serological Reaction Outcome:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCrossmatchResult('Compatible')}
                  className={`py-2 px-3 text-xs font-mono font-bold rounded-xl border text-center transition-all ${
                    crossmatchResult === 'Compatible'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-glow-emerald'
                      : 'bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  ✓ Compatible
                </button>
                <button
                  type="button"
                  onClick={() => setCrossmatchResult('Incompatible')}
                  className={`py-2 px-3 text-xs font-mono font-bold rounded-xl border text-center transition-all ${
                    crossmatchResult === 'Incompatible'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-glow-crimson'
                      : 'bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  ✕ Incompatible
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setCrossmatchModalUnit(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCrossmatch}
                className="btn-primary text-xs"
              >
                Sign Off Crossmatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matching;
