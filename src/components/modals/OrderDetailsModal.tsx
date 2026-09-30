import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order, OrderStatus } from '../../types';
import {
  X,
  Printer,
  CreditCard,
  ChefHat,
  Ban,
  Clock,
  User,
  MapPin,
  Bike,
  ShieldAlert,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenPayment: (order: Order) => void;
  onOpenAddItems?: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onOpenPayment,
  onOpenAddItems,
}) => {
  const {
    branch,
    tables,
    riders,
    updateOrderStatus,
    cancelOrder,
    refundOrder,
    assignRider,
    dispatchDelivery,
    completeDelivery,
    transferTable,
    reprintReceipt,
    reprintKOT,
    openPrintModal,
    kitchenTickets,
    verifyManagerPin,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'items' | 'history' | 'delivery' | 'actions'>('items');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Refund states
  const [refundItemId, setRefundItemId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundPrompt, setShowRefundPrompt] = useState(false);

  // Table transfer state
  const [selectedNewTableId, setSelectedNewTableId] = useState('');

  if (!order) return null;

  const orderKots = kitchenTickets.filter(k => k.orderId === order.id);

  const handlePrintCustomerBill = () => {
    reprintReceipt(order.id, 'Reprint from Order Details Modal');
    openPrintModal({
      type: 'receipt',
      order,
      isDuplicate: order.reprintCount > 0,
    });
  };

  const handlePrintKitchenKot = () => {
    const latestKot = orderKots[0];
    if (latestKot) {
      reprintKOT(latestKot.id, 'Reprinted from Order Inspector');
      openPrintModal({
        type: 'kot',
        kot: latestKot,
      });
    }
  };

  const handleConfirmCancel = () => {
    setPinError('');
    if (!cancelReason.trim()) {
      alert('Please specify a cancellation reason.');
      return;
    }

    if (order.paymentStatus === 'paid') {
      if (!managerPin || !verifyManagerPin(managerPin)) {
        setPinError('Cancelling a PAID order requires valid Manager PIN (9999).');
        return;
      }
    }

    const res = cancelOrder(order.id, cancelReason, managerPin);
    if (res.success) {
      onClose();
    } else {
      setPinError(res.error || 'Failed to cancel order.');
    }
  };

  const handleConfirmRefund = () => {
    setPinError('');
    if (!refundReason.trim()) {
      alert('Please specify a refund reason.');
      return;
    }
    if (!managerPin || !verifyManagerPin(managerPin)) {
      setPinError('Refund requires valid Manager PIN (9999).');
      return;
    }

    const itemToRefund = order.items.find(it => it.id === refundItemId);
    const amountToRefund = itemToRefund ? itemToRefund.totalPrice : order.grandTotal;

    const res = refundOrder(
      order.id,
      amountToRefund,
      refundReason,
      managerPin,
      refundItemId || undefined
    );

    if (res.success) {
      setShowRefundPrompt(false);
      setRefundItemId(null);
      setRefundReason('');
      setManagerPin('');
    } else {
      setPinError(res.error || 'Refund failed.');
    }
  };

  const handleTableTransfer = () => {
    if (!selectedNewTableId || !order.tableId) return;
    const res = transferTable(order.tableId, selectedNewTableId);
    if (res.success) {
      alert(res.message);
      onClose();
    } else {
      alert(res.message || 'Transfer failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-100">{order.orderNumber}</h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Token #{order.tokenNumber}
              </span>
              {/* Payment status badge */}
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-black tracking-wide uppercase ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : order.paymentStatus === 'refunded'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="uppercase font-semibold">{order.orderType.replace('_', ' ')}</span>
              <span>•</span>
              <span>Created: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {order.tableName && (
                <>
                  <span>•</span>
                  <span className="font-bold text-slate-300">Table: {order.tableName}</span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 text-xs font-semibold">
          {[
            { id: 'items', label: `Items (${order.items.length})` },
            { id: 'history', label: `Timeline (${order.statusHistory.length})` },
            ...(order.orderType === 'delivery' ? [{ id: 'delivery', label: 'Delivery Details' }] : []),
            { id: 'actions', label: 'Operations & Voids' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: ITEMS */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Item Details</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {order.items.map(item => (
                      <tr key={item.id} className={item.voided ? 'opacity-40 line-through bg-rose-950/20' : ''}>
                        <td className="p-3">
                          <div className="font-bold text-slate-200">
                            {item.name} {item.size ? `(${item.size})` : ''}
                          </div>
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <div className="text-[10px] text-slate-400 pl-1 mt-0.5">
                              {item.selectedModifiers.map(m => m.name).join(', ')}
                            </div>
                          )}
                          {item.specialInstructions && (
                            <div className="text-[10px] text-amber-400/90 italic pl-1 mt-0.5">
                              Note: {item.specialInstructions}
                            </div>
                          )}
                          {item.voided && (
                            <div className="text-[10px] text-rose-400 font-semibold mt-1">
                              VOIDED: {item.voidReason || 'Manager Void'}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-200">{item.quantity}</td>
                        <td className="p-3 text-right font-mono text-slate-300">{item.unitPrice}</td>
                        <td className="p-3 text-right font-mono font-bold text-amber-400">{item.totalPrice}</td>
                        <td className="p-3 text-center">
                          {!item.voided && order.paymentStatus === 'paid' && (
                            <button
                              onClick={() => {
                                setRefundItemId(item.id);
                                setShowRefundPrompt(true);
                              }}
                              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-semibold transition"
                            >
                              Void / Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">{branch.currency} {order.subtotal}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Discount ({order.discountType === 'percentage' ? `${order.discountValue}%` : 'Flat'}):</span>
                    <span className="font-mono">-{branch.currency} {order.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Sales Tax ({order.taxRate}%):</span>
                  <span className="font-mono text-slate-200">{branch.currency} {order.taxAmount}</span>
                </div>
                {order.serviceCharge > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Service Charge (Dine-In):</span>
                    <span className="font-mono text-slate-200">{branch.currency} {order.serviceCharge}</span>
                  </div>
                )}
                {order.deliveryCharge > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Charge:</span>
                    <span className="font-mono text-slate-200">{branch.currency} {order.deliveryCharge}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base border-t border-slate-800 pt-2 text-slate-100">
                  <span>Grand Total:</span>
                  <span className="font-mono text-amber-400">{branch.currency} {order.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payments Registered */}
              {order.payments.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs">
                  <div className="font-bold text-emerald-400 mb-1">Payments Settled:</div>
                  {order.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                      <span>
                        {p.method.toUpperCase()} • by {p.cashierName} ({new Date(p.timestamp).toLocaleTimeString()})
                      </span>
                      <span className="font-mono font-bold text-emerald-300">
                        {branch.currency} {p.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Immutable chronological order status audit trail as required by POS specifications:
              </p>
              <div className="relative pl-6 space-y-4 border-l-2 border-slate-800">
                {order.statusHistory.map((hist, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
                    <div className="text-xs font-bold text-slate-200 capitalize">
                      {hist.status.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      by <strong className="text-slate-300">{hist.employeeName}</strong> • {new Date(hist.timestamp).toLocaleTimeString()} ({new Date(hist.timestamp).toLocaleDateString('en-GB')})
                    </div>
                    {hist.notes && (
                      <div className="text-[10px] text-amber-400/80 bg-slate-950/60 p-1.5 rounded border border-slate-800 mt-1">
                        {hist.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DELIVERY DETAILS */}
          {activeTab === 'delivery' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  Customer Information
                </div>
                <div><strong>Name:</strong> {order.customerName || 'N/A'}</div>
                <div><strong>Phone:</strong> {order.customerPhone || 'N/A'}</div>
                {order.customerAlternatePhone && (
                  <div><strong>Alternate:</strong> {order.customerAlternatePhone}</div>
                )}
                <div><strong>Address:</strong> {order.deliveryAddress || 'N/A'}</div>
                <div><strong>Area:</strong> {order.deliveryArea || 'N/A'}</div>
                {order.deliveryLandmark && (
                  <div><strong>Landmark:</strong> {order.deliveryLandmark}</div>
                )}
                {order.deliveryNotes && (
                  <div className="p-2 rounded bg-slate-900 text-amber-300 text-[11px]">
                    Note: {order.deliveryNotes}
                  </div>
                )}
              </div>

              {/* Rider Assignment Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-sm text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-amber-400" />
                    Delivery Rider
                  </div>
                  {order.deliveryRiderName && (
                    <span className="text-emerald-400 font-semibold">{order.deliveryRiderName}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={order.deliveryRiderId || ''}
                    onChange={e => assignRider(order.id, e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Active Rider --</option>
                    {riders.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.phone}) - {r.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {order.status === 'assigned_to_rider' && (
                  <button
                    onClick={() => dispatchDelivery(order.id)}
                    className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
                  >
                    Dispatch Out For Delivery
                  </button>
                )}

                {order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => completeDelivery(order.id, 'cash')}
                    className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition"
                  >
                    Mark as Delivered & Collect Cash
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OPERATIONS & VOIDS */}
          {activeTab === 'actions' && (
            <div className="space-y-4 text-xs">
              {/* Table Transfer (Dine-In only) */}
              {order.orderType === 'dine_in' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                    Transfer Dine-In Table
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Currently seated at Table <strong>{order.tableName}</strong>. Select available table to transfer:
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedNewTableId}
                      onChange={e => setSelectedNewTableId(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="">-- Select Target Table --</option>
                      {tables
                        .filter(t => t.status === 'available' || t.id === order.tableId)
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.number} ({t.area}) - Capacity {t.capacity}
                          </option>
                        ))}
                    </select>
                    <button
                      disabled={!selectedNewTableId || selectedNewTableId === order.tableId}
                      onClick={handleTableTransfer}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition disabled:opacity-40"
                    >
                      Transfer
                    </button>
                  </div>
                </div>
              )}

              {/* Status Stepper */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">Update Order Lifecycle Status</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'confirmed',
                    'sent_to_kitchen',
                    'preparing',
                    'ready',
                    'completed',
                  ].map(st => (
                    <button
                      key={st}
                      onClick={() => updateOrderStatus(order.id, st as OrderStatus)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs capitalize transition ${
                        order.status === st
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Cancellation */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <div className="font-bold text-rose-400 flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  Cancel Order
                </div>
                {!showCancelPrompt ? (
                  <button
                    onClick={() => setShowCancelPrompt(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs transition"
                  >
                    Initiate Order Cancellation
                  </button>
                ) : (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="Reason for cancellation (required)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    />
                    {order.paymentStatus === 'paid' && (
                      <div>
                        <label className="block text-[10px] text-amber-400 mb-1">
                          Manager PIN Required for Paid Order (9999)
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={managerPin}
                          onChange={e => setManagerPin(e.target.value)}
                          placeholder="Manager PIN"
                          className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-center"
                        />
                      </div>
                    )}
                    {pinError && <div className="text-[11px] text-rose-400">{pinError}</div>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCancelPrompt(false)}
                        className="px-3 py-1 text-slate-400 hover:text-white"
                      >
                        Abort
                      </button>
                      <button
                        onClick={handleConfirmCancel}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
                      >
                        Confirm Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Item Refund Modal Sub-Prompt */}
          {showRefundPrompt && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-400 text-xs">
                <ShieldAlert className="w-4 h-4" />
                Manager Void / Refund Authorization
              </div>
              <input
                type="text"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Reason for void / refund"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Enter Manager PIN (Demo: 9999)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value)}
                  placeholder="PIN"
                  className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-center"
                />
              </div>
              {pinError && <div className="text-[11px] text-rose-400">{pinError}</div>}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRefundPrompt(false)}
                  className="px-3 py-1 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRefund}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Authorize Refund
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Action Toolbar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCustomerBill}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              title="Print 80mm/58mm thermal receipt"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Bill</span>
            </button>

            <button
              onClick={handlePrintKitchenKot}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              title="Print Kitchen Ticket"
            >
              <ChefHat className="w-4 h-4 text-sky-400" />
              <span>Print KOT</span>
            </button>

            {onOpenAddItems && order.paymentStatus !== 'paid' && order.status !== 'completed' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddItems(order);
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-amber-500/30 transition"
              >
                + Add Food Items
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {order.paymentStatus !== 'paid' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayment(order);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              >
                <CreditCard className="w-4 h-4" />
                <span>Accept Payment</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
