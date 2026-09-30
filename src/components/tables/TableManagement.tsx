import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { RestaurantTable, TableStatus, Order } from '../../types';
import {
  Users,
  Clock,
  DollarSign,
  Utensils,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  ArrowRightLeft,
  RotateCw
} from 'lucide-react';

interface TableManagementProps {
  onOpenOrderForTable: (order: Order) => void;
  onNewOrderForTable: (tableId: string) => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  onOpenOrderForTable,
  onNewOrderForTable,
}) => {
  const { branch, tables, orders, updateTableStatus, transferTable } = usePOS();

  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedTableForAction, setSelectedTableForAction] = useState<RestaurantTable | null>(null);
  const [transferTargetTableId, setTransferTargetTableId] = useState<string>('');

  const areas = ['all', 'Ground Floor', 'First Floor', 'Rooftop Terrace', 'Family Hall'];

  const filteredTables = tables.filter(
    t => selectedArea === 'all' || t.area === selectedArea
  );

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 hover:border-emerald-400';
      case 'occupied':
        return 'bg-amber-950/50 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 hover:border-amber-400';
      case 'reserved':
        return 'bg-blue-950/40 border-blue-500/60 text-blue-300 hover:border-blue-400';
      case 'bill_requested':
        return 'bg-orange-950/50 border-orange-500 text-orange-300 animate-pulse';
      case 'cleaning':
        return 'bg-purple-950/40 border-purple-500/50 text-purple-300';
      case 'disabled':
        return 'bg-slate-900 border-slate-800 text-slate-500 opacity-60';
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'occupied':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold';
      case 'reserved':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'bill_requested':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30 font-black';
      case 'cleaning':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'disabled':
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const handleTableClick = (table: RestaurantTable) => {
    if (table.currentOrderId) {
      const order = orders.find(o => o.id === table.currentOrderId);
      if (order) {
        onOpenOrderForTable(order);
        return;
      }
    }

    if (table.status === 'available') {
      onNewOrderForTable(table.id);
    } else {
      setSelectedTableForAction(table);
    }
  };

  const handleExecuteTransfer = () => {
    if (!selectedTableForAction || !transferTargetTableId) return;
    const res = transferTable(selectedTableForAction.id, transferTargetTableId);
    alert(res.message);
    setSelectedTableForAction(null);
  };

  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const availableCount = tables.filter(t => t.status === 'available').length;
  const billReqCount = tables.filter(t => t.status === 'bill_requested').length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Top Header & Area Switcher */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              <span>Dine-In Table Floor Plan</span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive visual dining map with live server tracking, covers, and running bills.
            </p>
          </div>

          {/* Table Counts Status Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              {availableCount} Available
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
              {occupiedCount} Occupied
            </span>
            {billReqCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold animate-pulse">
                {billReqCount} Bill Requested
              </span>
            )}
          </div>
        </div>

        {/* Floor / Dining Area Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {areas.map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                selectedArea === area
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {area === 'all' ? 'All Dining Floors' : area}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Table Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredTables.map(table => {
            const hasOrder = !!table.currentOrderId;
            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between transition cursor-pointer select-none relative min-h-[140px] ${getStatusColor(
                  table.status
                )}`}
              >
                {/* Table Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-black tracking-tight">{table.number}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{table.area}</div>
                  </div>

                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border ${getStatusBadge(
                      table.status
                    )}`}
                  >
                    {table.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Table Dynamic Details */}
                <div className="my-2 space-y-1 text-[11px]">
                  {table.status === 'occupied' || table.status === 'bill_requested' ? (
                    <>
                      {table.currentWaiterName && (
                        <div className="text-slate-300 font-semibold truncate">
                          Waiter: {table.currentWaiterName}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{table.currentCovers || 2} covers</span>
                        </span>
                        {table.runningAmount && (
                          <span className="font-mono font-bold text-amber-400">
                            {branch.currency} {table.runningAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>Capacity: {table.capacity} guests</span>
                    </div>
                  )}
                </div>

                {/* Card Action Hint */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  {table.status === 'available' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <PlusCircle className="w-3 h-3" />
                      <span>New Dine-In</span>
                    </span>
                  ) : hasOrder ? (
                    <span className="text-amber-400 font-bold">Inspect Order →</span>
                  ) : (
                    <span className="text-slate-400">Status Settings</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Actions Drawer / Modal */}
      {selectedTableForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Manage Table {selectedTableForAction.number}
                </h3>
                <p className="text-xs text-slate-400">{selectedTableForAction.area}</p>
              </div>
              <button
                onClick={() => setSelectedTableForAction(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Change Status Options */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Update Table Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['available', 'reserved', 'cleaning', 'disabled'] as TableStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      updateTableStatus(selectedTableForAction.id, st);
                      setSelectedTableForAction(null);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold capitalize text-slate-200 border border-slate-700 transition"
                  >
                    Mark as {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Transfer Order if occupied */}
            {selectedTableForAction.currentOrderId && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-bold uppercase text-amber-400">
                  Transfer Guest to Another Table
                </label>
                <select
                  value={transferTargetTableId}
                  onChange={e => setTransferTargetTableId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="">-- Choose Available Table --</option>
                  {tables
                    .filter(t => t.status === 'available')
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.number} ({t.area}) - Capacity {t.capacity}
                      </option>
                    ))}
                </select>
                <button
                  disabled={!transferTargetTableId}
                  onClick={handleExecuteTransfer}
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-40"
                >
                  Confirm Table Transfer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
