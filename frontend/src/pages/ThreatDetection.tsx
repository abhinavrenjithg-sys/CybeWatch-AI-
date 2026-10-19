import React, { useState } from 'react';
import {
  Crosshair,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';
import { Prediction } from '../types';
import { SeverityBadge } from '../components/Badge';

const PRESETS = [
  {
    name: 'SYN Flood (DoS Attack)',
    category: 'DoS',
    data: {
      source_ip: '198.51.100.23',
      destination_ip: '10.0.0.2',
      destination_port: 80,
      protocol: 'tcp',
      service: 'http',
      duration: 0.02,
      src_bytes: 32000,
      dst_bytes: 80,
      src_pkts: 800,
      dst_pkts: 2,
      sload: 12800000.0,
      dload: 32000.0,
      sttl: 48,
      dttl: 0,
      loss_rate: 0.45,
    }
  },
  {
    name: 'SSH Brute Force Attack',
    category: 'BruteForce',
    data: {
      source_ip: '185.220.101.5',
      destination_ip: '10.0.0.5',
      destination_port: 22,
      protocol: 'tcp',
      service: 'ssh',
      duration: 2.8,
      src_bytes: 5400,
      dst_bytes: 2800,
      src_pkts: 55,
      dst_pkts: 40,
      sload: 15428.0,
      dload: 8000.0,
      sttl: 55,
      dttl: 64,
      loss_rate: 0.01,
    }
  },
  {
    name: 'Nmap Port Scan Sweep',
    category: 'PortScan',
    data: {
      source_ip: '45.33.32.156',
      destination_ip: '192.168.1.45',
      destination_port: 1433,
      protocol: 'tcp',
      service: '-',
      duration: 0.002,
      src_bytes: 44,
      dst_bytes: 0,
      src_pkts: 1,
      dst_pkts: 0,
      sload: 176000.0,
      dload: 0.0,
      sttl: 52,
      dttl: 0,
      loss_rate: 0.0,
    }
  },
  {
    name: 'Legitimate HTTPS Session',
    category: 'Benign',
    data: {
      source_ip: '192.168.1.102',
      destination_ip: '10.0.0.8',
      destination_port: 443,
      protocol: 'tcp',
      service: 'ssl',
      duration: 1.25,
      src_bytes: 1800,
      dst_bytes: 14500,
      src_pkts: 18,
      dst_pkts: 24,
      sload: 11520.0,
      dload: 92800.0,
      sttl: 64,
      dttl: 64,
      loss_rate: 0.0,
    }
  },
  {
    name: 'Web Application Exploit (SQLi)',
    category: 'Exploits',
    data: {
      source_ip: '91.240.118.172',
      destination_ip: '10.0.0.3',
      destination_port: 8080,
      protocol: 'tcp',
      service: 'http',
      duration: 0.85,
      src_bytes: 24500,
      dst_bytes: 1200,
      src_pkts: 32,
      dst_pkts: 14,
      sload: 230588.0,
      dload: 11294.0,
      sttl: 50,
      dttl: 64,
      loss_rate: 0.03,
    }
  }
];

export const ThreatDetection: React.FC = () => {
  const [formData, setFormData] = useState<any>(PRESETS[0].data);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: val }));
  };

  const handleRunInference = async () => {
    try {
      setEvaluating(true);
      setIngestSuccess(null);
      const res = await api.testPredict(formData);
      setPrediction(res);
    } catch (err: any) {
      alert(`Inference failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleIngestIntoSOC = async () => {
    try {
      const res = await api.ingestEvent({
        ...formData,
        is_synthetic: true,
        ingestion_source: 'detection_sandbox',
      });
      setIngestSuccess(`Event successfully committed to SOC stream (ID: ${res.id.slice(0, 8)}).`);
      setTimeout(() => setIngestSuccess(null), 4000);
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Threat Detection Sandbox
          <span className="text-xs font-mono font-medium text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full">
            REAL-TIME INFERENCE
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Evaluate live flow parameters against the production XGBoost classifier, inspect latency, and examine explainability weights.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
          Select Attack / Baseline Scenario:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFormData(p.data);
                setPrediction(null);
                setIngestSuccess(null);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-semibold text-white">Flow Telemetry Parameters</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Source IP</label>
              <input
                type="text"
                value={formData.source_ip || ''}
                onChange={(e) => handleInputChange('source_ip', e.target.value)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Destination IP</label>
              <input
                type="text"
                value={formData.destination_ip || ''}
                onChange={(e) => handleInputChange('destination_ip', e.target.value)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Dest Port</label>
              <input
                type="number"
                value={formData.destination_port || 80}
                onChange={(e) => handleInputChange('destination_port', parseInt(e.target.value) || 0)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Protocol</label>
              <select
                value={formData.protocol || 'tcp'}
                onChange={(e) => handleInputChange('protocol', e.target.value)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg text-white focus:outline-none"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Service</label>
              <input
                type="text"
                value={formData.service || '-'}
                onChange={(e) => handleInputChange('service', e.target.value)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Duration (s)</label>
              <input
                type="number"
                step="0.001"
                value={formData.duration || 0}
                onChange={(e) => handleInputChange('duration', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Source Packets</label>
              <input
                type="number"
                value={formData.src_pkts || 0}
                onChange={(e) => handleInputChange('src_pkts', parseInt(e.target.value) || 0)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Dest Packets</label>
              <input
                type="number"
                value={formData.dst_pkts || 0}
                onChange={(e) => handleInputChange('dst_pkts', parseInt(e.target.value) || 0)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Source Bytes</label>
              <input
                type="number"
                value={formData.src_bytes || 0}
                onChange={(e) => handleInputChange('src_bytes', parseInt(e.target.value) || 0)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Dest Bytes</label>
              <input
                type="number"
                value={formData.dst_bytes || 0}
                onChange={(e) => handleInputChange('dst_bytes', parseInt(e.target.value) || 0)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Source TTL</label>
              <input
                type="number"
                value={formData.sttl || 64}
                onChange={(e) => handleInputChange('sttl', parseInt(e.target.value) || 64)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Loss Rate (0 - 1)</label>
              <input
                type="number"
                step="0.01"
                value={formData.loss_rate || 0}
                onChange={(e) => handleInputChange('loss_rate', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#121B2D] border border-[#1E2B42] px-2.5 py-1.5 rounded-lg font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-[#1E2B42]">
            <button
              onClick={handleRunInference}
              disabled={evaluating}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              {evaluating ? 'Running Model Inference...' : 'Evaluate Threat with XGBoost'}
            </button>

            <button
              onClick={handleIngestIntoSOC}
              className="flex items-center gap-1.5 bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-300 py-2.5 px-4 rounded-lg text-xs font-medium cursor-pointer"
              title="Commit to active database as security event and generate alert if threat"
            >
              Ingest & Generate Alert
            </button>
          </div>

          {ingestSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {ingestSuccess}
            </div>
          )}
        </div>

        {/* Right Prediction Output (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white mb-1">ML Inference Result</h2>
            <p className="text-xs text-slate-400 mb-4">Real-time model score & feature weights</p>

            {prediction ? (
              <div className="space-y-4">
                {/* Result Hero Banner */}
                <div className={`p-4 rounded-xl border ${
                  prediction.is_threat ? 'bg-rose-950/30 border-rose-800/40' : 'bg-emerald-950/30 border-emerald-800/40'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Classification</span>
                    <SeverityBadge severity={prediction.severity} />
                  </div>
                  <div className="text-2xl font-bold text-white">{prediction.predicted_category}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 font-mono text-xs">
                    <span className="text-slate-400">Confidence Score:</span>
                    <span className="text-cyan-400 font-bold text-sm">{(prediction.threat_score * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 font-mono text-[11px] text-slate-500">
                    <span>Inference Latency:</span>
                    <span>{prediction.latency_ms.toFixed(3)} ms</span>
                  </div>
                </div>

                {/* Class Probabilities Bar */}
                {prediction.class_probabilities && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Class Probabilities
                    </span>
                    <div className="space-y-1.5">
                      {Object.entries(prediction.class_probabilities).map(([cls, prob]) => (
                        <div key={cls} className="space-y-0.5">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{cls}</span>
                            <span className="text-slate-400">{(prob * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-[#121B2D] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${cls === 'Benign' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature Contributions */}
                {prediction.feature_contributions && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Top Influential Features (SHAP/Attribution)
                    </span>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {prediction.feature_contributions.map((feat, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-[#121B2D] border border-[#1E2B42] font-mono">
                          <span className="text-slate-300">{feat.feature}</span>
                          <span className={feat.direction === 'positive' ? 'text-rose-400' : 'text-emerald-400'}>
                            {feat.contribution > 0 ? `+${feat.contribution.toFixed(4)}` : feat.contribution.toFixed(4)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 text-xs">
                <Crosshair className="w-8 h-8 text-slate-600 mb-2 stroke-1" />
                Click 'Evaluate Threat with XGBoost' to run inference on the telemetry parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
