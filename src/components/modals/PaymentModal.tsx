import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order, PaymentMethod } from '../../types';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Wallet,
  CheckCircle2,
  Printer,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface PaymentModalProps {
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess?: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  onClose,
  onPaymentSuccess,
}) => {
  const {
    branch,
    processPayment,
    applyDiscount,
    verifyManagerPin,
    openPrintModal,
  } = usePOS();

  if (!order) return null;

  // ------------------------------------------------------------
  // PAYMENT CALCULATIONS
  // ------------------------------------------------------------

  const totalPaid = order.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const totalRefunded = order.refunds.reduce(
    (sum, refund) => sum + refund.amount,
    0
  );

  /*
   * Outstanding balance is based on actual payments already
   * received against the order.
   *
   * Refunds are displayed separately and do not automatically
   * reopen the original invoice for collection.
   */
  const remainingBalance = Math.max(
    0,
    order.grandTotal - totalPaid
  );

  const isFullyPaid =
    order.paymentStatus === 'paid' || remainingBalance <= 0;

  const isFullyRefunded =
    order.paymentStatus === 'refunded';

  const paymentBlocked =
    isFullyPaid ||
    isFullyRefunded ||
    order.status === 'cancelled';

  // ------------------------------------------------------------
  // PAYMENT STATE
  // ------------------------------------------------------------

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash');

  const [tenderedAmount, setTenderedAmount] = useState<string>(
    remainingBalance.toString()
  );

  const [reference, setReference] = useState<string>('');

  // ------------------------------------------------------------
  // DISCOUNT STATE
  // ------------------------------------------------------------

  const [showDiscountSection, setShowDiscountSection] =
    useState(false);

  const [discountType, setDiscountType] =
    useState<'percentage' | 'fixed'>('percentage');

  const [discountValue, setDiscountValue] =
    useState<number>(0);

  const [discountReason, setDiscountReason] =
    useState<string>('');

  const [managerPin, setManagerPin] =
    useState<string>('');

  const [pinError, setPinError] =
    useState<string>('');

  const [paymentError, setPaymentError] =
    useState<string>('');

  // ------------------------------------------------------------
  // CASH CALCULATIONS
  // ------------------------------------------------------------

  const tendered = parseFloat(tenderedAmount) || 0;

  const change = Math.max(
    0,
    tendered - remainingBalance
  );

  const isSufficient =
    paymentMethod !== 'cash' ||
    tendered >= remainingBalance;

  // ------------------------------------------------------------
  // QUICK CASH
  // ------------------------------------------------------------

  const handleQuickCash = (amount: number) => {
    setTenderedAmount(amount.toString());
    setPaymentError('');
  };

  // ------------------------------------------------------------
  // APPLY DISCOUNT
  // ------------------------------------------------------------

  const handleApplyDiscount = () => {
    setPinError('');

    if (paymentBlocked) {
      setPinError(
        'Discount cannot be changed after the order has been settled, refunded, or cancelled.'
      );
      return;
    }

    if (totalPaid > 0) {
      setPinError(
        'Discount cannot be changed after a payment has already been received.'
      );
      return;
    }

    if (discountValue <= 0) {
      setPinError('Enter a valid discount value.');
      return;
    }

    if (
      discountType === 'percentage' &&
      discountValue > 100
    ) {
      setPinError(
        'Percentage discount cannot exceed 100%.'
      );
      return;
    }

    const isHighDiscount =
      (discountType === 'percentage' &&
        discountValue > 10) ||
      (discountType === 'fixed' &&
        discountValue > 500);

    if (isHighDiscount) {
      if (
        !managerPin ||
        !verifyManagerPin(managerPin)
      ) {
        setPinError(
          'A valid Manager PIN is required for this discount.'
        );
        return;
      }
    }

    applyDiscount(
      order.id,
      discountType,
      discountValue,
      discountReason || 'POS Cashier Discount',
      isHighDiscount
        ? 'Manager Approved'
        : undefined
    );

    setShowDiscountSection(false);
    setManagerPin('');
    setPinError('');
  };

  // ------------------------------------------------------------
  // SETTLE PAYMENT
  // ------------------------------------------------------------

  const handleSettlePayment = (
    andPrint: boolean = false
  ) => {
    setPaymentError('');

    if (order.status === 'cancelled') {
      setPaymentError(
        'Cancelled orders cannot accept payment.'
      );
      return;
    }

    if (isFullyRefunded) {
      setPaymentError(
        'This order has been fully refunded and cannot accept another payment.'
      );
      return;
    }

    if (isFullyPaid || remainingBalance <= 0) {
      setPaymentError(
        'This order has already been fully paid.'
      );
      return;
    }

    if (
      paymentMethod === 'cash' &&
      tendered < remainingBalance
    ) {
      setPaymentError(
        'Tendered cash is less than the remaining balance.'
      );
      return;
    }

    const success = processPayment(
      order.id,
      remainingBalance,
      paymentMethod,
      reference,
      paymentMethod === 'cash'
        ? tendered
        : remainingBalance,
      paymentMethod === 'cash'
        ? change
        : 0
    );

    if (!success) {
      setPaymentError(
        'Payment could not be processed. Please try again.'
      );
      return;
    }

    const updatedOrder: Order = {
      ...order,
      paymentStatus: 'paid',
      payments: [
        ...order.payments,
        {
          id: `pay_preview_${Date.now()}`,
          orderId: order.id,
          amount: remainingBalance,
          method: paymentMethod,
          reference,
          timestamp: new Date().toISOString(),
          cashierId: '',
          cashierName: '',
          tendered:
            paymentMethod === 'cash'
              ? tendered
              : remainingBalance,
          change:
            paymentMethod === 'cash'
              ? change
              : 0,
        },
      ],
    };

    if (andPrint) {
      openPrintModal({
        type: 'receipt',
        order: updatedOrder,
      });
    }

    if (onPaymentSuccess) {
      onPaymentSuccess(updatedOrder);
    }

    onClose();
  };

  // ------------------------------------------------------------
  // PAYMENT METHODS
  // ------------------------------------------------------------

  const paymentMethodsList: {
    id: PaymentMethod;
    label: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'cash',
      label: 'Cash',
      icon: Banknote,
    },
    {
      id: 'card',
      label: 'Credit / Debit Card',
      icon: CreditCard,
    },
    {
      id: 'online',
      label: 'Online / QR Pay',
      icon: Smartphone,
    },
    {
      id: 'bank_transfer',
      label: 'Bank Transfer',
      icon: Building,
    },
    {
      id: 'wallet',
      label: 'Mobile Wallet (JazzCash / EasyPaisa)',
      icon: Wallet,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-100">
                Billing & Payment
              </h3>

              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                #{order.orderNumber}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              Token #{order.tokenNumber} •{' '}
              {order.orderType
                .replace('_', ' ')
                .toUpperCase()}

              {order.tableName
                ? ` • Table ${order.tableName}`
                : ''}

              {order.customerName
                ? ` • ${order.customerName}`
                : ''}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ORDER TOTAL */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-start justify-between gap-4">

              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">
                  Order Grand Total
                </div>

                <div className="text-2xl font-black text-slate-100 tracking-tight mt-1">
                  {branch.currency}{' '}
                  {order.grandTotal.toLocaleString()}
                </div>

                <div className="text-[11px] text-slate-500 mt-1">
                  Subtotal: {order.subtotal}
                  {' | '}
                  Tax: {order.taxAmount}

                  {order.discountAmount > 0 &&
                    ` | Discount: -${order.discountAmount}`}

                  {order.deliveryCharge > 0 &&
                    ` | Delivery: ${order.deliveryCharge}`}

                  {order.serviceCharge > 0 &&
                    ` | Service: ${order.serviceCharge}`}
                </div>
              </div>

              {!paymentBlocked &&
                totalPaid <= 0 && (
                  <button
                    onClick={() =>
                      setShowDiscountSection(
                        !showDiscountSection
                      )
                    }
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition shrink-0"
                  >
                    {order.discountAmount > 0
                      ? 'Edit Discount'
                      : '+ Add Discount'}
                  </button>
                )}
            </div>
          </div>

          {/* PAYMENT SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Paid
              </div>

              <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                {branch.currency}{' '}
                {totalPaid.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Refunded
              </div>

              <div className="text-lg font-black text-rose-400 font-mono mt-1">
                {branch.currency}{' '}
                {totalRefunded.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-amber-300">
                Remaining Balance
              </div>

              <div className="text-lg font-black text-amber-400 font-mono mt-1">
                {branch.currency}{' '}
                {remainingBalance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* BLOCKED PAYMENT MESSAGE */}
          {paymentBlocked && (
            <div
              className={`flex items-start gap-2 p-3 rounded-xl border ${
                isFullyRefunded
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : order.status === 'cancelled'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {isFullyPaid &&
              !isFullyRefunded &&
              order.status !== 'cancelled' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}

              <div>
                <div className="text-xs font-black uppercase">
                  {order.status === 'cancelled'
                    ? 'Order Cancelled'
                    : isFullyRefunded
                    ? 'Order Fully Refunded'
                    : 'Payment Complete'}
                </div>

                <div className="text-[11px] mt-0.5 opacity-90">
                  {order.status === 'cancelled'
                    ? 'This order cannot accept any new payment.'
                    : isFullyRefunded
                    ? 'This invoice has already been fully refunded.'
                    : 'The complete payable amount for this order has already been received.'}
                </div>
              </div>
            </div>
          )}

          {/* DISCOUNT MANAGER */}
          {showDiscountSection &&
            !paymentBlocked &&
            totalPaid <= 0 && (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3 animate-in fade-in">

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Order Discount
                  </span>

                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-xs">

                    <button
                      onClick={() =>
                        setDiscountType('percentage')
                      }
                      className={`px-2.5 py-1 rounded font-bold transition ${
                        discountType === 'percentage'
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400'
                      }`}
                    >
                      % Percent
                    </button>

                    <button
                      onClick={() =>
                        setDiscountType('fixed')
                      }
                      className={`px-2.5 py-1 rounded font-bold transition ${
                        discountType === 'fixed'
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400'
                      }`}
                    >
                      Fixed ({branch.currency})
                    </button>

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Discount Value
                    </label>

                    <input
                      type="number"
                      value={discountValue || ''}
                      onChange={e =>
                        setDiscountValue(
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder={
                        discountType === 'percentage'
                          ? 'e.g. 10'
                          : 'e.g. 200'
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Reason
                    </label>

                    <input
                      type="text"
                      value={discountReason}
                      onChange={e =>
                        setDiscountReason(e.target.value)
                      }
                      placeholder="VIP / Staff / Promotion"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100"
                    />
                  </div>

                </div>

                {(discountType === 'percentage'
                  ? discountValue > 10
                  : discountValue > 500) && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">

                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      Manager Authorization Required
                    </div>

                    <input
                      type="password"
                      maxLength={4}
                      value={managerPin}
                      onChange={e =>
                        setManagerPin(e.target.value)
                      }
                      placeholder="Enter 4-digit Manager PIN"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono tracking-widest text-center"
                    />

                    {pinError && (
                      <div className="text-[11px] text-rose-400">
                        {pinError}
                      </div>
                    )}

                  </div>
                )}

                {pinError &&
                  !(
                    discountType === 'percentage'
                      ? discountValue > 10
                      : discountValue > 500
                  ) && (
                    <div className="text-[11px] text-rose-400">
                      {pinError}
                    </div>
                  )}

                <div className="flex justify-end gap-2 pt-1">

                  <button
                    onClick={() => {
                      setShowDiscountSection(false);
                      setPinError('');
                    }}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleApplyDiscount}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                  >
                    Apply Discount
                  </button>

                </div>
              </div>
            )}

          {/* PAYMENT AREA */}
          {!paymentBlocked && (
            <>
              {/* PAYMENT METHOD */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                  {paymentMethodsList.map(pm => {
                    const Icon = pm.icon;
                    const isSelected =
                      paymentMethod === pm.id;

                    return (
                      <button
                        key={pm.id}
                        onClick={() => {
                          setPaymentMethod(pm.id);
                          setPaymentError('');
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isSelected
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        />

                        <span className="text-xs leading-tight">
                          {pm.label}
                        </span>
                      </button>
                    );
                  })}

                </div>
              </div>

              {/* CASH */}
              {paymentMethod === 'cash' ? (
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">

                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">
                        Cash Tendered
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">
                          {branch.currency}
                        </span>

                        <input
                          type="number"
                          value={tenderedAmount}
                          onChange={e => {
                            setTenderedAmount(
                              e.target.value
                            );
                            setPaymentError('');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-base font-black text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">
                        Change Due
                      </label>

                      <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-base font-black font-mono text-emerald-400 flex items-center justify-between">
                        <span>{branch.currency}</span>
                        <span>
                          {change.toLocaleString()}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* QUICK CASH */}
                  <div className="flex flex-wrap gap-1.5 pt-1">

                    <button
                      type="button"
                      onClick={() =>
                        handleQuickCash(
                          remainingBalance
                        )
                      }
                      className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium"
                    >
                      Exact ({remainingBalance})
                    </button>

                    {[500, 1000, 2000, 5000].map(
                      val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            handleQuickCash(val)
                          }
                          className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono font-medium"
                        >
                          {branch.currency} {val}
                        </button>
                      )
                    )}

                  </div>

                  {!isSufficient && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 pt-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />

                      <span>
                        Tendered cash is less than the remaining balance.
                      </span>
                    </div>
                  )}

                </div>
              ) : (
                <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">

                  <label className="block text-xs text-slate-400 font-semibold">
                    Transaction / Auth / Reference ID
                    (Optional)
                  </label>

                  <input
                    type="text"
                    value={reference}
                    onChange={e =>
                      setReference(e.target.value)
                    }
                    placeholder="e.g. POS-AUTH-99120 or EasyPaisa TID"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                  />

                </div>
              )}

              {paymentError && (
                <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            {paymentBlocked ? 'Close' : 'Cancel'}
          </button>

          {!paymentBlocked && (
            <div className="flex items-center gap-2">

              <button
                disabled={
                  remainingBalance <= 0 ||
                  (paymentMethod === 'cash' &&
                    !isSufficient)
                }
                onClick={() =>
                  handleSettlePayment(false)
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />

                <span>
                  Settle {branch.currency}{' '}
                  {remainingBalance.toLocaleString()}
                </span>
              </button>

              <button
                disabled={
                  remainingBalance <= 0 ||
                  (paymentMethod === 'cash' &&
                    !isSufficient)
                }
                onClick={() =>
                  handleSettlePayment(true)
                }
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />

                <span>
                  Settle & Print Receipt
                </span>
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
