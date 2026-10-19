import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  Filter,
  Search,
  CheckCircle,
  Clock,
  UserCheck,
  Brain,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { Alert, Severity, AlertStatus } from '../types';
import { SeverityBadge, StatusBadge } from '../components/Badge';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selected Alert for Details Drawer
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAlerts({
        search: search || undefined,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        limit: 100,
      });
      setAlerts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [search, severityFilter, statusFilter, categoryFilter]);

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      const updated = await api.updateAlertStatus(alertId, newStatus, `Analyst marked alert as ${newStatus}`);
      setSelectedAlert(updated);
      fetchAlerts();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !newNote.trim()) return;

    try {
      setSubmittingNote(true);
      await api.addAlertNote(selectedAlert.id, newNote.trim(), false);
      const refreshed = await api.getAlertDetail(selectedAlert.id);
      setSelectedAlert(refreshed);
      setNewNote('');
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Alert Management & Triage
            <span className="text-xs font-mono font-medium text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
              SOC TRIAGE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review threat detections, transition lifecycle states, append analyst notes, and dispatch AI investigations.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-300 text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Alerts
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Alert ID, IPs, title..."
            className="w-full bg-[#121B2D] border border-[#1E2B42] pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Severity */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>

        {/* Category */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="">All</option>
            <option value="DoS">DoS</option>
            <option value="PortScan">PortScan</option>
            <option value="BruteForce">BruteForce</option>
            <option value="Botnet">Botnet</option>
            <option value="Exploits">Exploits</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D17] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1E2B42]">
              <tr>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Alert Title / Category</th>
                <th className="px-5 py-3">Source → Destination</th>
                <th className="px-5 py-3">MITRE Technique</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2B42]/50 text-slate-300">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-[#121B2D] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{alert.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Category: {alert.category}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-300">
                      {alert.event?.source_ip} <span className="text-slate-500">→</span> {alert.event?.destination_ip}:{alert.event?.destination_port}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-400">
                      {alert.mitre_technique || '-'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-cyan-400 font-semibold">
                      {(alert.threat_score * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono text-cyan-400 font-semibold">
                      Open Triage →
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No alerts found. Click 'Replay Stream Batch' on top to generate sample detections.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Alert Details Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[#0A0E1A] border-l border-[#1E2B42] p-6 h-full overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E2B42] pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400">ALERT CASE #{selectedAlert.id.slice(0, 8)}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedAlert.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Severity, Status & Quick Action Buttons */}
            <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={selectedAlert.severity} />
                  <StatusBadge status={selectedAlert.status} />
                </div>
                <button
                  onClick={() => navigate('/investigator', { state: { alertId: selectedAlert.id } })}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-md shadow-purple-950 cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Investigate with AI
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1E2B42]/60 text-xs">
                <span className="text-slate-400 self-center mr-1">Change Status:</span>
                <button
                  onClick={() => handleStatusChange(selectedAlert.id, 'investigating')}
                  className="px-2.5 py-1 rounded bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-cyan-300 cursor-pointer"
                >
                  Mark Investigating
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAlert.id, 'resolved')}
                  className="px-2.5 py-1 rounded bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-emerald-300 cursor-pointer"
                >
                  Resolve Alert
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAlert.id, 'false_positive')}
                  className="px-2.5 py-1 rounded bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-400 cursor-pointer"
                >
                  Mark False Positive
                </button>
              </div>
            </div>

            {/* MITRE & Detection Summary */}
            <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-4 space-y-2 text-xs">
              <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">MITRE ATT&CK Mapping</h4>
              <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42] font-mono text-cyan-300">
                {selectedAlert.mitre_technique || 'T1000 - General Threat Detection'}
              </div>
              <p className="text-slate-400 mt-2">{selectedAlert.summary}</p>
            </div>

            {/* Telemetry Evidence */}
            {selectedAlert.event && (
              <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-4 space-y-3">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Supporting Telemetry Evidence</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#121B2D] border border-[#1E2B42]">
                    <span className="text-slate-500 block text-[10px]">SOURCE IP</span>
                    <span className="text-white">{selectedAlert.event.source_ip}:{selectedAlert.event.source_port}</span>
                  </div>
                  <div className="p-2 rounded bg-[#121B2D] border border-[#1E2B42]">
                    <span className="text-slate-500 block text-[10px]">TARGET IP</span>
                    <span className="text-cyan-300">{selectedAlert.event.destination_ip}:{selectedAlert.event.destination_port}</span>
                  </div>
                  <div className="p-2 rounded bg-[#121B2D] border border-[#1E2B42]">
                    <span className="text-slate-500 block text-[10px]">PROTOCOL / DURATION</span>
                    <span className="text-white">{selectedAlert.event.protocol.toUpperCase()} / {selectedAlert.event.duration}s</span>
                  </div>
                  <div className="p-2 rounded bg-[#121B2D] border border-[#1E2B42]">
                    <span className="text-slate-500 block text-[10px]">PACKETS IN / OUT</span>
                    <span className="text-white">{selectedAlert.event.src_pkts} / {selectedAlert.event.dst_pkts}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Investigation Notes Thread */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                Analyst Notes & Audit Thread
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedAlert.notes && selectedAlert.notes.length > 0 ? (
                  selectedAlert.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-[#121B2D] border border-[#1E2B42] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span className="text-cyan-400 font-semibold">{note.author_name || 'SOC Analyst'}</span>
                        <span>{new Date(note.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-200">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-[#121B2D]/50 border border-[#1E2B42] text-xs text-slate-500 text-center">
                    No investigation notes logged yet.
                  </div>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record investigation findings, firewall checks, or containment steps..."
                  rows={3}
                  className="w-full bg-[#121B2D] border border-[#1E2B42] p-2.5 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  {submittingNote ? 'Adding...' : 'Post Investigation Note'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
