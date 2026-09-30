import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order } from '../../types';
import {
  Bike,
  Phone,
  MapPin,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  UserCheck,
  Send
} from 'lucide-react';

interface DeliveryManagementProps {
  onSelectOrder: (order: Order) => void;
  onOpenPayment: (order: Order) => void;
}

export const DeliveryManagement: React.FC<DeliveryManagementProps> = ({
  onSelectOrder,
  onOpenPayment,
}) => {
  const {
    branch,
    orders,
    riders,
    assignRider,
    dispatchDelivery,
    completeDelivery,
    openPrintModal,
  } = usePOS();

  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'unassigned' | 'dispatched' | 'completed'>('all');

  const deliveryOrders = orders.filter(o => o.orderType === 'delivery');

  const filteredOrders = deliveryOrders.filter(o => {
    if (deliveryFilter === 'unassigned') {
      return !o.deliveryRiderId && o.status !== 'completed' && o.status !== 'cancelled';
    }
    if (deliveryFilter === 'dispatched') {
      return o.status === 'out_for_delivery';
    }
    if (deliveryFilter === 'completed') {
      return o.status === 'delivered' || o.status === 'completed';
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <Bike className="w-5 h-5 text-amber-400" />
            <span>Delivery Dispatch Center</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time rider assignment, live dispatch tracking, and cash-on-delivery reconciliation.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
          {[
            { id: 'all', label: `All Deliveries (${deliveryOrders.length})` },
            { id: 'unassigned', label: 'Awaiting Rider' },
            { id: 'dispatched', label: 'On Road / Out' },
            { id: 'completed', label: 'Delivered' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDeliveryFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-md font-bold transition ${
                deliveryFilter === f.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Delivery Feed */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Bike className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
            <p className="font-semibold text-slate-400">No delivery orders in this view</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map(order => {
              const isPaid = order.paymentStatus === 'paid';
              return (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3"
                >
                  {/* Top order header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          #{order.tokenNumber}
                        </span>
                        <span className="text-xs text-slate-300 font-bold ml-2">
                          {order.orderNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isPaid ? 'PAID' : 'COD (UNPAID)'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="mt-2.5 space-y-1 text-xs">
                      <div className="font-bold text-slate-100 flex items-center justify-between">
                        <span>{order.customerName || 'Customer'}</span>
                        <span className="font-mono text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-amber-400" />
                          {order.customerPhone}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 text-slate-300 text-[11px] pt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div>{order.deliveryAddress}</div>
                          {order.deliveryLandmark && (
                            <div className="text-[10px] text-slate-400 italic">
                              Landmark: {order.deliveryLandmark}
                            </div>
                          )}
                          <div className="text-[10px] text-amber-400/90 font-medium">
                            Area: {order.deliveryArea || 'City'}
                          </div>
                        </div>
                      </div>

                      {order.deliveryNotes && (
                        <div className="p-1.5 bg-slate-950 rounded text-[10px] text-amber-300 border border-slate-800 mt-1">
                          Note: {order.deliveryNotes}
                        </div>
                      )}
                    </div>

                    {/* Order summary */}
                    <div className="mt-3 p-2 bg-slate-950 rounded-lg text-xs flex items-center justify-between">
                      <span className="text-slate-400">
                        {order.items.length} items total
                      </span>
                      <span className="font-mono font-black text-amber-400 text-sm">
                        {branch.currency} {order.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Rider Assignment & Action Bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.deliveryRiderId || ''}
                        onChange={e => assignRider(order.id, e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        <option value="">-- Choose Rider --</option>
                        {riders.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.phone}) - {r.status.toUpperCase()}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => openPrintModal({ type: 'receipt', order })}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Print Delivery Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stage Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {order.status !== 'out_for_delivery' && order.status !== 'delivered' && (
                        <button
                          disabled={!order.deliveryRiderId}
                          onClick={() => dispatchDelivery(order.id)}
                          className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      )}

                      {order.status === 'out_for_delivery' && (
                        <button
                          onClick={() => completeDelivery(order.id, 'cash')}
                          className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition shadow col-span-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivered & Collect {branch.currency} {order.grandTotal}</span>
                        </button>
                      )}

                      {!isPaid && (
                        <button
                          onClick={() => onOpenPayment(order)}
                          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1 transition"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Settle Payment</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                      >
                        Details
                      </button>
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
