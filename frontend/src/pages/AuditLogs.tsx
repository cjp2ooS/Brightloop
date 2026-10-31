import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { RotateCw, Shield, Search } from 'lucide-react';
import { format } from 'date-fns';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.actorName?.toLowerCase().includes(term) ||
      log.actorRole?.toLowerCase().includes(term) ||
      log.entityType?.toLowerCase().includes(term) ||
      log.entityId?.toLowerCase().includes(term) ||
      log.afterState?.toLowerCase().includes(term) ||
      log.beforeState?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            System Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable chronological records of financial mutations, lifecycle transitions, and administrative events.
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, entity, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Action Event</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Target Entity</th>
              <th className="py-3 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <RotateCw className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
                  <span className="text-xs mt-2 block">Loading audit logs...</span>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  {logs.length === 0 ? 'No audit logs recorded yet.' : 'No matching audit records found.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block">{log.actorName || 'System'}</span>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">{log.actorRole || 'SYSTEM'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700">
                      {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-md truncate font-mono text-[11px] text-slate-600" title={log.afterState || log.beforeState || ''}>
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
