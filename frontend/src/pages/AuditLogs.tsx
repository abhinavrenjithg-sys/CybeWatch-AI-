import React, { useEffect, useState } from 'react';
import { History, Shield, UserCheck, RefreshCw, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            SOC Audit Trail & Governance
            <span className="text-xs font-mono font-medium text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full">
              TAMPER EVIDENT
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit records tracking alert lifecycle mutations, analyst assignments, and AI investigations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 bg-[#121B2D] hover:bg-[#18233A] border border-[#1E2B42] text-slate-300 text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      <div className="rounded-xl bg-[#0E1524] border border-[#1E2B42] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D17] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1E2B42]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action Type</th>
                <th className="px-5 py-3">Analyst / Actor</th>
                <th className="px-5 py-3">Resource Target</th>
                <th className="px-5 py-3">Mutation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2B42]/50 text-slate-300 font-mono text-xs">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#121B2D] transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-cyan-400 font-sans">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-200">
                      {log.user_name || 'System Engine'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-purple-400">
                      {log.resource_type.toUpperCase()} #{log.resource_id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px] truncate max-w-xs">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No audit records recorded yet. Update an alert status to create the first record.
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
