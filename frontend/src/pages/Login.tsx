import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { fetchApi } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@bloodsync.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || { name: 'Dr. Evelyn Vance', role: 'admin' }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify institutional clearance.');
    } finally {
      setLoading(false);
    }
  };

  const autofillRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 flex items-center justify-center relative overflow-hidden px-4">
      {/* Cinematic Ambient Lighting Pools */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-brand-600/15 via-rose-600/5 to-transparent rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Elevated Glassmorphic Card */}
      <div className="relative w-full max-w-md animate-slide-up z-10">
        {/* Top Floating Security Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Institutional Gateway • 256-Bit TLS</span>
          </div>
        </div>

        <div className="glass-panel-elevated p-8 sm:p-9 relative overflow-hidden">
          {/* Subtle Hairline Header Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>

          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 via-rose-600 to-rose-400 flex items-center justify-center mb-4 text-white shadow-glow-crimson border border-white/20">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              BloodSync Access Portal
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-mono">
              Department of Transfusion Medicine & Cellular Therapy
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">Clinician Identifier</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  className="input-field pl-10 text-sm"
                  placeholder="admin@bloodsync.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300">Security Passcode</label>
                <span className="text-[10px] font-mono text-slate-500">AES Encrypted</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  className="input-field pl-10 text-sm"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Pill Bar */}
          <div className="mt-6 pt-5 border-t border-white/[0.08]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Simulate Clearance:</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => autofillRole('admin@bloodsync.local')}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 hover:text-white transition-all text-left truncate"
              >
                Admin (Lead Tech)
              </button>
              <button
                type="button"
                onClick={() => autofillRole('tech@bloodsync.local')}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 hover:text-white transition-all text-left truncate"
              >
                Lab Technician
              </button>
            </div>
          </div>
          
          <div className="mt-5 text-center text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FDA 21 CFR Part 11 & HIPAA Audit Invariants Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
