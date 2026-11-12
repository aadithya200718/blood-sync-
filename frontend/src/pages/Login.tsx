import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  HeartPulse,
  Building
} from 'lucide-react';
import BloodSyncLogo from '../components/brand/BloodSyncLogo';
import { fetchApi, patientApi } from '../services/api';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('patient.demo@bloodsync.test');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [hospital, setHospital] = useState('BloodSync Demo Hospital');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const data = await patientApi.register({
          name,
          email,
          password,
          blood_group: bloodGroup,
          hospital
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/patient-portal');
      } else {
        const data = await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem(
          'user',
          JSON.stringify(data.user || { name: 'Dr. Evelyn Vance', role: 'admin' })
        );

        if (data.user?.role === 'Patient') {
          navigate('/patient-portal');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify institutional clearance.');
    } finally {
      setLoading(false);
    }
  };

  const autofillRole = (roleEmail: string, rolePass: string) => {
    setIsRegistering(false);
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col justify-between relative overflow-hidden px-4 sm:px-6 py-8 selection:bg-brand-600/30 selection:text-rose-200">
      
      {/* Background Ambient Glow & Hairline Grid */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-brand-600/12 via-rose-600/6 to-transparent rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-[450px] h-[450px] bg-sky-500/5 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Top Header Strip with Working Back to Home Link */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
            Node Online • Local Auth Gateway
          </span>
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <main className="relative w-full max-w-md mx-auto my-auto z-10 py-6 animate-slide-up">
        
        {/* Brand Presence */}
        <div className="flex flex-col items-center mb-6 text-center">
          <BloodSyncLogo variant="horizontal-dark" size="lg" className="mb-4" />
          <h1 className="font-editorial text-3xl sm:text-4xl text-white font-normal">
            {isRegistering ? 'Register as Patient' : 'Sign in to BloodSync'}
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-mono">
            {isRegistering
              ? 'Patient Intake & Clinical Allocation Identity'
              : 'Clinical Operations & Inventory Telemetry Console'}
          </p>
        </div>

        {/* Tab Selector: Login vs Register */}
        <div className="flex items-center justify-center mb-4 bg-white/[0.03] p-1 rounded-2xl border border-white/[0.08] max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-mono rounded-xl transition-all ${
              !isRegistering
                ? 'bg-brand-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Session Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-mono rounded-xl transition-all ${
              isRegistering
                ? 'bg-brand-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Patient Register
          </button>
        </div>

        {/* Refined Glassmorphic Card */}
        <div className="p-8 sm:p-9 rounded-3xl bg-[#0F1117]/95 border border-white/[0.12] shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle Hairline Gradient Header Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            {isRegistering && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      className="input-field pl-10 text-sm"
                      placeholder="e.g. Aarav Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      Blood Group
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <HeartPulse className="h-4 w-4 text-rose-400" />
                      </div>
                      <select
                        className="input-field pl-10 text-sm bg-[#090A0E]"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      Hospital
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="input-field pl-10 text-sm"
                        placeholder="Hospital Name"
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  className="input-field pl-10 text-sm"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {isRegistering ? 'Min 6 characters' : 'Institutional Passcode'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pl-10 pr-10 text-sm"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4 text-sm font-semibold tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>{isRegistering ? 'Registering...' : 'Verifying Credentials...'}</span>
                </span>
              ) : (
                <>
                  <span>{isRegistering ? 'Create Patient Identity' : 'Authenticate Session'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Pill Bar */}
          <div className="mt-6 pt-5 border-t border-white/[0.08]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Simulate Role Clearance:</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => autofillRole('patient.demo@bloodsync.test', 'password123')}
                className="px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 hover:text-white transition-all text-left truncate flex items-center justify-between group"
              >
                <span>Patient (Aarav)</span>
                <span className="text-[10px] text-rose-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <button
                type="button"
                onClick={() => autofillRole('tech.demo@bloodsync.test', 'password123')}
                className="px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 hover:text-white transition-all text-left truncate flex items-center justify-between group"
              >
                <span>Lab Technician</span>
                <span className="text-[10px] text-rose-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <button
                type="button"
                onClick={() => autofillRole('admin@bloodsync.local', 'password123')}
                className="px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 hover:text-white transition-all text-left truncate flex items-center justify-between group"
              >
                <span>Lead Admin</span>
                <span className="text-[10px] text-rose-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <button
                type="button"
                onClick={() => autofillRole('john@bloodsync.local', 'password123')}
                className="px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 hover:text-white transition-all text-left truncate flex items-center justify-between group"
              >
                <span>Staff Tech (John)</span>
                <span className="text-[10px] text-rose-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role-Based Access Control Active</span>
          </div>
        </div>

      </main>

      {/* Footer Strip */}
      <footer className="max-w-6xl w-full mx-auto text-center text-[11px] font-mono text-slate-400 z-10">
        © 2026 BloodSync Technologies. Internal Clinical Operations Network.
      </footer>

    </div>
  );
};

export default Login;
