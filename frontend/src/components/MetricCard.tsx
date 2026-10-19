import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  accentColor?: 'cyan' | 'red' | 'amber' | 'emerald' | 'default';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'default'
}) => {
  const accentBorders = {
    cyan: 'border-l-4 border-l-cyan-500',
    red: 'border-l-4 border-l-red-500',
    amber: 'border-l-4 border-l-amber-500',
    emerald: 'border-l-4 border-l-emerald-500',
    default: 'border-l-4 border-l-slate-700',
  };

  return (
    <div className={`rounded-xl bg-[#0E1524] p-5 border border-[#1E2B42] ${accentBorders[accentColor]} shadow-lg transition-all hover:border-[#2C3E60]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        <div className="rounded-lg bg-[#151F33] p-2 text-slate-300">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {trend && (
          <span className={`text-xs font-medium ${
            trend.isNeutral ? 'text-slate-400' :
            trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-slate-500 truncate">{subtitle}</div>
      )}
    </div>
  );
};
