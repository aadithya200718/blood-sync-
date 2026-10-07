import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Brain, AlertTriangle, Package, Radio, ShieldCheck, Zap } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  details?: any;
}

const AI_URL = 'http://localhost:8000/api/agents';

const AICopilot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: "Welcome to the BloodSync Neural Copilot.\n\nI am connected to the autonomous agent swarm:\n• **Inventory Sentinel** — real-time FEFO stock telemetry & cold-chain status\n• **Wastage Minimizer** — expiration velocity forecasting & redistribution\n• **Paper 10 ML Issuance Engine** — probabilistic return & crossmatch optimization\n\nSelect a tactical directive or state your clinical query.",
      agent: 'Neural Orchestrator',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: textToSend.trim(),
    };
    setMessages((prev: Message[]) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${AI_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response || 'Telemetry parsed, but no affirmative guidance generated.',
        agent: data.agent,
        details: data.details,
      };
      setMessages((prev: Message[]) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: '⚠️ Autonomous Agent Service offline or unreachable at port 8000. Operating in offline safety mode.',
          agent: 'System Invariant',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const tacticalPrompts = [
    "Run critical O- and universal donor deficit audit",
    "Identify cellular units expiring within next 72 hours",
    "Evaluate high-risk return orders for surgical wards"
  ];

  const getAgentIcon = (agent?: string) => {
    if (!agent) return <Bot className="w-4 h-4" />;
    if (agent.includes('Inventory')) return <Package className="w-4 h-4" />;
    if (agent.includes('Waste')) return <AlertTriangle className="w-4 h-4" />;
    if (agent.includes('ML') || agent.includes('Issuance')) return <Brain className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  const getAgentBadge = (agent?: string) => {
    if (!agent) return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    if (agent.includes('Inventory')) return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
    if (agent.includes('Waste')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    if (agent.includes('ML') || agent.includes('Issuance')) return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
    return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header with Agent Swarm Telemetry */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">NEURAL COPILOT AGENTS</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Autonomous Decision Support
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Multi-agent architecture trained on Paper 10 and real-time cold-chain invariants.
          </p>
        </div>

        {/* Live Swarm Status Chips */}
        <div className="flex items-center gap-2">
          <div className="badge badge-success text-[10px] py-1 px-2.5">
            <Brain className="w-3 h-3 text-emerald-400" />
            <span>SWARM: ACTIVE</span>
          </div>
          <div className="badge badge-neutral text-[10px] py-1 px-2.5">
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            <span>READ-ONLY ADVICE</span>
          </div>
        </div>
      </div>

      {/* Main HUD Chat Screen */}
      <div className="glass-panel flex flex-col border border-white/[0.08] relative overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
        {/* Quick Tactical Directive Chips */}
        <div className="p-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-rose-400" /> Tactical Prompts:
          </span>
          {tacticalPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-300 hover:text-white border border-white/[0.08] transition-all shrink-0 text-left"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat message stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-glow-crimson border border-white/20">
                  {getAgentIcon(msg.agent)}
                </div>
              )}

              <div className={`max-w-[75%] ${msg.role === 'user'
                ? 'bg-gradient-to-r from-brand-600 to-rose-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-glow-crimson border border-white/10'
                : 'glass-panel-subtle text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 border border-white/[0.08]'
              }`}>
                {msg.agent && msg.role === 'assistant' && (
                  <div className="mb-2">
                    <span className={`badge ${getAgentBadge(msg.agent)} text-[10px]`}>
                      {msg.agent}
                    </span>
                  </div>
                )}
                <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</div>

                {/* Render structured details for ML issuance */}
                {msg.details?.policy && (
                  <div className="mt-3 p-3 rounded-xl bg-[#07080B]/80 border border-white/[0.08] text-xs font-mono space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Policy Matrix:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        msg.details.policy === 'ML_GUIDED_NEWER' 
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {msg.details.policy === 'ML_GUIDED_NEWER' ? '🧠 ML Override' : '✅ FEFO Baseline'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Return Risk Probability:</span>
                      <span className="font-bold text-white">{(msg.details.return_probability * 100).toFixed(1)}%</span>
                    </div>
                    {msg.details.override_reason && (
                      <p className="text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg mt-1 text-[11px] leading-relaxed">
                        {msg.details.override_reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Render structured alerts */}
                {msg.details?.alerts && msg.details.alerts.length > 0 && (
                  <div className="mt-3 space-y-1.5 font-mono">
                    {msg.details.alerts.slice(0, 5).map((alert: string, i: number) => (
                      <div key={i} className="text-[11px] bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg p-2.5 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>{alert}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-slate-300 shrink-0 font-mono text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-rose-400 shadow-sm">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="glass-panel-subtle rounded-2xl rounded-bl-sm px-4 py-3 text-xs font-mono text-slate-400">
                Agent reasoning & inventory index synthesis in progress...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Dock */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0B0D12]/90">
          <div className="flex gap-3">
            <input
              type="text"
              className="input-field flex-1 text-sm bg-[#07080B]"
              placeholder="Ask Copilot about cold-chain levels, FEFO expiry risks, or request an ML issuance assessment..."
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary px-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider"
            >
              <span>Transmit</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICopilot;
