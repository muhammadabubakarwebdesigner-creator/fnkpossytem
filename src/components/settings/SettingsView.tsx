import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Sliders, Save, CheckCircle2, RotateCcw } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { branch, resetDemoData } = usePOS();
  const [saved, setSaved] = useState(false);

  // Form states
  const [branchName, setBranchName] = useState(branch.name);
  const [address, setAddress] = useState(branch.address);
  const [phone, setPhone] = useState(branch.phone);
  const [taxReg, setTaxReg] = useState(branch.taxRegistrationNumber);
  const [receiptHeader, setReceiptHeader] = useState(branch.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(branch.receiptFooter);
  const [taxRate, setTaxRate] = useState(branch.taxRate);
  const [serviceRate, setServiceRate] = useState(branch.serviceChargeRate);
  const [deliveryCharge, setDeliveryCharge] = useState(branch.defaultDeliveryCharge);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    branch.name = branchName;
    branch.address = address;
    branch.phone = phone;
    branch.taxRegistrationNumber = taxReg;
    branch.receiptHeader = receiptHeader;
    branch.receiptFooter = receiptFooter;
    branch.taxRate = taxRate;
    branch.serviceChargeRate = serviceRate;
    branch.defaultDeliveryCharge = deliveryCharge;

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Restaurant Configuration & Thermal Printer Settings</span>
          </h2>
          <p className="text-xs text-slate-400">
            Store metadata, tax percentages, thermal printer headers, and operational presets.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/40 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Restaurant Identity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
              Restaurant Profile & Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Brand Name</label>
                <input
                  type="text"
                  disabled
                  value="Fork n Knives"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 text-slate-300 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Branch Name</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Tax NTN / Registration Number
                </label>
                <input
                  type="text"
                  value={taxReg}
                  onChange={e => setTaxReg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Thermal Receipt Text Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
              Thermal Receipt Print Customization
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Receipt Header Tagline
                </label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={e => setReceiptHeader(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Receipt Footer</label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={e => setReceiptFooter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Tax & Charges Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
              Taxes & Operational Charges
            </h3>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Sales Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Dine-In Service Charge (%)
                </label>
                <input
                  type="number"
                  value={serviceRate}
                  onChange={e => setServiceRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Default Delivery Fee ({branch.currency})
                </label>
                <input
                  type="number"
                  value={deliveryCharge}
                  onChange={e => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all demo data back to default initial state?')) {
                  resetDemoData();
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database to Initial Seeds</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
