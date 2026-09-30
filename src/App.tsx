import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { POSScreen } from './components/pos/POSScreen';
import { RunningOrders } from './components/pos/RunningOrders';
import { TableManagement } from './components/tables/TableManagement';
import { KitchenDisplay } from './components/kitchen/KitchenDisplay';
import { DeliveryManagement } from './components/delivery/DeliveryManagement';
import { RiderManagement } from './components/riders/RiderManagement';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { MenuManagement } from './components/menu/MenuManagement';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { ExpenseManagement } from './components/expenses/ExpenseManagement';
import { StaffManagement } from './components/staff/StaffManagement';
import { ShiftManagement } from './components/shifts/ShiftManagement';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { PrintModal } from './components/modals/PrintModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { OrderDetailsModal } from './components/modals/OrderDetailsModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { Order } from './types';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = usePOS();

  // Modals state
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(null);
  const [addingItemsToOrder, setAddingItemsToOrder] = useState<Order | null>(null);

  // Quick navigation helpers
  const handleOpenPayment = (order: Order) => {
    setPaymentModalOrder(order);
  };

  const handleInspectOrder = (order: Order) => {
    setInspectedOrder(order);
  };

  const handleAddItems = (order: Order) => {
    setAddingItemsToOrder(order);
    setActiveTab('pos');
  };

  const handleNewOrderForTable = (tableId: string) => {
    setActiveTab('pos');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Application Header */}
      <Header onOpenShortcuts={() => setShowShortcuts(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Route View */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
          {activeTab === 'pos' && (
            <POSScreen
              onOpenPayment={handleOpenPayment}
              addingToOrder={addingItemsToOrder}
              onFinishAddingItems={() => setAddingItemsToOrder(null)}
            />
          )}

          {activeTab === 'running_orders' && (
            <RunningOrders
              onSelectOrder={handleInspectOrder}
              onOpenPayment={handleOpenPayment}
              onAddItemsToOrder={handleAddItems}
            />
          )}

          {activeTab === 'dine_in' && (
            <RunningOrders
              filterOrderType="dine_in"
              onSelectOrder={handleInspectOrder}
              onOpenPayment={handleOpenPayment}
              onAddItemsToOrder={handleAddItems}
            />
          )}

          {activeTab === 'takeaway' && (
            <RunningOrders
              filterOrderType="takeaway"
              onSelectOrder={handleInspectOrder}
              onOpenPayment={handleOpenPayment}
              onAddItemsToOrder={handleAddItems}
            />
          )}

          {activeTab === 'delivery' && (
            <DeliveryManagement
              onSelectOrder={handleInspectOrder}
              onOpenPayment={handleOpenPayment}
            />
          )}

          {activeTab === 'third_party' && (
            <RunningOrders
              filterOrderType="third_party"
              onSelectOrder={handleInspectOrder}
              onOpenPayment={handleOpenPayment}
              onAddItemsToOrder={handleAddItems}
            />
          )}

          {activeTab === 'car_service' && (
            <RunningOrders
              filterOrderType="car_service"
              onSelectOrder={handleInspectOrder}
              onOpenPayment={handleOpenPayment}
              onAddItemsToOrder={handleAddItems}
            />
          )}

          {activeTab === 'kitchen' && <KitchenDisplay />}

          {activeTab === 'tables' && (
            <TableManagement
              onOpenOrderForTable={handleInspectOrder}
              onNewOrderForTable={handleNewOrderForTable}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerManagement onSelectOrder={handleInspectOrder} />
          )}

          {activeTab === 'delivery_riders' && <RiderManagement />}

          {activeTab === 'menu' && <MenuManagement />}

          {activeTab === 'inventory' && <InventoryManagement />}

          {activeTab === 'expenses' && <ExpenseManagement />}

          {activeTab === 'staff' && <StaffManagement />}

          {activeTab === 'shifts' && <ShiftManagement />}

          {activeTab === 'reports' && <ReportsDashboard />}

          {activeTab === 'audit' && <AuditLogsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <PrintModal />

      <PaymentModal
        order={paymentModalOrder}
        onClose={() => setPaymentModalOrder(null)}
      />

      <OrderDetailsModal
        order={inspectedOrder}
        onClose={() => setInspectedOrder(null)}
        onOpenPayment={handleOpenPayment}
        onOpenAddItems={handleAddItems}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <MainLayout />
    </POSProvider>
  );
}
