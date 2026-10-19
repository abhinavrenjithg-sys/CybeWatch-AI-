import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Activity,
  Crosshair,
  BellRing,
  Layers,
  BarChart3,
  Cpu,
  Brain,
  History,
  Settings,
  Flame,
  Radio
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/events', label: 'Security Events', icon: <Activity className="w-4 h-4" /> },
    { to: '/detection', label: 'Threat Detection', icon: <Crosshair className="w-4 h-4" /> },
    { to: '/alerts', label: 'Alerts', icon: <BellRing className="w-4 h-4" /> },
    { to: '/incidents', label: 'Incidents', icon: <Layers className="w-4 h-4" /> },
    { to: '/analytics', label: 'Network Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/ml-lab', label: 'ML Lab & Eval', icon: <Cpu className="w-4 h-4" /> },
    { to: '/investigator', label: 'AI Investigator', icon: <Brain className="w-4 h-4" /> },
    { to: '/audit', label: 'Audit Logs', icon: <History className="w-4 h-4" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 border-r border-[#1E2B42] bg-[#0A0E1A] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-[#1E2B42] gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              CybeWatch <span className="text-cyan-400 text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">AI</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">SOC THREAT ENGINE</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/50 to-blue-950/30 text-cyan-400 border border-cyan-800/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121B2D]'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Pipeline Status Indicator */}
      <div className="p-4 border-t border-[#1E2B42] bg-[#080C14]">
        <div className="rounded-lg bg-[#101828] p-3 border border-[#1E2B42]/70">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Engine Status
            </span>
            <span className="text-emerald-400 text-[11px] font-mono font-semibold">ACTIVE</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Model: <span className="text-slate-300">XGBoost v1.0</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Latency: <span className="text-cyan-400">~0.05 ms</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
