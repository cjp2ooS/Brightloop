import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { History, Search, RotateCw, Filter, Shield } from 'lucide-react';
import { format } from 'date-fns';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/audit');
      setLogs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">System Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable chronological records of financial mutations, lifecycle transitions, and administrative events.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Action Event</th>
              <th className="p-3.5">Actor</th>
              <th className="p-3.5">Target Entity</th>
              <th className="p-3.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <RotateCw className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="p-3.5 font-bold text-blue-400">{log.action}</td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-200">{log.actorName}</span>
                    <span className="text-[10px] text-slate-500 block uppercase">{log.actorRole}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                      {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-xs truncate font-mono text-[11px] text-slate-400">
                    {log.afterState || log.beforeState || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
