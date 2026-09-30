import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { ShieldAlert, Search, Filter, ShieldCheck, Clock } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    if (recordTypeFilter !== 'all' && log.recordType !== recordTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.employeeName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.recordId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Immutable Security Audit Log</span>
          </h2>
          <p className="text-xs text-slate-400">
            Tamper-evident chronological audit trail of all sensitive financial and operational actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100"
            />
          </div>

          <select
            value={recordTypeFilter}
            onChange={e => setRecordTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="all">All Event Types</option>
            <option value="order">Orders</option>
            <option value="payment">Payments</option>
            <option value="discount">Discounts</option>
            <option value="refund">Refunds & Voids</option>
            <option value="shift">Shifts</option>
            <option value="table">Table Operations</option>
            <option value="inventory">Inventory</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Action</th>
                <th className="p-3">Category</th>
                <th className="p-3">Event Details & Authorization</th>
                <th className="p-3">Record ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-850 transition">
                  <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-slate-200">
                    <div>{log.employeeName}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{log.employeeId}</span>
                  </td>
                  <td className="p-3 font-bold text-amber-400">{log.action}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded uppercase font-bold text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                      {log.recordType}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    <div>{log.details}</div>
                    {log.oldValue && log.newValue && (
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        From: <span className="text-rose-400">{log.oldValue}</span> → To:{' '}
                        <span className="text-emerald-400">{log.newValue}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-500 text-[10px] truncate max-w-[120px]">
                    {log.recordId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
