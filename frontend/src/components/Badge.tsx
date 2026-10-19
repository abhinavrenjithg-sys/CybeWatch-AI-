import React from 'react';
import { Severity, AlertStatus } from '../types';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sev = severity.toLowerCase();
  
  const styles: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    benign: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  const style = styles[sev] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-mono uppercase tracking-wider ${style} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        sev === 'critical' ? 'bg-red-500 animate-pulse' :
        sev === 'high' ? 'bg-orange-500' :
        sev === 'medium' ? 'bg-amber-500' :
        sev === 'low' ? 'bg-sky-400' : 'bg-emerald-400'
      }`} />
      {severity}
    </span>
  );
};

interface StatusBadgeProps {
  status: AlertStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toLowerCase();
  
  const styles: Record<string, string> = {
    new: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    triaged: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    investigating: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    false_positive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const style = styles[s] || 'bg-slate-500/10 text-slate-300 border-slate-500/20';

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
