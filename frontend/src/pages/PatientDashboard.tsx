import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  Hospital,
  Activity,
  Send,
  RefreshCw,
  Info
} from 'lucide-react';
import BloodSyncLogo from '../components/brand/BloodSyncLogo';
import { patientApi } from '../services/api';

interface PatientProfile {
  patient_id: number;
  user_id: number;
  name: string;
  blood_group: string;
  hospital: string;
  is_verified: boolean;
  verified_at: string | null;
  email: string;
}

interface BloodRequestItem {
  request_id: string;
  patient_id: number;
  blood_group: string;
  component_type: string;
  quantity: number;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Pending' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled';
  requested_at: string;
  reserved_unit_id?: string | null;
  reservation_expires_at?: string | null;
  issued_unit_id?: string | null;
  issued_at?: string | null;
}

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [requests, setRequests] = useState<BloodRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState<string | null>(null);

  const isMounted = useRef(true);

  // Fetch Authoritative Profile and Requests from Database
  const loadData = useCallback(async (isPolling: boolean = false) => {
    try {
      const [profileRes, requestsRes] = await Promise.all([
        patientApi.getProfile(),
        patientApi.getRequests()
      ]);

      if (!isMounted.current) return;

      if (profileRes?.data) {
        setProfile(profileRes.data);
      }
      if (requestsRes?.data) {
        setRequests(requestsRes.data);
      }
      if (!isPolling) setLoading(false);
    } catch (err: any) {
      if (!isMounted.current) return;
      if (!isPolling) {
        setLoading(false);
        if (err.message?.includes('denied') || err.message?.includes('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      }
    }
  }, [navigate]);

  useEffect(() => {
    isMounted.current = true;
    loadData(false);

    // Phase 7: Real-time synchronization every 2 seconds with cleanup
    const interval = setInterval(() => {
      loadData(true);
    }, 2000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [loadData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Submit Blood Request (Phase 6)
  const handleRequestBlood = async () => {
    if (!profile) return;
    setRequesting(true);
    setFeedback(null);

    try {
      const idempotencyKey = `req-${profile.patient_id}-${Date.now()}`;
      await patientApi.createRequest({
        component_type: 'Red Blood Cells',
        quantity: 1,
        urgency: 'Emergency',
        idempotency_key: idempotencyKey
      });

      setFeedback({
        type: 'success',
        message: 'Emergency O+ Blood Request successfully created and dispatched to the technician queue.'
      });
      await loadData(false);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to submit blood request.'
      });
    } finally {
      setRequesting(false);
    }
  };

  // Cancel Blood Request (Phase 13)
  const handleCancelRequest = async (requestId: string) => {
    setCancellingId(requestId);
    setFeedback(null);
    setConfirmCancelModal(null);

    try {
      await patientApi.cancelRequest(requestId);
      setFeedback({
        type: 'success',
        message: `Request ${requestId} successfully cancelled. Reserved unit has been safely released.`
      });
      await loadData(false);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to cancel request.'
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-slate-300 font-mono">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
          <p className="text-sm">Synchronizing verified clinical dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col justify-between selection:bg-brand-600/30 selection:text-rose-200">
      
      {/* Top Header Navigation */}
      <header className="h-16 bg-[#0D0F15]/90 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <BloodSyncLogo variant="horizontal-dark" size="sm" />
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 hidden sm:inline">
            Patient Portal & Transfusion Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-300 truncate max-w-[150px] sm:max-w-xs">
              {profile?.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
            title="Sign out of patient session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Terminate Session</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 animate-fade-in space-y-6">
        
        {/* Banner Alert Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border animate-slide-up ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Patient Clinical Profile Header Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0F1117] border border-white/[0.1] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <h1 className="font-editorial text-2xl sm:text-3xl text-white font-normal">
                  {profile?.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-mono text-slate-300">
                  ID: #{profile?.patient_id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Hospital className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.hospital || 'Institutional Care'}
                </span>
                <span>•</span>
                <span>Account: {profile?.email}</span>
              </div>
            </div>

            {/* Verified Clinical Blood Group Badge */}
            <div className="flex items-center gap-3 bg-[#151822] p-3.5 px-5 rounded-2xl border border-white/[0.08]">
              <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/30 text-rose-400 flex items-center justify-center font-editorial text-2xl font-semibold">
                {profile?.blood_group}
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Authoritative Blood Group
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {profile?.is_verified ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">
                        CLINICALLY VERIFIED
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400">
                        SELF-REPORTED (UNVERIFIED)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Request Action Card (Phase 5 & 6) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#12141E] via-[#0F1117] to-[#0A0B10] border border-brand-500/25 shadow-glow-crimson relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Activity className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                Emergency Blood Request Order
              </span>
            </div>

            <h2 className="font-editorial text-2xl sm:text-3xl text-white font-normal">
              Request O+ Red Blood Cells
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Initiate an institutional Emergency blood bank allocation for verified blood group <strong className="text-white">{profile?.blood_group}</strong>. The request is transmitted in real time to the laboratory technician's queue with FEFO matching prioritization.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-slate-400 text-[10px] uppercase">Blood Group</p>
                <p className="text-white font-semibold text-sm mt-0.5">{profile?.blood_group}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-slate-400 text-[10px] uppercase">Component</p>
                <p className="text-white font-semibold text-sm mt-0.5">Red Blood Cells</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-slate-400 text-[10px] uppercase">Quantity</p>
                <p className="text-white font-semibold text-sm mt-0.5">1 Unit</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <p className="text-rose-400 text-[10px] uppercase">Urgency</p>
                <p className="text-rose-300 font-semibold text-sm mt-0.5">Emergency</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleRequestBlood}
                disabled={requesting || !profile?.is_verified}
                className="btn-primary px-8 py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 shadow-xl hover:shadow-rose-600/25 disabled:opacity-50"
              >
                {requesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting Emergency Order...</span>
                  </>
                ) : (
                  <>
                    <HeartPulse className="w-4 h-4 text-rose-200" />
                    <span>REQUEST O+ BLOOD</span>
                    <Send className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {!profile?.is_verified && (
                <p className="text-xs font-mono text-amber-400 mt-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Emergency allocation is disabled until clinical staff verify your self-reported blood group.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Requests Lifecycle & Telemetry Table */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0F1117] border border-white/[0.1] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="font-editorial text-xl text-white font-normal">
                Transfusion Order History & Live Status
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Auto-sync: 2s poll
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-xs border border-dashed border-white/[0.08] rounded-2xl">
              No previous or active blood requests recorded. Click "REQUEST O+ BLOOD" above to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Request ID</th>
                    <th className="py-3 px-3">Component / Qty</th>
                    <th className="py-3 px-3">Urgency</th>
                    <th className="py-3 px-3">Live Status</th>
                    <th className="py-3 px-3">Allocated Unit</th>
                    <th className="py-3 px-3">Requested At</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {requests.map((req) => {
                    const isPending = req.status === 'Pending';
                    const isReserved = Boolean(req.reserved_unit_id) && req.status !== 'Fulfilled' && req.status !== 'Cancelled';
                    const isFulfilled = req.status === 'Fulfilled';
                    const isCancelled = req.status === 'Cancelled';

                    return (
                      <tr key={req.request_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-white">
                          {req.request_id}
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {req.component_type} ({req.quantity} unit)
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            req.urgency === 'Emergency'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                              : 'bg-white/[0.05] text-slate-300'
                          }`}>
                            {req.urgency}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {isFulfilled ? (
                            <span className="badge badge-success text-[11px] py-0.5 px-2.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>FULFILLED</span>
                            </span>
                          ) : isCancelled ? (
                            <span className="badge badge-neutral text-[11px] py-0.5 px-2.5 text-slate-400">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>CANCELLED</span>
                            </span>
                          ) : isReserved ? (
                            <span className="badge badge-warning text-[11px] py-0.5 px-2.5">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>RESERVED (24h)</span>
                            </span>
                          ) : (
                            <span className="badge badge-neutral text-[11px] py-0.5 px-2.5">
                              <Activity className="w-3 h-3 text-sky-400 animate-pulse" />
                              <span>PENDING MATCH</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {req.issued_unit_id ? (
                            <span className="text-emerald-400 font-bold">{req.issued_unit_id} (Issued)</span>
                          ) : req.reserved_unit_id ? (
                            <span className="text-amber-300 font-bold">{req.reserved_unit_id}</span>
                          ) : (
                            <span className="text-slate-500">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">
                          {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {(isPending || isReserved) && (
                            <button
                              type="button"
                              onClick={() => setConfirmCancelModal(req.request_id)}
                              disabled={cancellingId === req.request_id}
                              className="px-2.5 py-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all text-xs"
                            >
                              {cancellingId === req.request_id ? 'Cancelling...' : 'Cancel Request'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Confirmation Modal for Cancellation */}
      {confirmCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0F1117] border border-white/[0.12] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-editorial text-xl text-white font-normal">
                Confirm Request Cancellation
              </h3>
            </div>

            <p className="text-slate-300 text-xs font-mono leading-relaxed">
              Are you sure you want to cancel blood request <strong className="text-white">{confirmCancelModal}</strong>? Any actively reserved blood units will be safely released back to available inventory and technician consoles will be notified.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setConfirmCancelModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-300 hover:bg-white/[0.05] border border-white/[0.08]"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => handleCancelRequest(confirmCancelModal)}
                className="px-4 py-2 rounded-xl text-xs font-mono bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/30"
              >
                Yes, Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Strip */}
      <footer className="max-w-6xl w-full mx-auto text-center text-[11px] font-mono text-slate-500 py-6">
        © 2026 BloodSync Technologies. Institutional Blood Transfusion Allocation Subsystem.
      </footer>

    </div>
  );
};

export default PatientDashboard;
