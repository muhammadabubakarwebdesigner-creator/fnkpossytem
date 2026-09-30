import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Customer, Order } from '../../types';
import {
  Users2,
  Search,
  Plus,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  ShoppingBag,
  Eye,
  FileText
} from 'lucide-react';

interface CustomerManagementProps {
  onSelectOrder: (order: Order) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ onSelectOrder }) => {
  const { branch, customers, orders, addCustomer } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New customer form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.area.toLowerCase().includes(q)
    );
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert('Name, Phone, and Address are required.');
      return;
    }

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      alternatePhone: altPhone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim(),
      area: area.trim() || 'Gulberg',
      landmark: landmark.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setShowAddModal(false);
    setName('');
    setPhone('');
    setAltPhone('');
    setEmail('');
    setAddress('');
    setArea('');
    setLandmark('');
    setNotes('');
  };

  const customerOrders = selectedCustomer
    ? orders.filter(
        o => o.customerId === selectedCustomer.id || (o.customerPhone && o.customerPhone === selectedCustomer.phone)
      )
    : [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-amber-400" />
            <span>Customer Relationship Management (CRM)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Customer address book, past order history, and lifetime customer spending metrics.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone number, address, or area..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Customer List Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Mobile Phone</th>
                <th className="p-3">Address & Area</th>
                <th className="p-3 text-center">Orders</th>
                <th className="p-3 text-right">Lifetime Spend</th>
                <th className="p-3 text-right">Average Order</th>
                <th className="p-3">Last Order</th>
                <th className="p-3 text-center">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCustomers.map(customer => {
                const aov =
                  customer.totalOrders > 0
                    ? Math.round(customer.totalSpent / customer.totalOrders)
                    : 0;

                return (
                  <tr key={customer.id} className="hover:bg-slate-850 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{customer.name}</div>
                      {customer.email && (
                        <div className="text-[10px] text-slate-400">{customer.email}</div>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">{customer.phone}</td>
                    <td className="p-3">
                      <div className="text-slate-300 truncate max-w-xs">{customer.address}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{customer.area}</div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-200">
                      {customer.totalOrders}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400">
                      {branch.currency} {customer.totalSpent.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      {branch.currency} {aov.toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {customer.lastOrderDate || 'No orders'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 mx-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Orders</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-5 flex flex-col max-h-[85vh] overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-100">
                  {selectedCustomer.name} – Order History
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedCustomer.phone} • {selectedCustomer.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Total Orders</span>
                <div className="text-lg font-black text-slate-100 font-mono mt-0.5">
                  {selectedCustomer.totalOrders}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Lifetime Value</span>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {branch.currency} {selectedCustomer.totalSpent.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Average Order</span>
                <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                  {branch.currency}{' '}
                  {selectedCustomer.totalOrders > 0
                    ? Math.round(selectedCustomer.totalSpent / selectedCustomer.totalOrders).toLocaleString()
                    : 0}
                </div>
              </div>
            </div>

            {/* Orders list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="text-xs font-bold text-slate-300">Previous Orders:</div>
              {customerOrders.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No orders recorded yet under this customer phone.
                </div>
              ) : (
                customerOrders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedCustomer(null);
                      onSelectOrder(o);
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-slate-200">
                        {o.orderNumber} • Token #{o.tokenNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString('en-GB')} at{' '}
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        • {o.orderType.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-1">
                        {o.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-amber-400">
                        {branch.currency} {o.grandTotal.toLocaleString()}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {o.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateCustomer}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Add Customer Profile</h3>
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
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Mr Salman"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Primary Mobile *</label>
                  <input
                    required
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Alternate Phone</label>
                  <input
                    type="text"
                    value={altPhone}
                    onChange={e => setAltPhone(e.target.value)}
                    placeholder="0321-7654321"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Delivery Address *</label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House #, Street, Block"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Area / Sector</label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="Gulberg / DHA / Model Town"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Landmark</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="Near Park / Mosque"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Customer Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Special preferences or instructions"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
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
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
