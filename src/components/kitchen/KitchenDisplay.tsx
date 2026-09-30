import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { KitchenTicket, KitchenStation } from '../../types';
import {
  ChefHat,
  Clock,
  Printer,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Filter,
  Check
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const { kitchenTickets, updateKOTStatus, openPrintModal, reprintKOT } = usePOS();

  const [stationFilter, setStationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'ready' | 'all'>('pending');

  // Elapsed time ticker
  const [, setTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTicker(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const getAgeMinutes = (isoString: string) => {
    const created = new Date(isoString).getTime();
    const now = Date.now();
    return Math.floor((now - created) / 60000);
  };

  const filteredTickets = kitchenTickets.filter(ticket => {
    // Status
    if (statusFilter === 'pending' && ticket.status === 'ready') return false;
    if (statusFilter === 'ready' && ticket.status !== 'ready') return false;

    // Station
    if (stationFilter !== 'all') {
      const hasStationItem = ticket.items.some(it => it.station === stationFilter);
      if (!hasStationItem) return false;
    }

    return true;
  });

  const stations: { id: string; label: string }[] = [
    { id: 'all', label: 'All Kitchen Stations' },
    { id: 'pizza_kitchen', label: 'Pizza Kitchen' },
    { id: 'grill_fryer', label: 'Grill & Fryer' },
    { id: 'beverage_counter', label: 'Beverage Bar' },
    { id: 'dessert_station', label: 'Dessert Station' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* KDS Control Header */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100">
              Kitchen Display System (KDS)
            </h2>
            <p className="text-xs text-slate-400">
              Live preparation queue with station routing and delayed order alerts.
            </p>
          </div>
        </div>

        {/* Station Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {stations.map(st => (
            <button
              key={st.id}
              onClick={() => setStationFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                stationFilter === st.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Status Toggle */}
        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded font-bold transition ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            In Kitchen ({kitchenTickets.filter(k => k.status !== 'ready').length})
          </button>
          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-3 py-1 rounded font-bold transition ${
              statusFilter === 'ready'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ready for Pickup
          </button>
        </div>
      </div>

      {/* Ticket Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-400/40" />
            <p className="font-semibold text-slate-300 text-sm">All kitchen tickets cleared!</p>
            <p className="text-[11px] text-slate-500 mt-1">
              New orders sent to the kitchen will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTickets.map(ticket => {
              const ageMinutes = getAgeMinutes(ticket.createdAt);
              const isUrgent = ageMinutes >= 20;
              const isWarning = ageMinutes >= 12;

              return (
                <div
                  key={ticket.id}
                  className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden shadow-xl transition ${
                    isUrgent
                      ? 'bg-rose-950/40 border-rose-500/80 shadow-rose-950/50'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-500/70 shadow-amber-950/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3 border-b flex items-center justify-between ${
                      isUrgent
                        ? 'bg-rose-500 text-slate-950 border-rose-600'
                        : isWarning
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-slate-950/80 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm">{ticket.kotNumber}</span>
                        {ticket.isAdditional && (
                          <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-black uppercase">
                            + Additional
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-semibold mt-0.5">
                        Token: #{ticket.tokenNumber} • {ticket.orderType.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 font-mono font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ageMinutes}m</span>
                      </div>
                      {isUrgent && (
                        <span className="text-[9px] font-black uppercase tracking-wider block animate-pulse">
                          DELAYED!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Destination Strip (Table or Delivery or Takeaway) */}
                  <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
                    {ticket.tableNumber ? (
                      <span className="font-bold text-amber-400">
                        Table: {ticket.tableNumber} {ticket.waiterName ? `(${ticket.waiterName})` : ''}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-semibold uppercase">
                        {ticket.orderType.replace('_', ' ')}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Ticket Items List */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
                    {ticket.items.map(item => (
                      <div key={item.id} className="border-b border-slate-800/80 pb-2">
                        <div className="flex items-start gap-2">
                          <span className="text-base font-black font-mono text-amber-400 shrink-0">
                            {item.quantity}×
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-100 leading-tight">
                              {item.name}
                            </div>
                            {item.size && (
                              <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
                                Size: {item.size}
                              </div>
                            )}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-[10px] text-amber-300/90 pl-1 mt-0.5">
                                {item.modifiers.map((m, idx) => (
                                  <div key={idx}>{m}</div>
                                ))}
                              </div>
                            )}
                            {item.specialInstructions && (
                              <div className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                                NOTE: {item.specialInstructions}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-1.5">
                    {/* Reprint KOT */}
                    <button
                      onClick={() => {
                        reprintKOT(ticket.id, 'Reprint from Kitchen Display');
                        openPrintModal({ type: 'kot', kot: ticket });
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Reprint Kitchen Ticket"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Status State Transitions */}
                    <div className="flex items-center gap-1.5 flex-1">
                      {ticket.status === 'new' && (
                        <button
                          onClick={() => updateKOTStatus(ticket.id, 'preparing')}
                          className="w-full py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Start Prep</span>
                        </button>
                      )}

                      {ticket.status === 'preparing' && (
                        <button
                          onClick={() => updateKOTStatus(ticket.id, 'ready')}
                          className="w-full py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Mark Ready</span>
                        </button>
                      )}

                      {ticket.status === 'ready' && (
                        <div className="w-full py-1 text-center text-xs font-bold text-emerald-400 bg-emerald-950/40 rounded-lg border border-emerald-500/30">
                          Ready for Pickup / Dispatch
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
