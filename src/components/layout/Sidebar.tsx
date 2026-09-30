import React from 'react';
import { usePOS } from '../../context/POSContext';
import {
  ShoppingBag,
  ListOrdered,
  Utensils,
  PackageCheck,
  Bike,
  Globe2,
  Car,
  ChefHat,
  Grid2X2,
  Users2,
  Truck,
  BookOpen,
  Boxes,
  Receipt,
  UserCog,
  CalendarDays,
  BarChart3,
  ShieldAlert,
  Sliders
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    orders,
    kitchenTickets,
    tables,
    inventory,
    currentEmployee,
  } = usePOS();

  // Active running orders (non completed, non cancelled)
  const activeOrdersCount = orders.filter(
    o => o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const dineInCount = orders.filter(
    o => o.orderType === 'dine_in' && o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const takeawayCount = orders.filter(
    o => o.orderType === 'takeaway' && o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const deliveryCount = orders.filter(
    o => o.orderType === 'delivery' && o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const thirdPartyCount = orders.filter(
    o => o.orderType === 'third_party' && o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const carServiceCount = orders.filter(
    o => o.orderType === 'car_service' && o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const pendingKitchenCount = kitchenTickets.filter(
    k => k.status !== 'ready'
  ).length;

  const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;

  const lowStockCount = inventory.filter(i => i.currentStock <= i.minStock).length;

  const navItems = [
    { id: 'pos', label: 'POS / New Order', icon: ShoppingBag, shortcut: 'Shift+N' },
    { id: 'running_orders', label: 'Running Orders', icon: ListOrdered, badge: activeOrdersCount, badgeColor: 'bg-amber-500 text-slate-950' },
    
    // Order Types Direct Views
    { id: 'dine_in', label: 'Dine-In', icon: Utensils, badge: dineInCount },
    { id: 'takeaway', label: 'Takeaway', icon: PackageCheck, badge: takeawayCount },
    { id: 'delivery', label: 'Delivery', icon: Bike, badge: deliveryCount },
    { id: 'third_party', label: 'Third Party', icon: Globe2, badge: thirdPartyCount },
    { id: 'car_service', label: 'Car Service', icon: Car, badge: carServiceCount },
    
    // Operations
    { id: 'kitchen', label: 'Kitchen (KDS)', icon: ChefHat, badge: pendingKitchenCount, badgeColor: 'bg-rose-500 text-white' },
    { id: 'tables', label: 'Tables Map', icon: Grid2X2, badge: occupiedTablesCount > 0 ? `${occupiedTablesCount} occ` : undefined },
    { id: 'customers', label: 'Customers (CRM)', icon: Users2 },
    { id: 'delivery_riders', label: 'Delivery Riders', icon: Truck },
    
    // Management
    { id: 'menu', label: 'Menu & Prices', icon: BookOpen },
    { id: 'inventory', label: 'Inventory & Recipes', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-rose-600 text-white' },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'staff', label: 'Staff & Roles', icon: UserCog },
    { id: 'shifts', label: 'Shifts & Cash Drawer', icon: CalendarDays },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside className="no-print w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-57px)] select-none">
      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.shortcut && !isActive && (
                  <span className="hidden xl:inline text-[9px] text-slate-500 font-mono">
                    {item.shortcut}
                  </span>
                )}

                {item.badge !== undefined && item.badge !== 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-slate-950 text-amber-400'
                        : item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer / Terminal Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-slate-500">POS-01</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ONLINE
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-1">
          Logged as: <strong className="text-slate-200">{currentEmployee.name}</strong>
        </div>
      </div>
    </aside>
  );
};
