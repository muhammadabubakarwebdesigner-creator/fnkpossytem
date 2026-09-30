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
    // Generate text version for quick clipboard
    const textContent = document.getElementById('thermal-receipt-content')?.innerText || '';
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
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
                {type === 'receipt' && order ? `#${order.orderNumber} (Token: ${order.tokenNumber})` : ''}
                {type === 'kot' && kot ? `${kot.kotNumber} (Order #${kot.orderNumber})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle: 80mm vs 58mm */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setPrintFormat('80mm')}
                className={`px-2 py-1 rounded font-medium transition ${
                  printFormat === '80mm'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm
              </button>
              <button
                onClick={() => setPrintFormat('58mm')}
                className={`px-2 py-1 rounded font-medium transition ${
                  printFormat === '58mm'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
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

        {/* Receipt Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex justify-center">
          <div
            id="thermal-receipt-content"
            className={`printable-area ${printFormat === '58mm' ? 'format-58mm' : ''} bg-white text-black p-4 font-mono text-[11px] leading-snug rounded shadow-lg`}
            style={{ width: printFormat === '58mm' ? '230px' : '310px' }}
          >
            {/* 1. CUSTOMER RECEIPT */}
            {type === 'receipt' && order && (
              <div className="space-y-2">
                {/* Brand Header */}
                <div className="text-center border-b border-dashed border-gray-400 pb-2">
                  <h2 className="text-base font-extrabold uppercase tracking-wider">
                    FORK N KNIVES
                  </h2>
                  <p className="text-[10px] italic font-semibold">{branch.receiptHeader}</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">{branch.address}</p>
                  <p className="text-[10px] text-gray-700">Phone: {branch.phone}</p>
                  <p className="text-[9px] text-gray-600">Tax NTN: {branch.taxRegistrationNumber}</p>
                </div>

                {/* DUPLICATE COPY BADGE */}
                {isDuplicate && (
                  <div className="text-center py-1 bg-gray-200 border border-dashed border-gray-500 font-bold text-xs uppercase tracking-wider">
                    *** DUPLICATE COPY ***
                  </div>
                )}

                {/* PROMINENT PAID / UNPAID STAMP */}
                <div className="my-2 py-1 text-center border-2 border-black rounded font-black text-sm tracking-widest uppercase">
                  {order.paymentStatus === 'paid' ? (
                    <span className="text-black">*** PAID ***</span>
                  ) : order.paymentStatus === 'unpaid' ? (
                    <span className="text-black bg-gray-100 px-2 py-0.5">*** UNPAID ***</span>
                  ) : (
                    <span>*** {order.paymentStatus.replace('_', ' ').toUpperCase()} ***</span>
                  )}
                </div>

                {/* Order Meta */}
                <div className="border-b border-dashed border-gray-400 pb-2 space-y-0.5 text-[10px]">
                  <div className="flex justify-between font-bold text-xs">
                    <span>Token #: {order.tokenNumber}</span>
                    <span>Order: {order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invoice #: {order.invoiceNumber}</span>
                    <span className="uppercase font-bold">Type: {order.orderType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date: {new Date(order.createdAt).toLocaleDateString('en-GB')}</span>
                    <span>Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier: {order.cashierName}</span>
                    {order.waiterName && <span>Waiter: {order.waiterName}</span>}
                  </div>
                  {order.tableName && (
                    <div className="flex justify-between font-bold">
                      <span>Table: {order.tableName} ({order.areaName || 'Dine-In'})</span>
                      {order.covers && <span>Guests: {order.covers}</span>}
                    </div>
                  )}
                </div>

                {/* Delivery Specific Details */}
                {order.orderType === 'delivery' && (
                  <div className="border-b border-dashed border-gray-400 pb-2 text-[10px] space-y-0.5 bg-gray-50 p-1.5 rounded">
                    <div className="font-bold uppercase tracking-wide border-b border-gray-300 pb-0.5">
                      Delivery Details
                    </div>
                    <div><strong>Customer:</strong> {order.customerName || 'N/A'}</div>
                    <div><strong>Phone:</strong> {order.customerPhone || 'N/A'}</div>
                    {order.customerAlternatePhone && (
                      <div><strong>Alt Phone:</strong> {order.customerAlternatePhone}</div>
                    )}
                    <div><strong>Address:</strong> {order.deliveryAddress || 'N/A'}</div>
                    {order.deliveryLandmark && (
                      <div><strong>Landmark:</strong> {order.deliveryLandmark}</div>
                    )}
                    {order.deliveryRiderName && (
                      <div className="font-semibold text-black mt-1">
                        Rider: {order.deliveryRiderName} ({order.deliveryRiderPhone})
                      </div>
                    )}
                  </div>
                )}

                {/* Items Table */}
                <div className="border-b border-dashed border-gray-400 pb-2">
                  <div className="flex justify-between font-bold border-b border-black pb-1 mb-1 text-[10px]">
                    <span className="w-1/2">ITEM</span>
                    <span className="w-1/4 text-center">QTY</span>
                    <span className="w-1/4 text-right">TOTAL</span>
                  </div>

                  <div className="space-y-1.5">
                    {order.items.map(item => (
                      <div key={item.id} className={item.voided ? 'line-through text-gray-400' : ''}>
                        <div className="flex justify-between font-medium">
                          <span className="w-1/2 font-semibold">
                            {item.name} {item.size ? `(${item.size})` : ''}
                          </span>
                          <span className="w-1/4 text-center">{item.quantity}</span>
                          <span className="w-1/4 text-right font-bold">
                            {item.totalPrice}
                          </span>
                        </div>

                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="text-[9px] text-gray-600 pl-2">
                            {item.selectedModifiers.map(m => (
                              <div key={m.id}>
                                {m.type === 'add' ? `+ ${m.name}` : `- ${m.name}`}
                                {m.price > 0 && ` (${m.price})`}
                              </div>
                            ))}
                          </div>
                        )}

                        {item.specialInstructions && (
                          <div className="text-[9px] italic text-gray-700 pl-2">
                            * {item.specialInstructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Totals Breakdown */}
                <div className="border-b border-dashed border-gray-400 pb-2 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{order.subtotal}</span>
                  </div>

                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Discount ({order.discountType === 'percentage' ? `${order.discountValue}%` : 'Flat'}):</span>
                      <span>-{order.discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Sales Tax ({order.taxRate}%):</span>
                    <span>{order.taxAmount}</span>
                  </div>

                  {order.serviceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge:</span>
                      <span>{order.serviceCharge}</span>
                    </div>
                  )}

                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Charge:</span>
                      <span>{order.deliveryCharge}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-extrabold text-sm border-t border-black pt-1">
                    <span>GRAND TOTAL:</span>
                    <span>{branch.currency} {order.grandTotal}</span>
                  </div>
                </div>

                {/* Payment History */}
                <div className="border-b border-dashed border-gray-400 pb-2 text-[10px] space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>Payment Status:</span>
                    <span className="uppercase">{order.paymentStatus}</span>
                  </div>

                  {order.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[9px] text-gray-700">
                      <span>Paid ({p.method.toUpperCase()}):</span>
                      <span>{branch.currency} {p.amount}</span>
                    </div>
                  ))}

                  {order.payments.some(p => p.change && p.change > 0) && (
                    <div className="flex justify-between font-semibold text-[9px]">
                      <span>Change Given:</span>
                      <span>{branch.currency} {order.payments.find(p => p.change)?.change}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center pt-2 text-[9px] text-gray-600">
                  <p className="font-semibold">{branch.receiptFooter}</p>
                  <p className="mt-1">Reprint Count: {order.reprintCount}</p>
                  <p className="mt-1 text-[8px] font-mono">Powered by Fork n Knives POS Engine</p>
                </div>
              </div>
            )}

            {/* 2. KITCHEN ORDER TICKET (KOT) */}
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
                    <span>{kot.kotNumber}</span>
                    <span>Token: {kot.tokenNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order: {kot.orderNumber}</span>
                    <span className="uppercase font-bold">{kot.orderType.replace('_', ' ')}</span>
                  </div>
                  {kot.tableNumber && (
                    <div className="flex justify-between font-black text-xs bg-gray-100 p-0.5">
                      <span>TABLE: {kot.tableNumber}</span>
                      <span>Waiter: {kot.waiterName || 'Staff'}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[9px] text-gray-700">
                    <span>Time: {new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span>Date: {new Date(kot.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                {/* Items (NO FINANCIAL DATA ON KOT) */}
                <div className="border-b-2 border-black pb-2">
                  <div className="flex justify-between font-bold border-b border-black pb-1 mb-1 text-[10px]">
                    <span className="w-16">QTY</span>
                    <span className="flex-1">ITEM SPECIFICATION</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {kot.items.map(item => (
                      <div key={item.id} className="border-b border-dotted border-gray-300 pb-1.5">
                        <div className="flex items-start">
                          <span className="w-14 font-black text-sm shrink-0">
                            {item.quantity} ×
                          </span>
                          <div className="flex-1">
                            <span className="font-bold">{item.name}</span>
                            {item.size && (
                              <span className="ml-1 text-[10px] font-semibold text-gray-700">
                                [{item.size}]
                              </span>
                            )}

                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-[10px] font-semibold text-gray-800 pl-1 mt-0.5">
                                {item.modifiers.map((m, idx) => (
                                  <div key={idx}>↳ {m}</div>
                                ))}
                              </div>
                            )}

                            {item.specialInstructions && (
                              <div className="text-[10px] font-bold text-black uppercase bg-gray-200 px-1 py-0.5 rounded mt-1 inline-block">
                                NOTE: {item.specialInstructions}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center text-[9px] font-bold uppercase pt-1">
                  *** END OF KOT ***
                </div>
              </div>
            )}

            {/* 3. SHIFT CLOSING REPORT */}
            {type === 'shift_report' && shift && (
              <div className="space-y-2">
                <div className="text-center border-b-2 border-black pb-2">
                  <h2 className="text-sm font-extrabold uppercase">FORK N KNIVES</h2>
                  <div className="text-xs font-bold uppercase mt-1">SHIFT SUMMARY REPORT</div>
                  <div className="text-[10px] font-mono">{shift.shiftNumber}</div>
                </div>

                <div className="border-b border-dashed border-gray-400 pb-2 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-bold">{shift.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminal:</span>
                    <span>{shift.terminal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>{new Date(shift.startTime).toLocaleString()}</span>
                  </div>
                  {shift.endTime && (
                    <div className="flex justify-between">
                      <span>Closed:</span>
                      <span>{new Date(shift.endTime).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="border-b border-dashed border-gray-400 pb-2 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span>Opening Float:</span>
                    <span>{shift.openingCash}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>+ Cash Sales:</span>
                    <span>{shift.cashSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Card Sales:</span>
                    <span>{shift.cardSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Online / Wallet Sales:</span>
                    <span>{shift.onlineSales}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>- Shift Expenses:</span>
                    <span>-{shift.expenses}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>- Refunds Issued:</span>
                    <span>-{shift.refunds}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-black pt-1">
                    <span>EXPECTED CASH:</span>
                    <span>{branch.currency} {shift.expectedCash}</span>
                  </div>
                  {shift.actualCash !== undefined && (
                    <>
                      <div className="flex justify-between font-bold">
                        <span>ACTUAL COUNTED CASH:</span>
                        <span>{branch.currency} {shift.actualCash}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-xs">
                        <span>DIFFERENCE / VARIANCE:</span>
                        <span>{shift.difference && shift.difference > 0 ? `+${shift.difference}` : shift.difference}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center text-[9px] text-gray-500 pt-2">
                  Staff Signature: __________________
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="no-print p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
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
              <span>Print Thermal Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
