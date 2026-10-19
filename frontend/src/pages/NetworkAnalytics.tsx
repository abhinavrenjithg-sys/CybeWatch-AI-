import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Network,
  Radio,
  Server,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../lib/api';
import { SecurityEvent } from '../types';

export const NetworkAnalytics: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await api.getEvents({ limit: 150 });
        setEvents(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute protocol distribution
  const protoCounts: Record<string, number> = {};
  const portCounts: Record<string, number> = {};
  const talkerCounts: Record<string, { count: number; threats: number }> = {};

  events.forEach((ev) => {
    // Protocol
    const p = ev.protocol.toUpperCase();
    protoCounts[p] = (protoCounts[p] || 0) + 1;

    // Dest Port
    const portLabel = `${ev.destination_port || 80} (${ev.service || '-'})`;
    portCounts[portLabel] = (portCounts[portLabel] || 0) + 1;

    // Source IP
    const src = ev.source_ip;
    if (!talkerCounts[src]) talkerCounts[src] = { count: 0, threats: 0 };
    talkerCounts[src].count += 1;
    if (ev.prediction?.is_threat) {
      talkerCounts[src].threats += 1;
    }
  });

  const protocolData = Object.entries(protoCounts).map(([name, value]) => ({ name, value }));
  const portData = Object.entries(portCounts)
    .map(([port, count]) => ({ port, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topTalkers = Object.entries(talkerCounts)
    .map(([ip, data]) => ({ ip, count: data.count, threats: data.threats }))
    .sort((a, b) => b.threats - a.threats)
    .slice(0, 6);

  const PROTO_COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Network Flow Analytics
          <span className="text-xs font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
            L4 / L7 TELEMETRY
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deep behavioral breakdown across network protocols, targeted service ports, and anomalous threat actors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Targeted Destination Ports */}
        <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg">
          <h2 className="text-sm font-semibold text-white mb-1">Most Targeted Service Ports</h2>
          <p className="text-xs text-slate-400 mb-4">Frequency of inbound flows by destination port</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={portData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2B42" />
                <XAxis dataKey="port" stroke="#64748B" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0E1A', borderColor: '#1E2B42', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Breakdown */}
        <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white mb-1">Transport Layer Protocols</h2>
            <p className="text-xs text-slate-400 mb-4">Observed transport distribution</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROTO_COLORS[index % PROTO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0E1A', borderColor: '#1E2B42', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 pt-3 border-t border-[#1E2B42] text-xs font-mono">
            {protocolData.map((p, idx) => (
              <span key={p.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROTO_COLORS[idx % PROTO_COLORS.length] }} />
                <span className="text-slate-300">{p.name}: {p.value} flows</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Threat Originators (Top Talkers) */}
      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2B42]">
          <h2 className="text-sm font-semibold text-white">Top Threat Originators (Source Entity Profiling)</h2>
          <p className="text-xs text-slate-400">External addresses initiating the highest ratio of anomalous attacks</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D17] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1E2B42]">
              <tr>
                <th className="px-5 py-3">Source IP</th>
                <th className="px-5 py-3">Total Flows</th>
                <th className="px-5 py-3">Malicious Inbounds</th>
                <th className="px-5 py-3">Threat Ratio</th>
                <th className="px-5 py-3 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2B42]/50 text-slate-300">
              {topTalkers.length > 0 ? (
                topTalkers.map((t) => {
                  const ratio = ((t.threats / t.count) * 100).toFixed(1);
                  return (
                    <tr key={t.ip} className="hover:bg-[#121B2D] transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap font-mono font-bold text-white">
                        {t.ip}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-300">
                        {t.count}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap font-mono text-rose-400 font-bold">
                        {t.threats}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#121B2D] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full" style={{ width: `${ratio}%` }} />
                          </div>
                          <span className="text-slate-400 text-[11px]">{ratio}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          t.threats > 5 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {t.threats > 5 ? 'HIGH RISK' : 'SUSPICIOUS'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No source IP telemetry recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
