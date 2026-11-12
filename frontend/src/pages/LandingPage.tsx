import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Package,
  GitMerge,
  Sparkles,
  ThermometerSnowflake,
  BrainCircuit,
  AlertTriangle,
  Menu,
  X,
  Sliders
} from 'lucide-react';
import BloodSyncLogo, { BloodSyncIcon } from '../components/brand/BloodSyncLogo';
import { HeroGeometricNetwork, IsometricInventoryMatrix } from '../components/landing/GeometricCirculationArtwork';
import ApplicationShowcase from '../components/landing/ApplicationShowcase';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const workflowSteps = [
    {
      step: '01',
      title: 'Blood Request Initiation',
      role: 'Clinical Department',
      desc: 'Surgical and emergency units register acute or elective blood needs with specific component parameters, volume requirements, and clinical urgency flags.',
      badge: 'CLINICAL INTAKE',
    },
    {
      step: '02',
      title: 'Candidate Selection',
      role: 'Algorithmic Matching Engine',
      desc: 'The engine queries cryo-vault inventory, scoring ABO/Rh compatibility, antigen phenotyping (Kell, Duffy, Kidd), and FIFO expiration criteria.',
      badge: 'DECISION SUPPORT',
    },
    {
      step: '03',
      title: 'Compatibility Verification',
      role: 'Transfusion Technologist',
      desc: 'Technologists perform and document immediate-spin or AHG crossmatch assays, verifying biological compatibility before electronic verification.',
      badge: 'CLINICAL VERIFICATION',
    },
    {
      step: '04',
      title: 'Secure Reservation',
      role: 'Blood Bank Inventory',
      desc: 'Verified units are locked in an electronic crossmatch reservation hold, preventing duplicate allocation or unverified access.',
      badge: 'AUDIT INVARIANT',
    },
    {
      step: '05',
      title: 'Authorized Issuance',
      role: 'Dual-Clearance Release',
      desc: 'Final release enforces positive patient identification, cold-chain handoff confirmation, and cryptographic chain-of-custody logging.',
      badge: 'CUSTODY SECURED',
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col font-sans selection:bg-brand-600/30 selection:text-rose-200">
      
      {/* ========================================================================= */}
      {/* SECTION 1 — NAVIGATION                                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#09090B]/85 backdrop-blur-xl border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: BloodSync Logo */}
          <Link to="/" className="flex items-center group">
            <BloodSyncLogo variant="horizontal-dark" size="md" />
          </Link>

          {/* Center Navigation Links (Agiloft Minimal Style) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('platform')}
              className="hover:text-white transition-colors duration-200"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('inventory')}
              className="hover:text-white transition-colors duration-200"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className="hover:text-white transition-colors duration-200"
            >
              Workflow
            </button>
            <button
              onClick={() => scrollToSection('intelligence')}
              className="hover:text-white transition-colors duration-200"
            >
              Intelligence
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              className="hover:text-white transition-colors duration-200"
            >
              About
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/login"
              className="btn-primary text-sm flex items-center gap-2 group"
            >
              <span>Launch BloodSync</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0D0F14] border-b border-white/10 px-6 py-6 space-y-4 animate-fade-in">
            <button
              onClick={() => scrollToSection('platform')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('inventory')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200"
            >
              Workflow
            </button>
            <button
              onClick={() => scrollToSection('intelligence')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200"
            >
              Intelligence
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200"
            >
              About
            </button>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-xl border border-white/20 text-white font-medium"
              >
                Log In
              </Link>
              <Link
                to="/login"
                className="btn-primary w-full text-center"
              >
                Launch BloodSync
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* SECTION 2 — CINEMATIC HERO                                                */}
      {/* ========================================================================= */}
      <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 bg-[#09090B] overflow-hidden">
        {/* Ambient Glow Pools */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-gradient-to-b from-[#FF2E7E]/12 via-[#E11D48]/8 to-transparent rounded-full blur-[140px] pointer-events-none"></div>

        {/* Thin Geometric Circulation Artwork */}
        <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
          <HeroGeometricNetwork />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Institutional Status Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-8 animate-fade-in shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-300">
              Institutional Blood Banking & Transfusion Intelligence
            </span>
          </div>

          {/* Agiloft-Style Massive Editorial Serif Headline */}
          <h1 className="text-editorial-headline text-5xl sm:text-7xl lg:text-8xl tracking-tight text-white mb-8 max-w-5xl mx-auto font-normal">
            Every Drop Matters.
            <br />
            <span className="italic font-light bg-gradient-to-r from-white via-slate-100 to-rose-200 bg-clip-text text-transparent">
              Every Decision Counts.
            </span>
          </h1>

          {/* Secondary Description */}
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12 font-normal">
            Intelligent blood bank operations, unified in one platform. Manage inventory,
            streamline requests, support compatibility workflows, and make informed
            decisions with AI-powered insights.
          </p>

          {/* Call-to-Action Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-20">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 via-rose-600 to-rose-700 hover:from-brand-500 hover:to-rose-600 text-white font-semibold text-base shadow-glow-crimson hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <span>Launch BloodSync</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => scrollToSection('platform')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent hover:bg-white/[0.05] text-slate-200 hover:text-white font-medium text-base border border-white/20 hover:border-white/40 transition-all duration-300"
            >
              Explore the Platform
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3 — APPLICATION SHOWCASE                                          */}
        {/* ========================================================================= */}
        <div className="relative z-10 mt-6">
          <ApplicationShowcase />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — PLATFORM INTRODUCTION (WARM IVORY)                            */}
      {/* ========================================================================= */}
      <section id="platform" className="section-ivory py-28 md:py-36 relative overflow-hidden bg-grid-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Massive Editorial Copy */}
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17191D]/[0.06] border border-[#17191D]/10 text-xs font-mono uppercase tracking-widest text-[#17191D]/70">
                Architected for Clinical Zero-Error Operations
              </div>

              <h2 className="text-editorial-headline text-4xl sm:text-6xl text-[#17191D] leading-[1.08]">
                Built for the moments
                <br />
                <span className="italic">that matter most.</span>
              </h2>

              <p className="text-lg text-[#17191D]/80 leading-relaxed font-normal">
                Transfusion medicine is a discipline where timing, precise immunology,
                and cold-chain preservation converge. BloodSync replaces fractured spreadsheets
                and delayed paper manifests with institutional-grade inventory telemetry,
                algorithmic matching support, and cryptographic chain-of-custody.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-[#E11D48]/10 text-[#E11D48] flex items-center justify-center font-bold mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-sans font-bold text-base text-[#17191D]">Chain-of-Custody Invariants</h3>
                  <p className="text-xs text-[#17191D]/70 mt-1 leading-relaxed">
                    Every temperature checkpoint, crossmatch assay, and release signature is logged into an immutable audit ledger.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-[#E11D48]/10 text-[#E11D48] flex items-center justify-center font-bold mb-3">
                    <GitMerge className="w-5 h-5" />
                  </div>
                  <h3 className="font-sans font-bold text-base text-[#17191D]">Precision Matching Engine</h3>
                  <p className="text-xs text-[#17191D]/70 mt-1 leading-relaxed">
                    Evaluates antigen antibodies and inventory expiration simultaneously to prevent fatal mismatches and eliminate unnecessary discards.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Original Geometric Isometric Matrix on Ivory */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full p-8 rounded-3xl bg-white/70 border border-[#E5DFD3] shadow-xl backdrop-blur-md relative overflow-hidden">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#17191D]/60 mb-2">
                  Cryo-Vault Topology Matrix
                </div>
                <div className="font-display font-semibold text-xl text-[#17191D] mb-4">
                  Multi-Zone Inventory Geometry
                </div>
                <IsometricInventoryMatrix isIvory={true} />
                <div className="mt-4 pt-4 border-t border-[#E5DFD3] flex items-center justify-between text-xs font-mono text-[#17191D]/70">
                  <span>Standard Units: 428 Active</span>
                  <span className="text-[#E11D48] font-bold">Cold Vault: 3.8°C</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — INTELLIGENT INVENTORY (DARK)                                  */}
      {/* ========================================================================= */}
      <section id="inventory" className="section-dark py-28 md:py-36 relative bg-grid-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono uppercase tracking-widest text-rose-300 mb-4">
              Real-Time Stock Telemetry
            </div>
            <h2 className="text-editorial-headline text-4xl sm:text-6xl text-white mb-6">
              Every unit accounted for.
              <br />
              <span className="italic font-light text-slate-300">Every second considered.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              High-resolution tracking of every red cell, plasma, platelet, and cryoprecipitate unit.
              Granular visibility from collection phlebotomy to patient bedside.
            </p>
          </div>

          {/* 3-Column Architectural Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Unit Tracking */}
            <div className="p-8 rounded-3xl bg-[#0F1117]/90 border border-white/[0.08] shadow-vault-card hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-xl text-white mb-3">Unit Lifecycle Tracking</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                  Each blood bag receives a unique cryptographic identifier paired with RFID/barcode telemetry.
                  Track shelf positions, temperature history, and testing clearance status continuously.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-xs font-mono space-y-1 text-slate-300">
                <div className="text-emerald-400">● 100% Units RFID Mapped</div>
                <div>Storage: Fridge 1, Shelf B, Slot 04</div>
                <div className="text-slate-400">Status: Quarantine Clearance Verified</div>
              </div>
            </div>

            {/* Card 2: Expiration Visibility */}
            <div className="p-8 rounded-3xl bg-[#0F1117]/90 border border-white/[0.08] shadow-vault-card hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-xl text-white mb-3">Predictive Expiration Alerts</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                  Proactive countdown alerts automatically surface units reaching 7-day, 48-hour, and 24-hour thresholds,
                  enabling transfusion teams to prioritize allocation before viable blood is wasted.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-xs font-mono space-y-1 text-slate-300">
                <div className="text-amber-400">▲ 6 Units Expiring Within 48 Hours</div>
                <div>FIFO Crossmatch Priority: Engaged</div>
                <div className="text-slate-400">Automatic Re-allocation Suggestion: Active</div>
              </div>
            </div>

            {/* Card 3: Storage & Cold Chain */}
            <div className="p-8 rounded-3xl bg-[#0F1117]/90 border border-white/[0.08] shadow-vault-card hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6">
                  <ThermometerSnowflake className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-xl text-white mb-3">Continuous Cold Chain</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                  Integrated sensor telemetries verify thermal limits (2°C to 6°C for PRBC; &lt; -25°C for FFP)
                  preventing compromised biological efficacy from unnoticed refrigeration anomalies.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-xs font-mono space-y-1 text-slate-300">
                <div className="text-sky-400">● Core Temp: 3.8°C [STABLE]</div>
                <div>Sensor Health: 24/24 Online</div>
                <div className="text-slate-400">Variance: ±0.2°C Past 24h</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — COMPATIBILITY WORKFLOW (WARM IVORY)                           */}
      {/* ========================================================================= */}
      <section id="workflow" className="section-ivory py-28 md:py-36 relative bg-grid-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17191D]/[0.06] border border-[#17191D]/10 text-xs font-mono uppercase tracking-widest text-[#17191D]/70 mb-4">
              Clinical Transfusion Lifecycle
            </div>
            <h2 className="text-editorial-headline text-4xl sm:text-6xl text-[#17191D] mb-6">
              Precision throughout
              <br />
              <span className="italic">the matching process.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#17191D]/80 leading-relaxed font-normal">
              A structured five-phase pipeline connecting bedside clinician requests with lab verification,
              ensuring every unit is biologically compatible and verified before release.
            </p>
          </div>

          {/* Workflow Interactive Step Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
            {workflowSteps.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-4 rounded-2xl text-left transition-all duration-200 border ${
                  activeWorkflowStep === idx
                    ? 'bg-[#17191D] text-white border-[#17191D] shadow-lg shadow-black/10'
                    : 'bg-white text-[#17191D] border-[#E5DFD3] hover:border-[#17191D]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold ${activeWorkflowStep === idx ? 'text-rose-400' : 'text-[#E11D48]'}`}>
                    {s.step}
                  </span>
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    activeWorkflowStep === idx ? 'bg-white/10 text-slate-300' : 'bg-black/5 text-[#17191D]/60'
                  }`}>
                    {s.badge}
                  </span>
                </div>
                <div className="font-sans font-bold text-xs sm:text-sm line-clamp-1">
                  {s.title}
                </div>
              </button>
            ))}
          </div>

          {/* Active Step Detailed Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E5DFD3] shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-editorial text-[#E11D48] font-bold">
                    Stage {workflowSteps[activeWorkflowStep].step}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-[#17191D]/5 text-[#17191D]/80 border border-[#17191D]/10">
                    Responsible: {workflowSteps[activeWorkflowStep].role}
                  </span>
                </div>

                <h3 className="font-editorial text-3xl sm:text-4xl text-[#17191D]">
                  {workflowSteps[activeWorkflowStep].title}
                </h3>

                <p className="text-base text-[#17191D]/80 leading-relaxed font-normal">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>

                <div className="pt-4 flex flex-wrap gap-4 text-xs font-mono text-[#17191D]/70">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Clinical Safeguard Invariant Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Cryptographic Audit Logging</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#F8F6F1] border border-[#E5DFD3]">
                <div className="text-xs font-mono uppercase text-[#17191D]/60 mb-2">Protocol Governance Notice</div>
                <div className="text-sm font-sans font-semibold text-[#17191D] mb-3">
                  Software Recommendations vs. Clinical Verification
                </div>
                <p className="text-xs text-[#17191D]/70 leading-relaxed font-normal">
                  BloodSync distinguishes decision-support algorithms from final human clinician signoff.
                  Automated matching suggestions require authorized technologist verification prior to issuance.
                </p>
                <div className="mt-4 pt-4 border-t border-[#E5DFD3] flex items-center justify-between text-[11px] font-mono text-[#17191D]/80">
                  <span>Signoff Requirement: Tier 1 Clearance</span>
                  <span className="text-emerald-700 font-bold">2-Signer Gate</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — AI INTELLIGENCE (DARK)                                        */}
      {/* ========================================================================= */}
      <section id="intelligence" className="section-dark py-28 md:py-36 relative bg-grid-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-mono uppercase tracking-widest text-rose-300">
                Decision Support Telemetry
              </div>
              <h2 className="text-editorial-headline text-4xl sm:text-6xl text-white">
                Intelligence that supports
                <br />
                <span className="italic font-light text-slate-300">every clinical decision.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                BloodSync integrates domain-trained machine learning models designed to augment
                laboratory staff, reduce avoidable inventory discard, and provide explainable
                recommendations for complex crossmatch challenges.
              </p>
            </div>

            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#12151E] border border-white/[0.08] shadow-vault-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-500 flex items-center justify-center text-white shadow-glow-crimson">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Explainable Neural Copilot</h4>
                  <p className="text-[11px] font-mono text-slate-400">Natural Language Clinical Operations</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-black/40 p-4 rounded-xl border border-white/[0.05]">
                "Query: What is the optimal reservation strategy for tomorrow's scheduled orthopedics caseload?"
                <br /><br />
                <span className="text-rose-300">"Copilot: 4 units of B+ PRBC nearing day 32 should be staged for Patient 8812. This prevents waste while maintaining a 99.4% antigen fit."</span>
              </p>
            </div>
          </div>

          {/* 5 AI Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                title: 'Inventory Insights',
                desc: 'Real-time telemetry detects stock velocity anomalies and seasonal deficit risks.',
                icon: Sliders,
              },
              {
                title: 'Waste Reduction',
                desc: 'Predictive reallocation matches units nearing expiration to high-turnover procedures.',
                icon: AlertTriangle,
              },
              {
                title: 'ML-Supported Issuance',
                desc: 'Ranking algorithm presents top compatible candidate units ranked by safety and shelf life.',
                icon: GitMerge,
              },
              {
                title: 'Explainable Copilot',
                desc: 'Technologists can audit the biological and logistical reasoning behind every suggestion.',
                icon: Sparkles,
              },
              {
                title: 'Operational Analytics',
                desc: 'Departmental utilization trends, discard analysis, and donation forecasting.',
                icon: Activity,
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-5 rounded-2xl bg-[#0F1117] border border-white/[0.06] hover:border-brand-500/30 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-rose-400 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-sans font-bold text-sm text-white mb-2">{pillar.title}</h4>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — WORKFLOW BENEFITS (EDITORIAL GRID)                             */}
      {/* ========================================================================= */}
      <section id="benefits" className="section-ivory py-28 md:py-36 relative bg-grid-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17191D]/[0.06] border border-[#17191D]/10 text-xs font-mono uppercase tracking-widest text-[#17191D]/70 mb-4">
              Operational Impact
            </div>
            <h2 className="text-editorial-headline text-4xl sm:text-6xl text-[#17191D] mb-6">
              Designed for institutional
              <br />
              <span className="italic">excellence and safety.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#17191D]/80 leading-relaxed font-normal">
              Eliminate operational silos across clinical units, laboratory technicians,
              and inventory administrators through unified data architecture.
            </p>
          </div>

          {/* 6 Editorial Benefits Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Centralized Inventory',
                desc: 'Consolidate multiple cold storage vaults, transit shippers, and regional satellites into a single authoritative registry.',
                code: 'INFRA::UNIFIED',
              },
              {
                title: 'Faster Information Retrieval',
                desc: 'Instant lookup of patient transfusion histories, rare antibodies, and previous adverse reaction notations.',
                code: 'SPEED::LATENCY_MIN',
              },
              {
                title: 'Expiration Awareness',
                desc: 'Continuous real-time shelf life monitoring ensures maximum biological utility and systematic waste mitigation.',
                code: 'MONITOR::SHELF_LIFE',
              },
              {
                title: 'Audit Traceability',
                desc: 'Every crossmatch test, temperature log, and electronic signature is immutably recorded for regulatory inspections.',
                code: 'CUSTODY::AUDIT_LEAD',
              },
              {
                title: 'Organized Request Workflows',
                desc: 'Prioritize emergency STAT transfusions over routine elective cases with clear departmental urgency queues.',
                code: 'QUEUE::URGENCY_SORT',
              },
              {
                title: 'Operational Visibility',
                desc: 'Leadership dashboards display stock distribution, donor return rates, and cold-chain compliance at a glance.',
                code: 'METRICS::EXECUTIVE',
              },
            ].map((b) => (
              <div
                key={b.title}
                className="p-8 rounded-3xl bg-white border border-[#E5DFD3] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#E11D48] mb-3 font-semibold">
                    {b.code}
                  </div>
                  <h3 className="font-editorial text-2xl text-[#17191D] mb-3">
                    {b.title}
                  </h3>
                  <p className="text-sm text-[#17191D]/75 leading-relaxed font-normal">
                    {b.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E5DFD3] flex items-center justify-between text-xs font-mono text-[#17191D]/60">
                  <span>Standard Alignment</span>
                  <span>Active</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9 — FINAL CTA (IMMERSIVE BLACK)                                   */}
      {/* ========================================================================= */}
      <section className="section-dark py-28 md:py-36 relative overflow-hidden text-center">
        {/* Glow Halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-brand-600/15 via-rose-600/10 to-transparent rounded-full blur-[130px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-rose-600 to-rose-400 flex items-center justify-center mx-auto mb-8 text-white shadow-glow-crimson">
            <BloodSyncIcon size={36} idSuffix="cta-center" />
          </div>

          <h2 className="text-editorial-headline text-5xl sm:text-7xl lg:text-8xl text-white mb-6">
            Make every drop count.
          </h2>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            Bring clarity, intelligence, and confidence to blood bank operations.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-gradient-to-r from-brand-600 via-rose-600 to-rose-700 hover:from-brand-500 hover:to-rose-600 text-white font-semibold text-lg shadow-glow-crimson hover:shadow-2xl transition-all duration-300 group"
          >
            <span>Enter BloodSync</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10 — PREMIUM FOOTER                                               */}
      {/* ========================================================================= */}
      <footer className="bg-[#050608] border-t border-white/[0.08] relative overflow-hidden pt-20 pb-12">
        {/* Oversized Subtle Background Watermark */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 select-none pointer-events-none whitespace-nowrap opacity-[0.03]">
          <span className="font-editorial text-[18vw] text-white tracking-tighter leading-none block">
            BloodSync
          </span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            
            {/* Col 1 & 2: Brand & Mission */}
            <div className="md:col-span-2 space-y-4">
              <BloodSyncLogo variant="horizontal-dark" size="md" />
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-4 font-normal">
                BloodSync is an AI-powered blood bank inventory and transfusion operations
                management platform designed for clinical safety, cold-chain telemetry,
                and zero-error matching workflows.
              </p>
              <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>System Operational • Local Node Active</span>
              </div>
            </div>

            {/* Col 3: Platform */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-300 font-bold">Platform</div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><button onClick={() => scrollToSection('inventory')} className="hover:text-white transition-colors">Inventory Vault</button></li>
                <li><button onClick={() => scrollToSection('workflow')} className="hover:text-white transition-colors">Matching Engine</button></li>
                <li><button onClick={() => scrollToSection('intelligence')} className="hover:text-white transition-colors">AI Telemetry</button></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Clinical Console</Link></li>
              </ul>
            </div>

            {/* Col 4: Clinical Standards */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-300 font-bold">Governance</div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><span className="hover:text-white transition-colors">FDA 21 CFR Part 11 Design</span></li>
                <li><span className="hover:text-white transition-colors">AABB Transfusion Standards</span></li>
                <li><span className="hover:text-white transition-colors">CAP Laboratory Invariants</span></li>
                <li><span className="hover:text-white transition-colors">Immutable Audit Logs</span></li>
              </ul>
            </div>

            {/* Col 5: Security & Access */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-300 font-bold">Access</div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Technician Sign In</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Administrator Console</Link></li>
                <li><span className="hover:text-white transition-colors">Offline Local Mode</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400 gap-4">
            <div>
              © 2026 BloodSync Technologies. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span>Security Protocols Verified</span>
              <span>Local Offline Architecture</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
