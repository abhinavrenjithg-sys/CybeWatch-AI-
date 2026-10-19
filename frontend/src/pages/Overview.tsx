import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Flame,
  Layers,
  Zap,
  ArrowUpRight,
  RefreshCw,
  ShieldAlert,
  Server
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
import { DashboardAnalytics, Alert } from '../types';
import { MetricCard } from '../components/MetricCard';
import { SeverityBadge, StatusBadge } from '../components/Badge';

const CATEGORY_COLORS: Record<string, string> = {
  Benign: '#10B981',
  DoS: '#EF4444',
  PortScan: '#F97316',
  BruteForce: '#F59E0B',
  Botnet: '#A855F7',
  Exploits: '#EC4899',
};

export const Overview: React.FC = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashData, alertsData] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getAlerts({ limit: 6 })
      ]);
      setAnalytics(dashData);
      setRecentAlerts(alertsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !analytics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm text-slate-400 font-mono">Syncing SOC telemetry pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Security Operations Center
            <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              LIVE MONITORING
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry ingestion, ML threat scoring, and automated alert triage.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Feed
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-4 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Flows Processed"
          value={analytics?.total_events_processed.toLocaleString() || '0'}
          subtitle="Network flow telemetry"
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
          accentColor="cyan"
        />
        <MetricCard
          title="Threats Detected"
          value={analytics?.threats_detected.toLocaleString() || '0'}
          subtitle={`${analytics?.threat_ratio || 0}% malicious ratio`}
          icon={<Flame className="w-4 h-4 text-rose-400" />}
          accentColor="red"
          trend={{ value: `${analytics?.threat_ratio}% rate`, isPositive: false }}
        />
        <MetricCard
          title="Active Alerts"
          value={analytics?.active_alerts || 0}
          subtitle="Pending analyst triage"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          accentColor="amber"
        />
        <MetricCard
          title="Open Incidents"
          value={analytics?.open_incidents || 0}
          subtitle="Correlated campaigns"
          icon={<Layers className="w-4 h-4 text-purple-400" />}
          accentColor="default"
        />
        <MetricCard
          title="Inference Latency"
          value={`${analytics?.avg_latency_ms || 0.05} ms`}
          subtitle="XGBoost per-event speed"
          icon={<Zap className="w-4 h-4 text-emerald-400" />}
          accentColor="emerald"
          trend={{ value: 'Real-time', isPositive: true }}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Volume Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Event Telemetry Stream</h2>
              <p className="text-xs text-slate-400">Total flows vs verified threat detections over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
                Total Flows
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                Threats
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics?.volume_timeline && analytics.volume_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.volume_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="threatColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2B42" />
                  <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0E1A', borderColor: '#1E2B42', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="total_events" stroke="#06B6D4" fillOpacity={1} fill="url(#totalColor)" strokeWidth={2} />
                  <Area type="monotone" dataKey="threat_events" stroke="#EF4444" fillOpacity={1} fill="url(#threatColor)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No telemetry recorded yet. Click 'Replay Stream Batch' in the top bar.
              </div>
            )}
          </div>
        </div>

        {/* Attack Category Breakdown Donut */}
        <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Threat Category Distribution</h2>
            <p className="text-xs text-slate-400">Classified by XGBoost IDS engine</p>
          </div>

          <div className="h-48 w-full my-2">
            {analytics?.category_breakdown && analytics.category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.category_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {analytics.category_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#38BDF8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0E1A', borderColor: '#1E2B42', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Awaiting events
              </div>
            )}
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {analytics?.category_breakdown.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#38BDF8' }}
                  />
                  {cat.category}
                </span>
                <span className="font-mono text-slate-400">{cat.count} ({cat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed Table */}
      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2B42] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent Security Alerts</h2>
            <p className="text-xs text-slate-400">Immediate attention items flagged by ML threat engine</p>
          </div>
          <Link
            to="/alerts"
            className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all alerts
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D17] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1E2B42]">
              <tr>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Threat Category</th>
                <th className="px-5 py-3">Source & Target</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2B42]/50 text-slate-300">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-[#121B2D] transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium text-white">
                      {alert.category}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-300">
                      {alert.event?.source_ip} <span className="text-slate-500">→</span> {alert.event?.destination_ip}:{alert.event?.destination_port}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-cyan-400">
                      {(alert.threat_score * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-400">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <Link
                        to="/alerts"
                        className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px]"
                      >
                        Investigate →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No alerts in current workspace. Click 'Replay Stream Batch' above to test threat detection.
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
