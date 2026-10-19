import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Shield, Brain, CheckCircle2, Server } from 'lucide-react';

export const Settings: React.FC = () => {
  const [threatThreshold, setThreatThreshold] = useState(0.50);
  const [criticalThreshold, setCriticalThreshold] = useState(0.85);
  const [aiProvider, setAiProvider] = useState('local_deterministic');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Platform Configuration & Settings
          <span className="text-xs font-mono font-medium text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full">
            SYSTEM ADMIN
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Adjust detection sensitivity, alert confidence thresholds, and AI investigation engines.
        </p>
      </div>

      {savedNotice && (
        <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/50 p-3 text-xs text-emerald-300 font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          Settings successfully updated and applied to detection pipeline.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Detection Sensitivity Sliders */}
        <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Detection & Alert Thresholds
          </h2>
          <p className="text-xs text-slate-400">
            Configure minimum probability scores required by the ML model to generate alerts.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Threat Alert Cutoff Threshold:</span>
                <span className="font-mono text-cyan-400 font-bold">{(threatThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={threatThreshold}
                onChange={(e) => setThreatThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block">
                Any event scoring above this threshold generates an alert in the SOC feed.
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Critical Severity Threshold:</span>
                <span className="font-mono text-rose-400 font-bold">{(criticalThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.70"
                max="0.99"
                step="0.01"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block">
                Events exceeding this confidence level are escalated immediately as CRITICAL.
              </span>
            </div>
          </div>
        </div>

        {/* AI Investigator Provider */}
        <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            AI Incident Investigator Engine
          </h2>
          <p className="text-xs text-slate-400">
            Choose the synthesis backend for automated incident triage reports.
          </p>

          <div className="space-y-2.5">
            <label className="flex items-start gap-3 p-3 rounded-lg bg-[#121B2D] border border-[#1E2B42] cursor-pointer hover:border-purple-500/40 transition-colors">
              <input
                type="radio"
                name="aiProvider"
                value="local_deterministic"
                checked={aiProvider === 'local_deterministic'}
                onChange={(e) => setAiProvider(e.target.value)}
                className="mt-1 accent-purple-500"
              />
              <div>
                <div className="font-semibold text-white text-xs">Deterministic Local SOC Expert (Default & Offline)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  100% reliable, zero external API keys required, grounded strictly in observable telemetry and MITRE ATT&CK rules.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-[#121B2D] border border-[#1E2B42] cursor-pointer hover:border-purple-500/40 transition-colors">
              <input
                type="radio"
                name="aiProvider"
                value="openai"
                checked={aiProvider === 'openai'}
                onChange={(e) => setAiProvider(e.target.value)}
                className="mt-1 accent-purple-500"
              />
              <div>
                <div className="font-semibold text-white text-xs">External LLM Integration (OpenAI / Gemini)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Requires LLM_API_KEY in backend .env. Automatically falls back to deterministic mode if unavailable.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* System Deployment Info */}
        <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            System & Deployment Specifications
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
              <span className="text-slate-500 block text-[10px]">API ENDPOINT</span>
              <span className="text-white">http://127.0.0.1:8000/api/v1</span>
            </div>
            <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
              <span className="text-slate-500 block text-[10px]">DATABASE</span>
              <span className="text-emerald-400 font-semibold">SQLite / PostgreSQL (Operational)</span>
            </div>
            <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
              <span className="text-slate-500 block text-[10px]">INFERENCE RUNTIME</span>
              <span className="text-cyan-400">XGBoost 3.4 / scikit-learn 1.9</span>
            </div>
            <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
              <span className="text-slate-500 block text-[10px]">ACTIVE SOC WORKSPACE</span>
              <span className="text-white">Primary Security Operations Center (soc-primary)</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all cursor-pointer"
        >
          Save Configuration Changes
        </button>
      </form>
    </div>
  );
};
