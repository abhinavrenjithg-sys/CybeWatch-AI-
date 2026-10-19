import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Radio,
  Play
} from 'lucide-react';
import { api } from '../lib/api';
import { SecurityEvent } from '../types';
import { SeverityBadge } from '../components/Badge';

export const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchIp, setSearchIp] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('');
  const [threatOnly, setThreatOnly] = useState<boolean | undefined>(undefined);
  
  // Modals & Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Selected Event for details drawer
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEvents({
        limit: 100,
        source_ip: searchIp || undefined,
        protocol: protocolFilter || undefined,
        threat_only: threatOnly,
      });
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load security events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchIp, protocolFilter, threatOnly]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadStatus('Uploading and parsing flow telemetry...');
      const res = await api.uploadCSV(file, false);
      setUploadStatus(`Processed ${res.total_ingested} records (${res.threats_detected} threats flagged)`);
      setTimeout(() => setUploadStatus(null), 5000);
      fetchEvents();
    } catch (err: any) {
      setUploadStatus(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplaySample = async () => {
    try {
      setLoading(true);
      await api.simulateTraffic(20);
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Security Events Telemetry
            <span className="text-xs font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
              CANONICAL INGESTION
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Normalized network flow characteristics, L4/L7 telemetry, and model classifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-300 text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            {isUploading ? 'Uploading...' : 'Upload Flow CSV'}
          </button>

          <button
            onClick={handleReplaySample}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Replay Sample Batch
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div className="rounded-lg bg-cyan-950/40 border border-cyan-800/50 p-3 text-xs text-cyan-300 font-mono flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          {uploadStatus}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-4 flex flex-wrap items-center gap-4">
        {/* Search IP */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchIp}
            onChange={(e) => setSearchIp(e.target.value)}
            placeholder="Filter by Source IP..."
            className="w-full bg-[#121B2D] border border-[#1E2B42] pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Protocol Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Protocol:</span>
          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            className="bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="">All</option>
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
          </select>
        </div>

        {/* Threat Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Classification:</span>
          <select
            value={threatOnly === undefined ? '' : threatOnly ? 'threat' : 'benign'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'threat') setThreatOnly(true);
              else if (val === 'benign') setThreatOnly(false);
              else setThreatOnly(undefined);
            }}
            className="bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="">All Traffic</option>
            <option value="threat">Threats Only</option>
            <option value="benign">Benign Only</option>
          </select>
        </div>

        <button
          onClick={fetchEvents}
          className="p-1.5 rounded-lg bg-[#121B2D] border border-[#1E2B42] text-slate-400 hover:text-white transition-colors ml-auto cursor-pointer"
          title="Refresh Events"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Events Table */}
      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D17] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1E2B42]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Source → Destination</th>
                <th className="px-5 py-3">Proto / Service</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Packets / Bytes</th>
                <th className="px-5 py-3">Prediction</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2B42]/50 text-slate-300">
              {events.length > 0 ? (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-[#121B2D] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(ev.event_timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono">
                      <span className="text-white">{ev.source_ip}</span>
                      <span className="text-slate-500 mx-1">:</span>
                      <span className="text-slate-400">{ev.source_port}</span>
                      <span className="text-slate-500 mx-1.5">→</span>
                      <span className="text-cyan-300">{ev.destination_ip}</span>
                      <span className="text-slate-500 mx-1">:</span>
                      <span className="text-slate-400">{ev.destination_port}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap uppercase font-mono text-[11px]">
                      <span className="text-slate-200">{ev.protocol}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-slate-400">{ev.service}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-400">
                      {ev.duration.toFixed(3)}s
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-400">
                      {ev.src_pkts + ev.dst_pkts} pkts ({((ev.src_bytes + ev.dst_bytes)/1024).toFixed(1)} KB)
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium">
                      {ev.prediction ? (
                        <SeverityBadge severity={ev.prediction.severity} size="sm" />
                      ) : (
                        <span className="text-slate-500 font-mono">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono">
                      {ev.prediction ? (
                        <span className={ev.prediction.is_threat ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                          {(ev.prediction.threat_score * 100).toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-cyan-400">
                      Inspect →
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No security events found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Event Telemetry Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-[#0A0E1A] border-l border-[#1E2B42] p-6 h-full overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E2B42] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Event Telemetry Inspector</h3>
                <span className="text-xs font-mono text-slate-400">ID: {selectedEvent.id}</span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Prediction Banner */}
            {selectedEvent.prediction && (
              <div className="rounded-lg bg-[#0E1524] border border-[#1E2B42] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">ML Prediction</span>
                  <SeverityBadge severity={selectedEvent.prediction.severity} />
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-bold text-white">{selectedEvent.prediction.predicted_category}</div>
                  <div className="font-mono text-sm text-cyan-400">
                    Score: {(selectedEvent.prediction.threat_score * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Inference Latency: {selectedEvent.prediction.latency_ms.toFixed(3)} ms | Model: {selectedEvent.prediction.model_version}
                </div>
              </div>
            )}

            {/* Explainability Contributions */}
            {selectedEvent.prediction?.feature_contributions && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Feature Decision Contributions (Explainability)
                </h4>
                <div className="space-y-1.5">
                  {selectedEvent.prediction.feature_contributions.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-[#121B2D] border border-[#1E2B42]">
                      <span className="font-mono text-slate-300">{feat.feature}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500">val={feat.raw_value}</span>
                        <span className={feat.direction === 'positive' ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                          {feat.contribution > 0 ? `+${feat.contribution.toFixed(4)}` : feat.contribution.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Telemetry Matrix */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Flow Characteristics
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
                  <span className="text-slate-500 block text-[10px]">SOURCE IP:PORT</span>
                  <span className="text-white">{selectedEvent.source_ip}:{selectedEvent.source_port}</span>
                </div>
                <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
                  <span className="text-slate-500 block text-[10px]">DEST IP:PORT</span>
                  <span className="text-cyan-300">{selectedEvent.destination_ip}:{selectedEvent.destination_port}</span>
                </div>
                <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
                  <span className="text-slate-500 block text-[10px]">PROTOCOL / SERVICE</span>
                  <span className="text-white">{selectedEvent.protocol.toUpperCase()} / {selectedEvent.service}</span>
                </div>
                <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
                  <span className="text-slate-500 block text-[10px]">DURATION</span>
                  <span className="text-white">{selectedEvent.duration} seconds</span>
                </div>
                <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
                  <span className="text-slate-500 block text-[10px]">SOURCE BYTES / PKTS</span>
                  <span className="text-white">{selectedEvent.src_bytes} B ({selectedEvent.src_pkts} pkts)</span>
                </div>
                <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
                  <span className="text-slate-500 block text-[10px]">DEST BYTES / PKTS</span>
                  <span className="text-white">{selectedEvent.dst_bytes} B ({selectedEvent.dst_pkts} pkts)</span>
                </div>
                <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
                  <span className="text-slate-500 block text-[10px]">SOURCE LOAD / DEST LOAD</span>
                  <span className="text-white">{selectedEvent.sload.toFixed(1)} / {selectedEvent.dload.toFixed(1)} bps</span>
                </div>
                <div className="p-2.5 rounded bg-[#121B2D] border border-[#1E2B42]">
                  <span className="text-slate-500 block text-[10px]">STTL / DTTL</span>
                  <span className="text-white">{selectedEvent.sttl} / {selectedEvent.dttl}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2 rounded-lg bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close Telemetry Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
