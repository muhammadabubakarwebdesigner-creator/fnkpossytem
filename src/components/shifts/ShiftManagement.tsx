import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Shift } from '../../types';
import {
  CalendarDays,
  DollarSign,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  CreditCard,
  Receipt,
  RotateCcw
} from 'lucide-react';

export const ShiftManagement: React.FC = () => {
  const {
    branch,
    currentShift,
    shiftHistory,
    openShift,
    closeShift,
    openPrintModal,
    currentEmployee,
  } = usePOS();

  // Open Shift Form
  const [openingCashInput, setOpeningCashInput] = useState<number>(15000);
  const [terminalInput, setTerminalInput] = useState<string>('POS-Terminal 01');

  // Close Shift Form
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [actualCashInput, setActualCashInput] = useState<number>(
    currentShift?.expectedCash || 0
  );
  const [closingNotes, setClosingNotes] = useState<string>('');

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openShift(openingCashInput, terminalInput);
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    const closed = closeShift(actualCashInput, closingNotes);
    setShowCloseModal(false);
    openPrintModal({
      type: 'shift_report',
      shift: closed,
    });
  };

  const handlePrintReport = (shift: Shift) => {
    openPrintModal({
      type: 'shift_report',
      shift,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-400" />
            <span>Shift Management & Cash Drawer Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-400">
            Open floats, live drawer audits, cash variance calculations, and end-of-shift reports.
          </p>
        </div>

        {currentShift && (
          <button
            onClick={() => {
              setActualCashInput(currentShift.expectedCash);
              setShowCloseModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition"
          >
            <Lock className="w-4 h-4" />
            <span>Close Active Shift & Reconcile</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ACTIVE SHIFT STATUS CARD */}
        {currentShift ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-100">
                      Active Shift: {currentShift.shiftNumber}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase border border-emerald-500/30">
                      OPEN & RUNNING
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Opened by <strong>{currentShift.employeeName}</strong> on {currentShift.terminal} • Started at{' '}
                    {new Date(currentShift.startTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePrintReport(currentShift)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Interim X-Report</span>
              </button>
            </div>

            {/* Live Financial Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500">Opening Float</div>
                <div className="text-base font-black font-mono text-slate-200 mt-1">
                  {branch.currency} {currentShift.openingCash.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-emerald-400">Cash Sales (+)</div>
                <div className="text-base font-black font-mono text-emerald-300 mt-1">
                  {branch.currency} {currentShift.cashSales.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Card Sales</div>
                <div className="text-base font-black font-mono text-slate-200 mt-1">
                  {branch.currency} {currentShift.cardSales.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Online / QR</div>
                <div className="text-base font-black font-mono text-slate-200 mt-1">
                  {branch.currency} {currentShift.onlineSales.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-rose-400">Expenses / Payouts (-)</div>
                <div className="text-base font-black font-mono text-rose-300 mt-1">
                  -{branch.currency} {currentShift.expenses.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="text-[10px] uppercase font-black text-amber-300">Expected In Drawer</div>
                <div className="text-base font-black font-mono text-amber-400 mt-1">
                  {branch.currency} {currentShift.expectedCash.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* NO ACTIVE SHIFT: OPEN SHIFT PROMPT */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-xl mx-auto space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">No Shift Currently Open</h3>
              <p className="text-xs text-slate-400 mt-1">
                To start taking orders and register cash drawers, initialize a new shift with the starting cash float.
              </p>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4 text-left pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">
                    Opening Cash Float ({branch.currency}) *
                  </label>
                  <input
                    required
                    type="number"
                    value={openingCashInput}
                    onChange={e => setOpeningCashInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">
                    Terminal ID
                  </label>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={e => setTerminalInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                Staff: <strong className="text-slate-200">{currentEmployee.name}</strong> ({currentEmployee.role})
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition"
              >
                Open Terminal Shift & Start Operations
              </button>
            </form>
          </div>
        )}

        {/* SHIFT HISTORY ARCHIVE */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
            Previous Closed Shifts History
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Shift #</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3">Start Time</th>
                  <th className="p-3">End Time</th>
                  <th className="p-3 text-right">Cash Sales</th>
                  <th className="p-3 text-right">Card Sales</th>
                  <th className="p-3 text-right">Expected Cash</th>
                  <th className="p-3 text-right">Actual Counted</th>
                  <th className="p-3 text-center">Variance</th>
                  <th className="p-3 text-center">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {shiftHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-500">
                      No closed shift reports in archive yet.
                    </td>
                  </tr>
                ) : (
                  shiftHistory.map(shf => (
                    <tr key={shf.id} className="hover:bg-slate-850 transition">
                      <td className="p-3 font-mono font-bold text-amber-400">{shf.shiftNumber}</td>
                      <td className="p-3 font-semibold text-slate-200">{shf.employeeName}</td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        {new Date(shf.startTime).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        {shf.endTime ? new Date(shf.endTime).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {branch.currency} {shf.cashSales.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">
                        {branch.currency} {shf.cardSales.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">
                        {branch.currency} {shf.expectedCash.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-100">
                        {branch.currency} {shf.actualCash?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {shf.difference !== undefined ? (
                          <span
                            className={
                              shf.difference === 0
                                ? 'text-emerald-400'
                                : shf.difference > 0
                                ? 'text-blue-400'
                                : 'text-rose-400'
                            }
                          >
                            {shf.difference > 0 ? `+${shf.difference}` : shf.difference}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handlePrintReport(shf)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
                          title="Print Shift Report"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CLOSE SHIFT MODAL */}
      {showCloseModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCloseShiftSubmit}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">Close & Settle Shift</h3>
                <p className="text-xs text-slate-400">{currentShift.shiftNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Opening Float:</span>
                  <span className="font-mono text-slate-200">
                    {branch.currency} {currentShift.openingCash}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Cash Sales Recorded:</span>
                  <span className="font-mono">+{branch.currency} {currentShift.cashSales}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Expenses Deducted:</span>
                  <span className="font-mono">-{branch.currency} {currentShift.expenses}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-slate-800 pt-1.5 text-amber-400">
                  <span>SYSTEM EXPECTED CASH:</span>
                  <span className="font-mono">
                    {branch.currency} {currentShift.expectedCash.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Actual Physical Cash Counted in Drawer *
                </label>
                <input
                  required
                  type="number"
                  value={actualCashInput}
                  onChange={e => setActualCashInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-base font-black font-mono text-amber-400 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Real-time Variance */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Cash Discrepancy / Variance:</span>
                <span
                  className={`font-mono font-black text-sm ${
                    actualCashInput - currentShift.expectedCash === 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {actualCashInput - currentShift.expectedCash >= 0 ? '+' : ''}
                  {branch.currency} {(actualCashInput - currentShift.expectedCash).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Closing Notes</label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder="Optional shift notes or explanation"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow"
              >
                Close Shift & Print Z-Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
