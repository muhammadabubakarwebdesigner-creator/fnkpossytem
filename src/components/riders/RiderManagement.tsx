import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { DeliveryRider } from '../../types';
import {
  Truck,
  Plus,
  DollarSign,
  Phone,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export const RiderManagement: React.FC = () => {
  const { branch, riders, settleRider, addRider, updateRider } = usePOS();

  const [settlingRider, setSettlingRider] = useState<DeliveryRider | null>(null);
  const [expensesDeducted, setExpensesDeducted] = useState<number>(0);
  const [settlementNotes, setSettlementNotes] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New rider form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCnic, setNewCnic] = useState('');
  const [newEmergency, setNewEmergency] = useState('');
  const [newVehicle, setNewVehicle] = useState<'Motorcycle' | 'Scooter' | 'Car' | 'Bicycle'>('Motorcycle');
  const [newReg, setNewReg] = useState('');
  const [newShift, setNewShift] = useState('Evening Shift');

  const handleConfirmSettlement = () => {
    if (!settlingRider) return;
    const { dueAmount } = settleRider(settlingRider.id, expensesDeducted, settlementNotes);
    alert(`Settlement successful! Net deposited to restaurant: ${branch.currency} ${dueAmount.toLocaleString()}`);
    setSettlingRider(null);
    setExpensesDeducted(0);
    setSettlementNotes('');
  };

  const handleCreateRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Name and phone are required.');
      return;
    }

    addRider({
      riderId: `RDR-${String(riders.length + 1).padStart(2, '0')}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      cnic: newCnic.trim() || '35201-XXXXXXX-X',
      emergencyPhone: newEmergency.trim() || 'N/A',
      branch: branch.name,
      shift: newShift,
      vehicleType: newVehicle,
      vehicleRegistration: newReg.trim() || 'LEN-2026-REG',
      active: true,
      status: 'available',
    });

    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewCnic('');
    setNewReg('');
  };

  const netPayable = settlingRider ? Math.max(0, settlingRider.cashCollected - expensesDeducted) : 0;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>Delivery Fleet & Rider Settlement</span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitor rider performance metrics and perform shift-end cash collections.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Rider</span>
        </button>
      </div>

      {/* Grid of Riders */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map(rider => (
            <div
              key={rider.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-4"
            >
              <div>
                {/* Rider Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-sm">{rider.name}</h3>
                      <span className="font-mono text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-slate-700">
                        {rider.riderId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{rider.phone}</span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      rider.status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : rider.status === 'busy'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {rider.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Vehicle & Info */}
                <div className="py-2.5 border-b border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Vehicle:</span>
                    <span className="text-slate-200 font-medium">
                      {rider.vehicleType} ({rider.vehicleRegistration})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>CNIC ID:</span>
                    <span className="font-mono text-slate-300">{rider.cnic}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Emergency Contact:</span>
                    <span className="text-slate-300">{rider.emergencyPhone}</span>
                  </div>
                </div>

                {/* Today's Performance Metrics */}
                <div className="pt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Today</div>
                    <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                      {rider.deliveriesToday}
                    </div>
                    <div className="text-[9px] text-emerald-400">{rider.completedDeliveries} done</div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Avg Time</div>
                    <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                      {rider.averageDeliveryTimeMinutes}m
                    </div>
                    <div className="text-[9px] text-slate-400">speed</div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Cash In Hand</div>
                    <div className="text-sm font-black text-amber-400 font-mono mt-1">
                      {branch.currency} {rider.cashCollected.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Trigger */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSettlingRider(rider);
                    setExpensesDeducted(0);
                    setSettlementNotes('');
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Settle Shift Cash</span>
                </button>

                <button
                  onClick={() => {
                    const nextStatus =
                      rider.status === 'available'
                        ? 'busy'
                        : rider.status === 'busy'
                        ? 'off_duty'
                        : 'available';
                    updateRider({ ...rider, status: nextStatus });
                  }}
                  className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                  title="Toggle Available / Busy / Off Duty"
                >
                  Status
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIDER SETTLEMENT MODAL */}
      {settlingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Rider Shift Settlement
                </h3>
                <p className="text-xs text-slate-400">
                  {settlingRider.name} ({settlingRider.riderId})
                </p>
              </div>
              <button
                onClick={() => setSettlingRider(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Deliveries Today:</span>
                  <span className="font-bold text-slate-200">{settlingRider.completedDeliveries}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-slate-300">Total COD Cash Collected:</span>
                  <span className="font-mono text-amber-400">
                    {branch.currency} {settlingRider.cashCollected.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Rider Fuel / Shift Expenses Deducted ({branch.currency})
                </label>
                <input
                  type="number"
                  value={expensesDeducted || ''}
                  onChange={e => setExpensesDeducted(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Settlement Notes / Fuel Slip Reference
                </label>
                <input
                  type="text"
                  value={settlementNotes}
                  onChange={e => setSettlementNotes(e.target.value)}
                  placeholder="e.g. Evening shift reconciliation"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>

              {/* Net Deposit to Restaurant */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">
                    Net Cash Payable to Restaurant
                  </div>
                  <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">
                    {branch.currency} {netPayable.toLocaleString()}
                  </div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSettlingRider(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSettlement}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
              >
                Deposit & Complete Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD RIDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateRider}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Add New Delivery Rider</h3>
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
                <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Rider Full Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mobile Phone *</label>
                  <input
                    required
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="0312-XXXXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={newEmergency}
                    onChange={e => setNewEmergency(e.target.value)}
                    placeholder="0300-XXXXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">CNIC / ID</label>
                  <input
                    type="text"
                    value={newCnic}
                    onChange={e => setNewCnic(e.target.value)}
                    placeholder="35201-1234567-1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={newVehicle}
                    onChange={e => setNewVehicle(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Car">Car</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  value={newReg}
                  onChange={e => setNewReg(e.target.value)}
                  placeholder="e.g. LEN-2024-9912"
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
                Register Rider
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
