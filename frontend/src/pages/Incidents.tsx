import React, { useEffect, useState } from 'react';
import {
  Layers,
  ShieldAlert,
  Flame,
  CheckCircle2,
  RefreshCw,
  Play,
  ArrowRight,
  Server
} from 'lucide-react';
import { api } from '../lib/api';
import { Incident } from '../types';
import { SeverityBadge } from '../components/Badge';

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [correlating, setCorrelating] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleRunCorrelation = async () => {
    try {
      setCorrelating(true);
      await api.runCorrelation(180);
      await fetchIncidents();
    } catch (err: any) {
      alert(`Correlation failed: ${err.message}`);
    } finally {
      setCorrelating(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const full = await api.getIncidentDetail(id);
      setSelectedIncident(full);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Incident Correlation Campaigns
            <span className="text-xs font-mono font-medium text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full">
              CORRELATION ENGINE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic rule-based aggregation of related alert events across time windows and shared entities.
          </p>
        </div>

        <button
          onClick={handleRunCorrelation}
          disabled={correlating}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium shadow-md shadow-purple-950 cursor-pointer transition-all"
        >
          <Layers className={`w-3.5 h-3.5 ${correlating ? 'animate-spin' : ''}`} />
          {correlating ? 'Running Clustering Engine...' : 'Run Correlation Engine Now'}
        </button>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {incidents.length > 0 ? (
          incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => handleOpenDetail(inc.id)}
              className="rounded-xl bg-[#0E1524] border border-[#1E2B42] hover:border-purple-500/50 p-5 shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-purple-400 font-bold">{inc.incident_number}</span>
                  <SeverityBadge severity={inc.severity} size="sm" />
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-2">{inc.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.description}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#1E2B42]/60 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Source Actor:</span>
                  <span className="text-white font-semibold">{inc.lead_source_ip || 'Multiple'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Correlated Alerts:</span>
                  <span className="text-cyan-400 font-bold">{inc.alert_count} alerts</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Rule:</span>
                  <span className="text-slate-500 truncate max-w-[150px]">{inc.correlation_rule}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs font-medium text-purple-400 hover:text-purple-300">
                <span>Inspect campaign telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl bg-[#0E1524] border border-[#1E2B42] p-12 text-center text-slate-500 text-xs">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2 stroke-1" />
            No correlated incidents discovered yet. Ingest security flows or click 'Run Correlation Engine Now'.
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0E1A] border border-[#1E2B42] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E2B42] pb-4">
              <div>
                <span className="text-xs font-mono text-purple-400">{selectedIncident.incident_number}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedIncident.title}</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-4 text-xs space-y-2">
              <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">CORRELATION METADATA</span>
              <p className="text-slate-200">{selectedIncident.description}</p>
              <div className="flex gap-4 pt-2 text-slate-400 font-mono text-[11px]">
                <span>Status: <strong className="text-white uppercase">{selectedIncident.status}</strong></span>
                <span>Rule: <strong className="text-cyan-400">{selectedIncident.correlation_rule}</strong></span>
              </div>
            </div>

            {/* Correlated Alerts List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Associated Alerts ({selectedIncident.alerts?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedIncident.alerts?.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-[#121B2D] border border-[#1E2B42] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{a.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {a.event?.source_ip} → {a.event?.destination_ip}:{a.event?.destination_port} ({a.event?.protocol})
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-cyan-400 font-bold">{(a.threat_score * 100).toFixed(1)}%</span>
                      <SeverityBadge severity={a.severity} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedIncident(null)}
              className="w-full py-2.5 rounded-lg bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close Campaign Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
