import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { RestaurantExpense, PaymentMethod } from '../../types';
import { Receipt, Plus, DollarSign, Calendar, FileText, Tag, User } from 'lucide-react';

export const ExpenseManagement: React.FC = () => {
  const { branch, expenses, addExpense, currentEmployee } = usePOS();

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<RestaurantExpense['category']>('Petty Cash');
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [receiptRef, setReceiptRef] = useState('');

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      alert('Description and valid amount are required.');
      return;
    }

    addExpense({
      date: new Date().toISOString().split('T')[0],
      category,
      amount,
      paymentMethod,
      description: description.trim(),
      employeeName: currentEmployee.name,
      receiptReference: receiptRef.trim() || undefined,
    });

    setShowAddModal(false);
    setDescription('');
    setAmount(1000);
    setReceiptRef('');
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span>Store Operations & Petty Cash Expenses</span>
          </h2>
          <p className="text-xs text-slate-400">
            Log daily operational payouts, fuel, maintenance, and petty cash vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <span className="text-slate-400">Total Recorded:</span>{' '}
            <strong className="text-amber-400 font-mono">
              {branch.currency} {totalExpenses.toLocaleString()}
            </strong>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Logged By</th>
                <th className="p-3">Receipt / Ref #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-850 transition">
                  <td className="p-3 font-mono text-slate-400">{exp.date}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold text-[10px] border border-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-200">{exp.description}</td>
                  <td className="p-3 text-right font-mono font-black text-rose-400 text-sm">
                    -{branch.currency} {exp.amount.toLocaleString()}
                  </td>
                  <td className="p-3 font-bold uppercase text-slate-300">{exp.paymentMethod}</td>
                  <td className="p-3 text-slate-400">{exp.employeeName}</td>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">
                    {exp.receiptReference || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateExpense}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Record Operational Expense</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-semibold"
                >
                  <option value="Petty Cash">Petty Cash</option>
                  <option value="Fuel">Fuel (Generator / Delivery)</option>
                  <option value="Cleaning">Cleaning & Hygiene</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Staff">Staff Meals & Welfare</option>
                  <option value="Delivery">Delivery Packaging / Tolls</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Amount ({branch.currency}) *</label>
                  <input
                    required
                    type="number"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    <option value="cash">Cash Drawer Float</option>
                    <option value="card">Company Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Particulars *</label>
                <input
                  required
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Purchased fresh mint and lemon bunches from subzi mandi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Receipt / Voucher / Ref #</label>
                <input
                  type="text"
                  value={receiptRef}
                  onChange={e => setReceiptRef(e.target.value)}
                  placeholder="e.g. VCH-00921"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
