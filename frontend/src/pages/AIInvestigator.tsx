import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Brain,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ListChecks,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { api } from '../lib/api';
import { Alert, AIInvestigationResponse } from '../types';

export const AIInvestigator: React.FC = () => {
  const location = useLocation();
  const initialAlertId = (location.state as any)?.alertId;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string>(initialAlertId || '');
  const [investigation, setInvestigation] = useState<AIInvestigationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analystPrompt, setAnalystPrompt] = useState('');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await api.getAlerts({ limit: 50 });
        setAlerts(data);
        if (!selectedAlertId && data.length > 0) {
          setSelectedAlertId(data[0].id);
        }
      } catch (err: any) {
        console.error(err);
      }
    };
    loadAlerts();
  }, []);

  const handleRunInvestigation = async (alertIdToRun?: string) => {
    const targetId = alertIdToRun || selectedAlertId;
    if (!targetId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.investigate({
        alert_id: targetId,
        query: analystPrompt || undefined
      });
      setInvestigation(res);
    } catch (err: any) {
      setError(err.message || 'Investigation request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAlertId) {
      handleRunInvestigation(selectedAlertId);
    }
  }, [selectedAlertId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          AI Incident Investigator
          <span className="text-xs font-mono font-medium text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full">
            EVIDENCE-GROUNDED REASONING
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Synthesizes verified event telemetry, model attributions, and attack hypotheses into structured defensive triage playbooks.
        </p>
      </div>

      {/* Target Alert Selector & Query Input */}
      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Select Alert Case to Investigate:
            </label>
            <select
              value={selectedAlertId}
              onChange={(e) => setSelectedAlertId(e.target.value)}
              className="w-full bg-[#121B2D] border border-[#1E2B42] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {alerts.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.severity.toUpperCase()}] {a.title} ({a.event?.source_ip})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            <button
              onClick={() => handleRunInvestigation()}
              disabled={loading || !selectedAlertId}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md shadow-purple-950 cursor-pointer transition-all"
            >
              <Brain className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Synthesizing...' : 'Run Investigation'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-4 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Investigation Report Display */}
      {investigation ? (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="rounded-xl bg-gradient-to-r from-purple-950/30 to-blue-950/20 border border-purple-800/40 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Executive Incident Triage Summary
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Generated: {new Date(investigation.generated_at).toLocaleTimeString()} ({investigation.provider})
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans mt-1">
              {investigation.summary.replace(/\*\*/g, '')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Observable Facts (Strict Evidence) */}
            <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                1. Observable Facts & Telemetry
              </h3>
              <p className="text-[11px] text-slate-400">
                Strict facts grounded in recorded network packets and model outputs (zero speculation).
              </p>
              <ul className="space-y-2 mt-2">
                {investigation.observed_evidence.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-[#121B2D] p-2.5 rounded-lg border border-[#1E2B42]/70 font-mono text-[11px]">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Attack Hypotheses */}
            <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                2. Attack Hypotheses & MITRE ATT&CK
              </h3>
              <p className="text-[11px] text-slate-400">
                Potential explanations evaluated against observed flow telemetry and known TTPs.
              </p>
              <div className="space-y-2 mt-2">
                {investigation.attack_hypotheses.map((hyp, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#121B2D] border border-[#1E2B42] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{hyp.hypothesis}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        hyp.likelihood === 'High' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-slate-500/15 text-slate-400'
                      }`}>
                        {hyp.likelihood} Likelihood
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{hyp.basis}</p>
                    <div className="font-mono text-[10px] text-purple-400 pt-1">
                      MITRE: {hyp.mitre_id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3. Recommended Defensive Actions */}
            <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-400" />
                  3. Recommended Defensive Actions
                </h3>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  HUMAN APPROVAL MANDATORY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Actionable mitigation and verification steps. Automatic firewall execution is prevented by policy.
              </p>
              <div className="space-y-2 mt-2">
                {investigation.recommended_actions.map((act, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#121B2D] border border-[#1E2B42] space-y-1 text-xs">
                    <div className="font-semibold text-emerald-400">{act.step}</div>
                    <p className="text-slate-300 text-[11px]">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Missing Telemetry & Uncertainty */}
            <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  4. Missing Information / Telemetry Gaps
                </h3>
                <p className="text-[11px] text-slate-400 mb-2">
                  Data points not present in transport telemetry needed for 100% conclusive root cause.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {investigation.missing_telemetry.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-[#121B2D] p-2 rounded border border-[#1E2B42] text-[11px]">
                      <span className="text-amber-400 shrink-0">?</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-[#1E2B42] text-xs">
                <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px] block mb-1">
                  Model Confidence & Uncertainty Statement:
                </span>
                <p className="text-slate-400 italic font-mono text-[11px]">
                  "{investigation.confidence_statement}"
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-16 text-center text-slate-500 text-xs">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
          Select an alert case and click 'Run Investigation' to generate an evidence-grounded SOC triage report.
        </div>
      )}
    </div>
  );
};
