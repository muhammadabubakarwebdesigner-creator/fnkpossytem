import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Download,
  Printer,
  Calendar,
  PieChart,
  Award,
  Bike
} from 'lucide-react';

export const ReportsDashboard: React.FC = () => {
  const { branch, orders, expenses, riders, employees, openPrintModal } = usePOS();

  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [reportSubTab, setReportSubTab] = useState<'summary' | 'products' | 'waiters' | 'riders' | 'financials'>('summary');

  // Filter orders by date if today
  const todayStr = new Date().toISOString().split('T')[0];
  const relevantOrders = orders.filter(o => {
    if (dateFilter === 'today') {
      return o.createdAt.startsWith(todayStr);
    }
    return true;
  });

  const validOrders = relevantOrders.filter(o => o.status !== 'cancelled');
  const totalOrders = validOrders.length;
  const grossSales = validOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalTax = validOrders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalDiscounts = validOrders.reduce((sum, o) => sum + o.discountAmount, 0);
  const netSales = grossSales - totalTax;
  const aov = totalOrders > 0 ? Math.round(grossSales / totalOrders) : 0;

  // Breakdown by order type
  const dineInSales = validOrders.filter(o => o.orderType === 'dine_in').reduce((s, o) => s + o.grandTotal, 0);
  const takeawaySales = validOrders.filter(o => o.orderType === 'takeaway').reduce((s, o) => s + o.grandTotal, 0);
  const deliverySales = validOrders.filter(o => o.orderType === 'delivery').reduce((s, o) => s + o.grandTotal, 0);
  const thirdPartySales = validOrders.filter(o => o.orderType === 'third_party').reduce((s, o) => s + o.grandTotal, 0);
  const carServiceSales = validOrders.filter(o => o.orderType === 'car_service').reduce((s, o) => s + o.grandTotal, 0);

  // Breakdown by payment method
  const cashPayments = validOrders.reduce(
    (sum, o) => sum + o.payments.filter(p => p.method === 'cash').reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const cardPayments = validOrders.reduce(
    (sum, o) => sum + o.payments.filter(p => p.method === 'card').reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const onlinePayments = validOrders.reduce(
    (sum, o) => sum + o.payments.filter(p => p.method !== 'cash' && p.method !== 'card').reduce((ps, p) => ps + p.amount, 0),
    0
  );

  // Product sales tally
  const productSalesMap: Record<string, { name: string; qty: number; total: number }> = {};
  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!item.voided) {
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { name: item.name, qty: 0, total: 0 };
        }
        productSalesMap[item.name].qty += item.quantity;
        productSalesMap[item.name].total += item.totalPrice;
      }
    });
  });

  const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.total - a.total);

  // Waiter performance tally
  const waiterStats: Record<string, { name: string; orders: number; totalSales: number }> = {};
  validOrders.forEach(order => {
    if (order.waiterName) {
      if (!waiterStats[order.waiterName]) {
        waiterStats[order.waiterName] = { name: order.waiterName, orders: 0, totalSales: 0 };
      }
      waiterStats[order.waiterName].orders += 1;
      waiterStats[order.waiterName].totalSales += order.grandTotal;
    }
  });

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Order Number', 'Invoice', 'Token', 'Type', 'Table/Customer', 'Amount', 'Tax', 'Discount', 'Status', 'Payment Status', 'Created At'],
      ...validOrders.map(o => [
        o.orderNumber,
        o.invoiceNumber,
        o.tokenNumber,
        o.orderType,
        o.tableName || o.customerName || 'N/A',
        o.grandTotal,
        o.taxAmount,
        o.discountAmount,
        o.status,
        o.paymentStatus,
        o.createdAt,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fork_n_Knives_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintDailyReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Executive Reporting & Sales Analytics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time revenues, channel breakdowns, top items, and waiter performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range toggle */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-md font-bold transition ${
                dateFilter === 'today'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-md font-bold transition ${
                dateFilter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintDailyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className="px-4 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 text-xs font-semibold">
        {[
          { id: 'summary', label: 'Sales Overview' },
          { id: 'products', label: 'Product Sales' },
          { id: 'waiters', label: 'Waiter Performance' },
          { id: 'riders', label: 'Rider Delivery Stats' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportSubTab(tab.id as any)}
            className={`py-3 px-3.5 border-b-2 transition ${
              reportSubTab === tab.id
                ? 'border-amber-500 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {reportSubTab === 'summary' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Gross Sales</span>
                <div className="text-xl font-black text-amber-400 font-mono mt-1">
                  {branch.currency} {grossSales.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Total billed</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Orders</span>
                <div className="text-xl font-black text-slate-100 font-mono mt-1">
                  {totalOrders}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Orders processed</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Average Order</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                  {branch.currency} {aov.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Per bill</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Sales Tax (16%)</span>
                <div className="text-xl font-black text-slate-300 font-mono mt-1">
                  {branch.currency} {totalTax.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Tax liability</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Discounts</span>
                <div className="text-xl font-black text-amber-300 font-mono mt-1">
                  {branch.currency} {totalDiscounts.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Authorized</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Net Sales</span>
                <div className="text-xl font-black text-emerald-300 font-mono mt-1">
                  {branch.currency} {netSales.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Pre-tax revenue</div>
              </div>
            </div>

            {/* Sales by Channel & Payments Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Sales by Order Channel</span>
                  <span className="font-mono text-amber-400">{branch.currency} {grossSales.toLocaleString()}</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Dine-In', amount: dineInSales, color: 'bg-blue-500' },
                    { label: 'Takeaway', amount: takeawaySales, color: 'bg-emerald-500' },
                    { label: 'Delivery', amount: deliverySales, color: 'bg-amber-500' },
                    { label: 'Third Party Delivery', amount: thirdPartySales, color: 'bg-purple-500' },
                    { label: 'Car Service', amount: carServiceSales, color: 'bg-rose-500' },
                  ].map(channel => {
                    const pct = grossSales > 0 ? Math.round((channel.amount / grossSales) * 100) : 0;
                    return (
                      <div key={channel.label} className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>{channel.label}</span>
                          <span className="font-mono font-bold">
                            {branch.currency} {channel.amount.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${channel.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Payment Methods Collected
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Cash Drawer Payments', amount: cashPayments, color: 'bg-emerald-500' },
                    { label: 'Credit / Debit Cards', amount: cardPayments, color: 'bg-blue-500' },
                    { label: 'Online / QR / Wallets', amount: onlinePayments, color: 'bg-purple-500' },
                  ].map(pm => {
                    const totalPayments = cashPayments + cardPayments + onlinePayments;
                    const pct = totalPayments > 0 ? Math.round((pm.amount / totalPayments) * 100) : 0;
                    return (
                      <div key={pm.label} className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>{pm.label}</span>
                          <span className="font-mono font-bold">
                            {branch.currency} {pm.amount.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${pm.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: TOP PRODUCTS */}
        {reportSubTab === 'products' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Menu Product Performance & Quantity Sold
              </h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Quantity Sold</th>
                  <th className="p-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedProducts.map((p, idx) => (
                  <tr key={p.name} className="hover:bg-slate-850 transition">
                    <td className="p-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-100">{p.name}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-400">{p.qty}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400">
                      {branch.currency} {p.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 3: WAITER PERFORMANCE */}
        {reportSubTab === 'waiters' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Waiter / Server Sales & Tables Served
              </h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Server / Waiter Name</th>
                  <th className="p-3 text-center">Orders Served</th>
                  <th className="p-3 text-right">Total Billed Sales</th>
                  <th className="p-3 text-right">Average Bill Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {Object.values(waiterStats).map(w => (
                  <tr key={w.name} className="hover:bg-slate-850 transition">
                    <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>{w.name}</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-200">{w.orders}</td>
                    <td className="p-3 text-right font-mono font-black text-amber-400">
                      {branch.currency} {w.totalSales.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      {branch.currency} {Math.round(w.totalSales / (w.orders || 1)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 4: RIDER STATS */}
        {reportSubTab === 'riders' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Delivery Fleet Dispatch Metrics
              </h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Rider Name</th>
                  <th className="p-3 text-center">Total Trips</th>
                  <th className="p-3 text-center">Completed Deliveries</th>
                  <th className="p-3 text-right">Cash In Hand Collected</th>
                  <th className="p-3 text-center">Avg Delivery Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {riders.map(r => (
                  <tr key={r.id} className="hover:bg-slate-850 transition">
                    <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                      <Bike className="w-4 h-4 text-amber-400" />
                      <span>{r.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({r.riderId})</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-200">{r.deliveriesToday}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-400">{r.completedDeliveries}</td>
                    <td className="p-3 text-right font-mono font-black text-amber-400">
                      {branch.currency} {r.cashCollected.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-300">
                      {r.averageDeliveryTimeMinutes} mins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
