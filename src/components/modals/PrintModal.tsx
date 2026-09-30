import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Printer, X, Copy, Check } from 'lucide-react';

export const PrintModal: React.FC = () => {
  const { printModalData, closePrintModal, branch } = usePOS();

  const [printFormat, setPrintFormat] = useState<'80mm' | '58mm'>(
    printModalData?.format || '80mm'
  );

  const [copied, setCopied] = useState(false);

  if (!printModalData?.isOpen) return null;

  const { type, order, kot, shift, isDuplicate } = printModalData;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textContent =
      document.getElementById('thermal-receipt-content')?.innerText || '';

    navigator.clipboard.writeText(textContent);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">

      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* =====================================================
            MODAL HEADER
        ===================================================== */}

        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">

          <div className="flex items-center gap-2.5">

            <Printer className="w-5 h-5 text-amber-400" />

            <div>

              <h3 className="text-sm font-bold text-slate-100">

                {type === 'receipt'
                  ? 'Thermal Customer Receipt'
                  : type === 'kot'
                  ? 'Kitchen Order Ticket (KOT)'
                  : type === 'shift_report'
                  ? 'Shift Closing Report'
                  : 'Daily Sales Report'}

              </h3>

              <p className="text-[11px] text-slate-400 font-mono">

                {type === 'receipt' && order
                  ? `#${order.orderNumber} (Token: ${order.tokenNumber})`
                  : ''}

                {type === 'kot' && kot
                  ? `${kot.kotNumber} (Order #${kot.orderNumber})`
                  : ''}

              </p>

            </div>

          </div>


          <div className="flex items-center gap-2">

            {/* PRINT FORMAT */}

            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">

              <button
                onClick={() => setPrintFormat('80mm')}
                className={
                  printFormat === '80mm'
                    ? 'px-2 py-1 rounded font-bold bg-amber-500 text-slate-950'
                    : 'px-2 py-1 rounded font-medium text-slate-400 hover:text-white'
                }
              >
                80mm
              </button>

              <button
                onClick={() => setPrintFormat('58mm')}
                className={
                  printFormat === '58mm'
                    ? 'px-2 py-1 rounded font-bold bg-amber-500 text-slate-950'
                    : 'px-2 py-1 rounded font-medium text-slate-400 hover:text-white'
                }
              >
                58mm
              </button>

            </div>


            <button
              onClick={closePrintModal}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

        </div>


        {/* =====================================================
            PRINT PREVIEW
        ===================================================== */}

        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex justify-center">

          <div
            id="thermal-receipt-content"
            className={`printable-area ${
              printFormat === '58mm' ? 'format-58mm' : ''
            } bg-white text-black p-4 text-[11px] leading-snug rounded shadow-lg`}
            style={{
              width: printFormat === '58mm' ? '54mm' : '72mm',
              boxSizing: 'border-box',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}
          >

            {/* =================================================
                1. CUSTOMER RECEIPT
            ================================================= */}

            {type === 'receipt' && order && (

              <div className="space-y-2 text-black">

                {/* BRAND HEADER */}

                <div className="text-center border-b-2 border-black pb-2">

                  <div className="text-[18px] font-black uppercase tracking-[1px] leading-none">
                    FORK N KNIVES
                  </div>

                  <div className="text-[9px] font-bold mt-1">
                    Love at First Bite
                  </div>

                  {branch.receiptHeader && (
                    <div className="text-[10px] font-extrabold uppercase mt-1">
                      {branch.receiptHeader}
                    </div>
                  )}

                  <div className="text-[10px] font-bold mt-1">
                    {branch.phone}
                  </div>

                  {branch.address && (
                    <div className="text-[9px] font-semibold mt-0.5">
                      {branch.address}
                    </div>
                  )}

                  {branch.taxRegistrationNumber && (
                    <div className="text-[9px] font-semibold mt-0.5">
                      NTN / STRN: {branch.taxRegistrationNumber}
                    </div>
                  )}

                </div>


                {/* DUPLICATE COPY */}

                {isDuplicate && (

                  <div className="text-center py-1 border-y-2 border-black font-black text-xs uppercase">
                    (Duplicate Copy)
                  </div>

                )}


                {/* PAYMENT STATUS */}

                <div className="text-center py-1 border-b border-black">

                  <span className="font-black text-[13px] uppercase tracking-wide">

                    {order.paymentStatus === 'paid'
                      ? 'PAID'
                      : order.paymentStatus === 'unpaid'
                      ? 'UNPAID'
                      : order.paymentStatus
                          .replace('_', ' ')
                          .toUpperCase()}

                  </span>

                </div>


                {/* ORDER DETAILS */}

                <div className="border-b border-black pb-2 text-[10px] space-y-1">

                  <div className="flex justify-between font-black text-[11px]">

                    <span>
                      Token# {order.tokenNumber}
                    </span>

                    {order.tableName && (
                      <span>
                        Table# {order.tableName}
                      </span>
                    )}

                  </div>


                  <div className="flex justify-between">

                    <span>
                      Order ID: {order.orderNumber}
                    </span>

                    <span>
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span>
                      Invoice#: {order.invoiceNumber}
                    </span>

                    <span>
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="font-bold">
                      Order Type:{' '}
                      {order.orderType.replace('_', ' ').toUpperCase()}
                    </span>

                    <span>
                      User: {order.cashierName}
                    </span>

                  </div>


                  {order.waiterName && (

                    <div className="flex justify-between">

                      <span>
                        Order Taker:
                      </span>

                      <span className="font-bold">
                        {order.waiterName}
                      </span>

                    </div>

                  )}


                  {order.covers && (

                    <div className="flex justify-between">

                      <span>
                        Customer / Covers:
                      </span>

                      <span className="font-bold">
                        {order.covers}
                      </span>

                    </div>

                  )}

                </div>


                {/* DELIVERY DETAILS */}

                {order.orderType === 'delivery' && (

                  <div className="border-b border-black pb-2 text-[10px] space-y-1">

                    <div className="text-center font-black uppercase border-b border-black pb-1">
                      Delivery Details
                    </div>

                    <div>
                      <strong>Customer:</strong>{' '}
                      {order.customerName || 'N/A'}
                    </div>

                    <div>
                      <strong>Phone:</strong>{' '}
                      {order.customerPhone || 'N/A'}
                    </div>

                    {order.customerAlternatePhone && (

                      <div>
                        <strong>Alt Phone:</strong>{' '}
                        {order.customerAlternatePhone}
                      </div>

                    )}

                    <div>
                      <strong>Address:</strong>{' '}
                      {order.deliveryAddress || 'N/A'}
                    </div>

                    {order.deliveryLandmark && (

                      <div>
                        <strong>Landmark:</strong>{' '}
                        {order.deliveryLandmark}
                      </div>

                    )}

                    {order.deliveryRiderName && (

                      <div className="font-bold">

                        Rider: {order.deliveryRiderName}

                        {order.deliveryRiderPhone
                          ? ` (${order.deliveryRiderPhone})`
                          : ''}

                      </div>

                    )}

                  </div>

                )}


                {/* ORDER DETAIL TITLE */}

                <div className="text-center font-black text-[11px] border-b border-black pb-1">
                  Order Detail
                </div>


                {/* ITEMS HEADER */}

                <div className="grid grid-cols-[1fr_25px_38px_45px] gap-1 font-black text-[9px] border-b border-black pb-1">

                  <span>
                    Item
                  </span>

                  <span className="text-center">
                    Qty
                  </span>

                  <span className="text-right">
                    Rate
                  </span>

                  <span className="text-right">
                    Total
                  </span>

                </div>


                {/* ITEMS */}

                <div className="space-y-1.5 border-b border-black pb-2">

                  {order.items.map(item => {

                    const quantity = item.quantity || 1;

                    const itemTotal =
                      Number(item.totalPrice) || 0;

                    const unitRate =
                      quantity > 0
                        ? itemTotal / quantity
                        : itemTotal;

                    return (

                      <div
                        key={item.id}
                        className={
                          item.voided
                            ? 'line-through'
                            : ''
                        }
                      >

                        <div className="grid grid-cols-[1fr_25px_38px_45px] gap-1 items-start text-[10px]">

                          <span className="font-bold break-words">

                            {item.name}

                            {item.size && (
                              <span className="font-semibold">
                                {' '}({item.size})
                              </span>
                            )}

                          </span>


                          <span className="text-center font-bold">
                            {item.quantity}
                          </span>


                          <span className="text-right">
                            {Number.isInteger(unitRate)
                              ? unitRate
                              : unitRate.toFixed(2)}
                          </span>


                          <span className="text-right font-bold">
                            {item.totalPrice}
                          </span>

                        </div>


                        {item.selectedModifiers &&
                          item.selectedModifiers.length > 0 && (

                            <div className="text-[9px] font-semibold pl-1 mt-0.5">

                              {item.selectedModifiers.map(m => (

                                <div key={m.id}>

                                  {m.type === 'add'
                                    ? '+ '
                                    : '- '}

                                  {m.name}

                                  {m.price > 0 &&
                                    ` (${m.price})`}

                                </div>

                              ))}

                            </div>

                          )}


                        {item.specialInstructions && (

                          <div className="text-[9px] italic font-bold pl-1">
                            * {item.specialInstructions}
                          </div>

                        )}

                      </div>

                    );

                  })}

                </div>


                {/* BILL TOTALS */}

                <div className="border-b border-black pb-2 text-[10px] space-y-1">

                  <div className="flex justify-between font-semibold">

                    <span>
                      Sub Total
                    </span>

                    <span>
                      {branch.currency} {order.subtotal}
                    </span>

                  </div>


                  {order.discountAmount > 0 && (

                    <div className="flex justify-between font-semibold">

                      <span>

                        Discount{' '}

                        {order.discountType === 'percentage'
                          ? `(${order.discountValue}%)`
                          : ''}

                      </span>

                      <span>
                        -{branch.currency} {order.discountAmount}
                      </span>

                    </div>

                  )}


                  <div className="flex justify-between font-semibold">

                    <span>
                      VAT/GST ({order.taxRate}%)
                    </span>

                    <span>
                      {branch.currency} {order.taxAmount}
                    </span>

                  </div>


                  {order.serviceCharge > 0 && (

                    <div className="flex justify-between font-semibold">

                      <span>
                        Service Charge
                      </span>

                      <span>
                        {branch.currency} {order.serviceCharge}
                      </span>

                    </div>

                  )}


                  {order.deliveryCharge > 0 && (

                    <div className="flex justify-between font-semibold">

                      <span>
                        Delivery Charge
                      </span>

                      <span>
                        {branch.currency} {order.deliveryCharge}
                      </span>

                    </div>

                  )}


                  <div className="flex justify-between font-black text-[14px] border-y-2 border-black py-1 mt-1">

                    <span>
                      GRAND TOTAL
                    </span>

                    <span>
                      {branch.currency} {order.grandTotal}
                    </span>

                  </div>

                </div>


                {/* PAYMENT DETAILS */}

                <div className="border-b border-black pb-2 text-[10px] space-y-1">

                  {order.payments.map((p, idx) => (

                    <div
                      key={idx}
                      className="flex justify-between font-bold"
                    >

                      <span>
                        Payment Mode: {p.method.toUpperCase()}
                      </span>

                      <span>
                        {branch.currency} {p.amount}
                      </span>

                    </div>

                  ))}


                  {order.payments.some(
                    p => p.change && p.change > 0
                  ) && (

                    <div className="flex justify-between font-bold">

                      <span>
                        Change Due
                      </span>

                      <span>

                        {branch.currency}{' '}

                        {
                          order.payments.find(
                            p => p.change && p.change > 0
                          )?.change
                        }

                      </span>

                    </div>

                  )}


                  <div className="flex justify-between font-black">

                    <span>
                      Payment Status
                    </span>

                    <span className="uppercase">
                      {order.paymentStatus}
                    </span>

                  </div>

                </div>


                {/* CUSTOMER DETAILS */}

                <div className="border-b border-black pb-2 text-[10px]">

                  <div className="text-center font-black border-b border-black pb-1 mb-1">
                    Customer Detail
                  </div>


                  <div className="flex justify-between">

                    <span>
                      {order.customerName || 'Walk-in'}
                    </span>

                    {order.covers && (
                      <span>
                        Covers: {order.covers}
                      </span>
                    )}

                  </div>


                  {order.waiterName && (

                    <div className="flex justify-between mt-1">

                      <span>
                        Order-Taker:
                      </span>

                      <span className="font-black">
                        {order.waiterName}
                      </span>

                    </div>

                  )}

                </div>


                {/* FOOTER */}

                <div className="text-center pt-1 text-[9px] font-semibold">

                  {branch.receiptFooter && (

                    <p className="font-bold">
                      {branch.receiptFooter}
                    </p>

                  )}


                  <p className="mt-1">

                    Printed:{' '}

                    {new Date().toLocaleDateString('en-GB')}

                    {' '}

                    {new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}

                  </p>


                  {isDuplicate && (

                    <p className="font-black mt-1">
                      DUPLICATE RECEIPT
                    </p>

                  )}


                  <p className="mt-2 font-black">
                    Thank You For Visiting Fork N Knives
                  </p>


                  <p className="mt-1 text-[8px]">
                    Powered by Fork n Knives POS Engine
                  </p>

                </div>

              </div>

            )}


            {/* =================================================
                2. KITCHEN ORDER TICKET
            ================================================= */}

            {type === 'kot' && kot && (

              <div className="space-y-2">

                <div className="text-center border-b-2 border-black pb-2">

                  <h2 className="text-base font-black uppercase tracking-wider">
                    FORK N KNIVES
                  </h2>

                  <div className="text-xs font-black uppercase tracking-widest bg-black text-white py-0.5 mt-1">
                    KITCHEN ORDER TICKET
                  </div>


                  {kot.isAdditional && (

                    <div className="text-xs font-bold text-black border border-black mt-1 py-0.5 uppercase">
                      *** ADDITIONAL ITEMS KOT ***
                    </div>

                  )}

                </div>


                <div className="border-b border-dashed border-gray-500 pb-2 text-[10px] space-y-1">

                  <div className="flex justify-between font-bold text-xs">

                    <span>
                      {kot.kotNumber}
                    </span>

                    <span>
                      Token: {kot.tokenNumber}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span>
                      Order: {kot.orderNumber}
                    </span>

                    <span className="uppercase font-bold">
                      {kot.orderType.replace('_', ' ')}
                    </span>

                  </div>


                  {kot.tableNumber && (

                    <div className="flex justify-between font-black text-xs border-y border-black py-1">

                      <span>
                        TABLE: {kot.tableNumber}
                      </span>

                      <span>
                        Waiter: {kot.waiterName || 'Staff'}
                      </span>

                    </div>

                  )}


                  <div className="flex justify-between text-[9px]">

                    <span>

                      Time:{' '}

                      {new Date(kot.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}

                    </span>

                    <span>

                      Date:{' '}

                      {new Date(kot.createdAt).toLocaleDateString('en-GB')}

                    </span>

                  </div>

                </div>


                {/* KOT ITEMS */}

                <div className="border-b-2 border-black pb-2">

                  <div className="flex justify-between font-black border-b border-black pb-1 mb-1 text-[10px]">

                    <span className="w-16">
                      QTY
                    </span>

                    <span className="flex-1">
                      ITEM SPECIFICATION
                    </span>

                  </div>


                  <div className="space-y-2 text-xs">

                    {kot.items.map(item => (

                      <div
                        key={item.id}
                        className="border-b border-dotted border-black pb-1.5"
                      >

                        <div className="flex items-start">

                          <span className="w-14 font-black text-sm shrink-0">
                            {item.quantity} ×
                          </span>


                          <div className="flex-1">

                            <span className="font-black">
                              {item.name}
                            </span>


                            {item.size && (

                              <span className="ml-1 text-[10px] font-bold">
                                [{item.size}]
                              </span>

                            )}


                            {item.modifiers &&
                              item.modifiers.length > 0 && (

                                <div className="text-[10px] font-bold pl-1 mt-0.5">

                                  {item.modifiers.map((m, idx) => (

                                    <div key={idx}>
                                      ↳ {m}
                                    </div>

                                  ))}

                                </div>

                              )}


                            {item.specialInstructions && (

                              <div className="text-[10px] font-black uppercase border border-black px-1 py-0.5 mt-1 inline-block">

                                NOTE: {item.specialInstructions}

                              </div>

                            )}

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>


                <div className="text-center text-[9px] font-black uppercase pt-1">
                  *** END OF KOT ***
                </div>

              </div>

            )}


            {/* =================================================
                3. SHIFT CLOSING REPORT
            ================================================= */}

            {type === 'shift_report' && shift && (

              <div className="space-y-2">

                <div className="text-center border-b-2 border-black pb-2">

                  <h2 className="text-sm font-black uppercase">
                    FORK N KNIVES
                  </h2>

                  <div className="text-xs font-black uppercase mt-1">
                    SHIFT SUMMARY REPORT
                  </div>

                  <div className="text-[10px] font-bold">
                    {shift.shiftNumber}
                  </div>

                </div>


                <div className="border-b border-black pb-2 text-[10px] space-y-1">

                  <div className="flex justify-between">

                    <span>
                      Cashier:
                    </span>

                    <span className="font-black">
                      {shift.employeeName}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span>
                      Terminal:
                    </span>

                    <span>
                      {shift.terminal}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span>
                      Started:
                    </span>

                    <span>
                      {new Date(shift.startTime).toLocaleString()}
                    </span>

                  </div>


                  {shift.endTime && (

                    <div className="flex justify-between">

                      <span>
                        Closed:
                      </span>

                      <span>
                        {new Date(shift.endTime).toLocaleString()}
                      </span>

                    </div>

                  )}

                </div>


                <div className="border-b border-black pb-2 text-[10px] space-y-1">

                  <div className="flex justify-between">

                    <span>
                      Opening Float:
                    </span>

                    <span>
                      {shift.openingCash}
                    </span>

                  </div>


                  <div className="flex justify-between font-bold">

                    <span>
                      + Cash Sales:
                    </span>

                    <span>
                      {shift.cashSales}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span>
                      Card Sales:
                    </span>

                    <span>
                      {shift.cardSales}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span>
                      Online / Wallet Sales:
                    </span>

                    <span>
                      {shift.onlineSales}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span>
                      - Shift Expenses:
                    </span>

                    <span>
                      -{shift.expenses}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span>
                      - Refunds Issued:
                    </span>

                    <span>
                      -{shift.refunds}
                    </span>

                  </div>


                  <div className="flex justify-between font-black border-t-2 border-black pt-1">

                    <span>
                      EXPECTED CASH:
                    </span>

                    <span>
                      {branch.currency} {shift.expectedCash}
                    </span>

                  </div>


                  {shift.actualCash !== undefined && (

                    <>

                      <div className="flex justify-between font-black">

                        <span>
                          ACTUAL COUNTED CASH:
                        </span>

                        <span>
                          {branch.currency} {shift.actualCash}
                        </span>

                      </div>


                      <div className="flex justify-between font-black text-xs">

                        <span>
                          DIFFERENCE / VARIANCE:
                        </span>

                        <span>

                          {shift.difference &&
                          shift.difference > 0
                            ? `+${shift.difference}`
                            : shift.difference}

                        </span>

                      </div>

                    </>

                  )}

                </div>


                <div className="text-center text-[9px] font-bold pt-2">
                  Staff Signature: __________________
                </div>

              </div>

            )}

          </div>

        </div>


        {/* =====================================================
            MODAL ACTIONS
        ===================================================== */}

        <div className="no-print p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >

            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}

            <span>
              {copied ? 'Copied' : 'Copy Text'}
            </span>

          </button>


          <div className="flex items-center gap-2">

            <button
              onClick={closePrintModal}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Close
            </button>


            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >

              <Printer className="w-4 h-4" />

              <span>
                Print Thermal Ticket
              </span>

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
