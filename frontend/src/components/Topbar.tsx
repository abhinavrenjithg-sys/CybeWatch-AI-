import React, { useState } from 'react';
import { Search, Play, RefreshCw, Bell, User as UserIcon, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

interface TopbarProps {
  onRefresh?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onRefresh }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const handleSimulateBatch = async () => {
    try {
      setIsSimulating(true);
      setSimulationStatus('Replaying stream...');
      const res = await api.simulateTraffic(15);
      setSimulationStatus(`Injected ${res.total_ingested} flows (${res.alerts_generated} alerts)`);
      setTimeout(() => setSimulationStatus(null), 4000);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setSimulationStatus(`Failed: ${err.message}`);
      setTimeout(() => setSimulationStatus(null), 4000);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <header className="h-16 border-b border-[#1E2B42] bg-[#0A0E1A]/90 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Left: Workspace dropdown & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-2 bg-[#121B2D] border border-[#1E2B42] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">SOC-PRIMARY</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Production Net</span>
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search IPs, Alert IDs, MITRE techniques..."
            className="w-full bg-[#121B2D] border border-[#1E2B42] pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {simulationStatus && (
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/40 animate-fade-in">
            {simulationStatus}
          </span>
        )}

        {/* Live Replay Button */}
        <button
          onClick={handleSimulateBatch}
          disabled={isSimulating}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-cyan-950 transition-all cursor-pointer"
          title="Replay 15 realistic network flow samples to test live intrusion detection"
        >
          {isSimulating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          Replay Stream Batch
        </button>

        {/* Notification Bell */}
        <button className="p-2 rounded-lg bg-[#121B2D] border border-[#1E2B42] text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500" />
        </button>

        {/* User badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#1E2B42]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-900 font-bold text-xs">
            CA
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">Lead Cyber Analyst</div>
            <div className="text-[10px] text-slate-400 font-mono">analyst@cybewatch.ai</div>
          </div>
        </div>
      </div>
    </header>
  );
};
