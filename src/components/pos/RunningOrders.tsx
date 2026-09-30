import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order, OrderType, PaymentStatus, OrderStatus } from '../../types';
import {
  Search,
  Filter,
  Eye,
  PlusCircle,
  Printer,
  CreditCard,
  CheckCircle2,
  XCircle,
  ChefHat,
  Bike,
  Clock,
  RefreshCw,
  Utensils,
  PackageCheck,
  Globe2,
  Car
} from 'lucide-react';

interface RunningOrdersProps {
  onSelectOrder: (order: Order) => void;
  onOpenPayment: (order: Order) => void;
  onAddItemsToOrder: (order: Order) => void;
  filterOrderType?: OrderType; // Optional pre-filter for direct navigation tabs (Dine-In, Takeaway, etc.)
}

export const RunningOrders: React.FC<RunningOrdersProps> = ({
  onSelectOrder,
  onOpenPayment,
  onAddItemsToOrder,
  filterOrderType,
}) => {
  const {
    branch,
    orders,
    updateOrderStatus,
    openPrintModal,
    kitchenTickets,
    reprintReceipt,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<string>(filterOrderType || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');

  // Elapsed time trigger ticker
  const [, setTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTicker(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync tab if filterOrderType prop changes
  useEffect(() => {
    if (filterOrderType) {
      setActiveTab(filterOrderType);
    }
  }, [filterOrderType]);

  const getElapsedTime = (isoString: string) => {
    const created = new Date(isoString).getTime();
    const now = Date.now();
    const diffMinutes = Math.floor((now - created) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m ago`;
  };

  const filteredOrders = orders.filter(order => {
    // 1. Order type filter
    if (activeTab !== 'all' && order.orderType !== activeTab) {
      return false;
    }

    // 2. Status filter
    if (statusFilter === 'active' && (order.status === 'completed' || order.status === 'cancelled')) {
      return false;
    }
    if (statusFilter === 'completed' && order.status !== 'completed') {
      return false;
    }
    if (statusFilter === 'cancelled' && order.status !== 'cancelled') {
      return false;
    }

    // 3. Payment filter
    if (paymentFilter === 'unpaid' && order.paymentStatus !== 'unpaid') {
      return false;
    }
    if (paymentFilter === 'paid' && order.paymentStatus !== 'paid') {
      return false;
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.orderNumber.toLowerCase().includes(q);
      const matchToken = order.tokenNumber.includes(q);
      const matchPhone = order.customerPhone?.toLowerCase().includes(q) || false;
      const matchCustomer = order.customerName?.toLowerCase().includes(q) || false;
      const matchTable = order.tableName?.toLowerCase().includes(q) || false;
      const matchRider = order.deliveryRiderName?.toLowerCase().includes(q) || false;
      const matchInvoice = order.invoiceNumber?.includes(q) || false;
      return matchOrderNum || matchToken || matchPhone || matchCustomer || matchTable || matchRider || matchInvoice;
    }

    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'sent_to_kitchen':
      case 'preparing':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'ready':
      case 'ready_for_pickup':
      case 'ready_for_dispatch':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'assigned_to_rider':
      case 'out_for_delivery':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'delivered':
      case 'taken_to_car':
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'cancelled':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case 'dine_in':
        return <Utensils className="w-3.5 h-3.5 text-blue-400" />;
      case 'takeaway':
        return <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'delivery':
        return <Bike className="w-3.5 h-3.5 text-amber-400" />;
      case 'third_party':
        return <Globe2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'car_service':
        return <Car className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const handlePrintReceipt = (order: Order) => {
    reprintReceipt(order.id, 'Running Orders quick print');
    openPrintModal({
      type: 'receipt',
      order,
      isDuplicate: order.reprintCount > 0,
    });
  };

  const handleAdvanceStatus = (order: Order) => {
    let nextStatus: OrderStatus = 'completed';
    if (order.status === 'sent_to_kitchen') nextStatus = 'preparing';
    else if (order.status === 'preparing') nextStatus = 'ready';
    else if (order.status === 'ready') {
      if (order.orderType === 'takeaway') nextStatus = 'ready_for_pickup';
      else if (order.orderType === 'delivery') nextStatus = 'ready_for_dispatch';
      else nextStatus = 'completed';
    } else if (order.status === 'ready_for_pickup') nextStatus = 'completed';
    else if (order.status === 'ready_for_dispatch') nextStatus = 'out_for_delivery';
    else if (order.status === 'out_for_delivery') nextStatus = 'delivered';
    else if (order.status === 'delivered') nextStatus = 'completed';

    updateOrderStatus(order.id, nextStatus);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Top Filter Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-3">
        {/* Navigation Tabs by Order Type */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'dine_in', label: 'Dine-In' },
              { id: 'takeaway', label: 'Takeaway' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'third_party', label: 'Third Party' },
              { id: 'car_service', label: 'Car Service' },
            ].map(tab => {
              const count =
                tab.id === 'all'
                  ? orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length
                  : orders.filter(
                      o => o.orderType === tab.id && o.status !== 'completed' && o.status !== 'cancelled'
                    ).length;
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div>
              Active Running: <strong className="text-amber-400 font-mono">{filteredOrders.length}</strong>
            </div>
            <span>•</span>
            <div>
              Total Running Value:{' '}
              <strong className="text-emerald-400 font-mono">
                {branch.currency}{' '}
                {filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Filter Controls: Search & Sub-filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
          {/* Search bar */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Token, Phone, Table, Waiter, Rider..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="active">Active Running Orders Only</option>
              <option value="all">All Statuses (Include History)</option>
              <option value="completed">Completed Orders Only</option>
              <option value="cancelled">Cancelled Orders Only</option>
            </select>
          </div>

          {/* Payment filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">All Payment Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="flex-1 overflow-auto p-3">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Clock className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
            <p className="font-semibold text-slate-400">No matching orders found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Change the filters or create a new order from the POS screen.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Token #</th>
                  <th className="p-3">Order ID / Time</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Destination / Table</th>
                  <th className="p-3">Customer / Waiter</th>
                  <th className="p-3">Items Summary</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Payment</th>
                  <th className="p-3 text-center">Order Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map(order => {
                  const isPaid = order.paymentStatus === 'paid';
                  const isUnpaid = order.paymentStatus === 'unpaid';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-850/60 transition group"
                    >
                      {/* Token # */}
                      <td className="p-3 font-mono font-black text-amber-400 text-sm">
                        #{order.tokenNumber}
                      </td>

                      {/* Order ID & Time */}
                      <td className="p-3">
                        <div className="font-bold text-slate-200 group-hover:text-amber-300 transition">
                          {order.orderNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="text-amber-400/90">{getElapsedTime(order.createdAt)}</span>
                        </div>
                      </td>

                      {/* Order Type */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 capitalize font-medium text-slate-300">
                          {getOrderTypeIcon(order.orderType)}
                          <span>{order.orderType.replace('_', ' ')}</span>
                        </div>
                      </td>

                      {/* Destination / Table */}
                      <td className="p-3 font-medium text-slate-200">
                        {order.tableName ? (
                          <div>
                            <span className="font-bold text-slate-100">{order.tableName}</span>
                            <span className="text-[10px] text-slate-400 block">{order.areaName || 'Dine-In'}</span>
                          </div>
                        ) : order.orderType === 'delivery' ? (
                          <div>
                            <span className="text-[11px] truncate block max-w-[150px]">{order.deliveryAddress || 'Address'}</span>
                            <span className="text-[10px] text-slate-400">{order.deliveryArea}</span>
                          </div>
                        ) : order.carRegistration ? (
                          <div>
                            <span className="font-mono font-bold">{order.carRegistration}</span>
                            <span className="text-[10px] text-slate-400 block">{order.parkingBay}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Counter Pickup</span>
                        )}
                      </td>

                      {/* Customer / Waiter */}
                      <td className="p-3">
                        {order.customerName && (
                          <div className="font-semibold text-slate-200 truncate max-w-[130px]">
                            {order.customerName}
                          </div>
                        )}
                        {order.customerPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</div>
                        )}
                        {order.waiterName && (
                          <div className="text-[10px] text-blue-400">Waiter: {order.waiterName}</div>
                        )}
                        {order.deliveryRiderName && (
                          <div className="text-[10px] text-cyan-400">Rider: {order.deliveryRiderName}</div>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="p-3">
                        <div className="text-[11px] text-slate-300 truncate max-w-[180px]">
                          {order.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {order.items.reduce((s, it) => s + it.quantity, 0)} items total
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3 text-right font-mono font-black text-slate-100">
                        {branch.currency} {order.grandTotal.toLocaleString()}
                      </td>

                      {/* Payment Status (PROMINENT PAID / UNPAID) */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[11px] font-black tracking-wider uppercase border shadow-sm ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isUnpaid
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          }`}
                        >
                          {order.paymentStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Action Buttons Toolbar */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => onSelectOrder(order)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Inspect Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Bill */}
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
                            title="Print Thermal Bill"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Add items (only if active) */}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => onAddItemsToOrder(order)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
                              title="Add more items (Generates additional KOT)"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Payment */}
                          {!isPaid && (
                            <button
                              onClick={() => onOpenPayment(order)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition flex items-center gap-1 shadow-sm"
                              title="Accept Payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Pay</span>
                            </button>
                          )}

                          {/* Advance Status button */}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleAdvanceStatus(order)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition"
                              title="Advance to next workflow state"
                            >
                              Next →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
