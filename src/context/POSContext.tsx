import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Branch,
  Employee,
  DeliveryRider,
  RestaurantTable,
  MenuCategory,
  MenuItem,
  Customer,
  Order,
  OrderItem,
  KitchenTicket,
  InventoryItem,
  Supplier,
  Shift,
  RestaurantExpense,
  AuditLog,
  AppNotification,
  OrderStatus,
  PaymentMethod,
  TableStatus,
  StockTransaction
} from '../types';
import {
  initialBranch,
  initialEmployees,
  initialRiders,
  initialTables,
  initialCategories,
  initialMenuItems,
  initialCustomers,
  initialOrders,
  initialKitchenTickets,
  initialInventory,
  initialSuppliers,
  initialExpenses,
  initialCurrentShift,
  initialAuditLogs,
  initialNotifications
} from '../data/initialData';

interface POSContextType {
  // State
  branch: Branch;
  employees: Employee[];
  currentEmployee: Employee;
  riders: DeliveryRider[];
  tables: RestaurantTable[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  customers: Customer[];
  orders: Order[];
  kitchenTickets: KitchenTicket[];
  inventory: InventoryItem[];
  stockTransactions: StockTransaction[];
  suppliers: Supplier[];
  expenses: RestaurantExpense[];
  currentShift: Shift | null;
  shiftHistory: Shift[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  
  // Navigation & UI Helpers
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedOrderForModal: Order | null;
  setSelectedOrderForModal: (order: Order | null) => void;
  printModalData: {
    isOpen: boolean;
    type: 'receipt' | 'kot' | 'shift_report' | 'daily_sales';
    order?: Order;
    kot?: KitchenTicket;
    shift?: Shift;
    isDuplicate?: boolean;
    format?: '80mm' | '58mm';
  } | null;
  openPrintModal: (config: {
    type: 'receipt' | 'kot' | 'shift_report' | 'daily_sales';
    order?: Order;
    kot?: KitchenTicket;
    shift?: Shift;
    isDuplicate?: boolean;
    format?: '80mm' | '58mm';
  }) => void;
  closePrintModal: () => void;
  
  // Notification actions
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (title: string, message: string, type: AppNotification['type'], severity: AppNotification['severity'], linkTab?: string) => void;

  // Actions
  switchEmployee: (employeeId: string) => void;
  verifyManagerPin: (pin: string) => boolean;
  createOrder: (orderData: Partial<Order>) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => void;
  addItemsToOrder: (orderId: string, newItems: OrderItem[]) => void;
  processPayment: (
    orderId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    tendered?: number,
    change?: number
  ) => boolean;
  applyDiscount: (
    orderId: string,
    type: 'percentage' | 'fixed',
    value: number,
    reason: string,
    authorizedByManager?: string
  ) => void;
  refundOrder: (
    orderId: string,
    amount: number,
    reason: string,
    managerPin: string,
    refundedItemId?: string
  ) => { success: boolean; error?: string };
  cancelOrder: (orderId: string, reason: string, managerPin?: string) => { success: boolean; error?: string };
  assignRider: (orderId: string, riderId: string) => void;
  dispatchDelivery: (orderId: string) => void;
  completeDelivery: (orderId: string, paymentMethod?: PaymentMethod) => void;
  transferTable: (fromTableId: string, toTableId: string) => { success: boolean; message?: string };
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  reprintReceipt: (orderId: string, reason?: string) => void;
  reprintKOT: (kotId: string, reason?: string) => void;
  
  // Kitchen Ticket actions
  updateKOTStatus: (kotId: string, status: 'new' | 'accepted' | 'preparing' | 'ready') => void;
  
  // Rider Settlement
  settleRider: (riderId: string, expensesDeducted: number, notes?: string) => { dueAmount: number };
  addRider: (rider: Omit<DeliveryRider, 'id' | 'deliveriesToday' | 'completedDeliveries' | 'failedDeliveries' | 'cashCollected' | 'averageDeliveryTimeMinutes'>) => void;
  updateRider: (rider: DeliveryRider) => void;

  // Shift & Cash Drawer
  openShift: (openingCash: number, terminal?: string) => void;
  closeShift: (actualCash: number, closingNotes?: string) => Shift;
  addExpense: (expense: Omit<RestaurantExpense, 'id'>) => void;

  // Inventory & Recipes
  adjustStock: (ingredientId: string, quantity: number, type: StockTransaction['type'], reason: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (itemId: string) => { success: boolean; error?: string };

  // Menu CRUD
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  toggleMenuItemAvailability: (itemId: string) => void;
  addCategory: (category: Omit<MenuCategory, 'id'>) => void;

  // Customers CRM
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;

  // Reset
  resetDemoData: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'fnk_pos_data_v1';

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or defaults
  const loadInitialData = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  };

  const savedData = loadInitialData();

  const [branch] = useState<Branch>(savedData?.branch || initialBranch);
  const [employees, setEmployees] = useState<Employee[]>(savedData?.employees || initialEmployees);
  const [currentEmployee, setCurrentEmployee] = useState<Employee>(
    savedData?.currentEmployee || initialEmployees.find(e => e.role === 'cashier') || initialEmployees[1]
  );
  const [riders, setRiders] = useState<DeliveryRider[]>(savedData?.riders || initialRiders);
  const [tables, setTables] = useState<RestaurantTable[]>(savedData?.tables || initialTables);
  const [categories, setCategories] = useState<MenuCategory[]>(savedData?.categories || initialCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(savedData?.menuItems || initialMenuItems);
  const [customers, setCustomers] = useState<Customer[]>(savedData?.customers || initialCustomers);
  const [orders, setOrders] = useState<Order[]>(savedData?.orders || initialOrders);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>(savedData?.kitchenTickets || initialKitchenTickets);
  const [inventory, setInventory] = useState<InventoryItem[]>(savedData?.inventory || initialInventory);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(savedData?.stockTransactions || []);
  const [suppliers] = useState<Supplier[]>(savedData?.suppliers || initialSuppliers);
  const [expenses, setExpenses] = useState<RestaurantExpense[]>(savedData?.expenses || initialExpenses);
  const [currentShift, setCurrentShift] = useState<Shift | null>(savedData?.currentShift || initialCurrentShift);
  const [shiftHistory, setShiftHistory] = useState<Shift[]>(savedData?.shiftHistory || []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(savedData?.auditLogs || initialAuditLogs);
  const [notifications, setNotifications] = useState<AppNotification[]>(savedData?.notifications || initialNotifications);

  // UI state
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [printModalData, setPrintModalData] = useState<POSContextType['printModalData']>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      const dataToSave = {
        branch,
        employees,
        currentEmployee,
        riders,
        tables,
        categories,
        menuItems,
        customers,
        orders,
        kitchenTickets,
        inventory,
        stockTransactions,
        suppliers,
        expenses,
        currentShift,
        shiftHistory,
        auditLogs,
        notifications,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // storage full or disabled
    }
  }, [
    branch,
    employees,
    currentEmployee,
    riders,
    tables,
    categories,
    menuItems,
    customers,
    orders,
    kitchenTickets,
    inventory,
    stockTransactions,
    suppliers,
    expenses,
    currentShift,
    shiftHistory,
    auditLogs,
    notifications,
  ]);

  // Notifications helper
  const addNotification = (
    title: string,
    message: string,
    type: AppNotification['type'],
    severity: AppNotification['severity'],
    linkTab?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      severity,
      timestamp: new Date().toISOString(),
      read: false,
      linkTab,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Audit Log Helper
  const logAudit = (
    action: string,
    recordType: AuditLog['recordType'],
    recordId: string,
    details: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      employeeId: currentEmployee.employeeId,
      employeeName: currentEmployee.name,
      action,
      recordType,
      recordId,
      details,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      branch: branch.name,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Manager PIN Verification
  const verifyManagerPin = (pin: string): boolean => {
    // Look for managers or super admins with this PIN
    const manager = employees.find(
      e => (e.role === 'branch_manager' || e.role === 'super_admin' || e.role === 'owner') && e.pin === pin
    );
    return !!manager;
  };

  // Switch Employee for testing roles
  const switchEmployee = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setCurrentEmployee(emp);
      logAudit('Switch User Session', 'shift', emp.id, `User switched to ${emp.name} (${emp.role})`);
    }
  };

  // Deduct Inventory based on recipe
  const deductRecipeIngredients = (items: OrderItem[], orderRef: string) => {
    setInventory(prevInv => {
      const updatedInv = [...prevInv];
      items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (menuItem?.recipe) {
          menuItem.recipe.forEach(recipeIng => {
            const ingIdx = updatedInv.findIndex(inv => inv.id === recipeIng.ingredientId);
            if (ingIdx !== -1) {
              const consumed = recipeIng.quantity * item.quantity;
              const newStock = Math.max(0, Number((updatedInv[ingIdx].currentStock - consumed).toFixed(2)));
              const ingredient = updatedInv[ingIdx];
              updatedInv[ingIdx] = {
                ...ingredient,
                currentStock: newStock,
                lastUpdated: new Date().toISOString().split('T')[0],
              };

              const transaction: StockTransaction = {
                id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                type: 'order_consumption',
                quantity: consumed,
                unit: ingredient.unit,
                reason: `Recipe consumption for order #${orderRef} (${item.name} x${item.quantity})`,
                referenceId: orderRef,
                employeeName: currentEmployee.name,
                timestamp: new Date().toISOString(),
              };
              setStockTransactions(prev => [transaction, ...prev]);

              // Check for low stock warning
              if (newStock <= updatedInv[ingIdx].minStock) {
                addNotification(
                  `Low Stock Alert: ${updatedInv[ingIdx].name}`,
                  `${updatedInv[ingIdx].name} is now at ${newStock} ${updatedInv[ingIdx].unit} (Minimum threshold: ${updatedInv[ingIdx].minStock} ${updatedInv[ingIdx].unit}).`,
                  'inventory',
                  'warning',
                  'inventory'
                );
              }
            }
          });
        }
      });
      return updatedInv;
    });
  };

  // Create Order
  const createOrder = (orderData: Partial<Order>): Order => {
    const now = new Date();
    const timestamp = now.toISOString();
    const orderNumSuffix = Math.floor(100000 + Math.random() * 900000);
    const invoiceNumSuffix = Math.floor(200000 + Math.random() * 80000);
    const tokenNum = String(orders.length + 1).padStart(3, '0');

    // Calculate subtotal
    const items = orderData.items || [];
    const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
    
    // Calculate discounts
    let discountAmount = orderData.discountAmount || 0;
    if (orderData.discountType === 'percentage' && orderData.discountValue) {
      discountAmount = Math.round((subtotal * orderData.discountValue) / 100);
    }
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    
    const taxRate = orderData.taxRate ?? branch.taxRate;
    const taxAmount = Math.round((taxableSubtotal * taxRate) / 100);
    const serviceCharge = orderData.orderType === 'dine_in' ? Math.round((taxableSubtotal * branch.serviceChargeRate) / 100) : 0;
    const deliveryCharge = orderData.orderType === 'delivery' ? (orderData.deliveryCharge ?? branch.defaultDeliveryCharge) : 0;
    const grandTotal = taxableSubtotal + taxAmount + serviceCharge + deliveryCharge;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: `FNK-${orderNumSuffix}`,
      invoiceNumber: `${invoiceNumSuffix}`,
      tokenNumber: tokenNum,
      branchId: branch.id,
      orderType: orderData.orderType || 'dine_in',
      status: 'sent_to_kitchen',
      paymentStatus: 'unpaid',
      items: items.map(it => ({ ...it, isSentToKitchen: true })),
      subtotal,
      discountType: orderData.discountType,
      discountValue: orderData.discountValue,
      discountAmount,
      discountReason: orderData.discountReason,
      discountAuthorizedBy: orderData.discountAuthorizedBy,
      taxRate,
      taxAmount,
      deliveryCharge,
      serviceCharge,
      grandTotal,
      payments: [],
      refunds: [],
      cashierId: currentEmployee.employeeId,
      cashierName: currentEmployee.name,
      notes: orderData.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
      reprintCount: 0,
      kotReprintCount: 0,
      statusHistory: [
        {
          status: 'new',
          timestamp,
          employeeId: currentEmployee.employeeId,
          employeeName: currentEmployee.name,
          notes: `Order created (${orderData.orderType})`,
        },
        {
          status: 'sent_to_kitchen',
          timestamp,
          employeeId: currentEmployee.employeeId,
          employeeName: currentEmployee.name,
          notes: 'Auto generated KOT',
        },
      ],
      // Dine-in fields
      tableId: orderData.tableId,
      tableName: orderData.tableName,
      areaName: orderData.areaName,
      covers: orderData.covers,
      waiterId: orderData.waiterId,
      waiterName: orderData.waiterName,
      // Customer fields
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAlternatePhone: orderData.customerAlternatePhone,
      deliveryAddress: orderData.deliveryAddress,
      deliveryArea: orderData.deliveryArea,
      deliveryLandmark: orderData.deliveryLandmark,
      deliveryNotes: orderData.deliveryNotes,
      // Delivery
      deliveryRiderId: orderData.deliveryRiderId,
      deliveryRiderName: orderData.deliveryRiderName,
      deliveryRiderPhone: orderData.deliveryRiderPhone,
      // Third Party
      thirdPartyPlatform: orderData.thirdPartyPlatform,
      externalOrderId: orderData.externalOrderId,
      // Car Service
      carRegistration: orderData.carRegistration,
      carMakeModel: orderData.carMakeModel,
      carColor: orderData.carColor,
      parkingBay: orderData.parkingBay,
    };

    // Update table status if Dine-In
    if (newOrder.orderType === 'dine_in' && newOrder.tableId) {
      setTables(prev =>
        prev.map(t =>
          t.id === newOrder.tableId
            ? {
                ...t,
                status: 'occupied',
                currentOrderId: newOrder.id,
                currentWaiterName: newOrder.waiterName,
                currentCovers: newOrder.covers,
                runningAmount: newOrder.grandTotal,
                occupiedSince: timestamp,
              }
            : t
        )
      );
    }

    // Generate KOT
    const kotItems = items.map(it => ({
      id: `kot_it_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: it.name,
      size: it.size,
      quantity: it.quantity,
      modifiers: it.selectedModifiers.map(m => (m.type === 'add' ? `+ ${m.name}` : `- ${m.name}`)),
      specialInstructions: it.specialInstructions,
      station: it.station,
    }));

    const kotNumber = `KOT-${kitchenTickets.length + 101}`;
    const newKot: KitchenTicket = {
      id: `kot_${Date.now()}`,
      kotNumber,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      tokenNumber: newOrder.tokenNumber,
      orderType: newOrder.orderType,
      tableNumber: newOrder.tableName,
      waiterName: newOrder.waiterName,
      createdAt: timestamp,
      items: kotItems,
      isAdditional: false,
      station: 'all',
      status: 'new',
    };

    // Deduct inventory
    deductRecipeIngredients(items, newOrder.orderNumber);

    // Update customer stats if applicable
    if (newOrder.customerId) {
      setCustomers(prev =>
        prev.map(c =>
          c.id === newOrder.customerId
            ? {
                ...c,
                totalOrders: c.totalOrders + 1,
                totalSpent: c.totalSpent + newOrder.grandTotal,
                lastOrderDate: timestamp.split('T')[0],
              }
            : c
        )
      );
    }

    setOrders(prev => [newOrder, ...prev]);
    setKitchenTickets(prev => [newKot, ...prev]);

    logAudit('Order Created', 'order', newOrder.id, `Created ${newOrder.orderType} order #${newOrder.orderNumber} for ${newOrder.grandTotal} ${branch.currency}`);

    addNotification(
      `New ${newOrder.orderType.replace('_', ' ').toUpperCase()} Order`,
      `Order #${newOrder.orderNumber} (Token ${newOrder.tokenNumber}) placed for ${newOrder.grandTotal} ${branch.currency}.`,
      'order',
      'info',
      'running_orders'
    );

    return newOrder;
  };

  // Add more items to an existing order (generates additional KOT with only new items)
  const addItemsToOrder = (orderId: string, newItems: OrderItem[]) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const timestamp = new Date().toISOString();
    const updatedItems = [...order.items, ...newItems.map(it => ({ ...it, isSentToKitchen: true }))];
    const subtotal = updatedItems.reduce((sum, it) => sum + (it.voided ? 0 : it.totalPrice), 0);
    
    let discountAmount = order.discountAmount;
    if (order.discountType === 'percentage' && order.discountValue) {
      discountAmount = Math.round((subtotal * order.discountValue) / 100);
    }
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxableSubtotal * order.taxRate) / 100);
    const serviceCharge = order.orderType === 'dine_in' ? Math.round((taxableSubtotal * branch.serviceChargeRate) / 100) : 0;
    const grandTotal = taxableSubtotal + taxAmount + serviceCharge + order.deliveryCharge;

    // Additional KOT with ONLY newly added items
    const kotItems = newItems.map(it => ({
      id: `kot_it_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: it.name,
      size: it.size,
      quantity: it.quantity,
      modifiers: it.selectedModifiers.map(m => (m.type === 'add' ? `+ ${m.name}` : `- ${m.name}`)),
      specialInstructions: it.specialInstructions,
      station: it.station,
    }));

    const kotNumber = `KOT-${kitchenTickets.length + 101}`;
    const additionalKot: KitchenTicket = {
      id: `kot_${Date.now()}`,
      kotNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tokenNumber: order.tokenNumber,
      orderType: order.orderType,
      tableNumber: order.tableName,
      waiterName: order.waiterName,
      createdAt: timestamp,
      items: kotItems,
      isAdditional: true,
      station: 'all',
      status: 'new',
    };

    // Deduct inventory for new items
    deductRecipeIngredients(newItems, order.orderNumber);

    // Update table running amount if dine-in
    if (order.tableId) {
      setTables(prev =>
        prev.map(t => (t.id === order.tableId ? { ...t, runningAmount: grandTotal } : t))
      );
    }

    setKitchenTickets(prev => [additionalKot, ...prev]);

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              items: updatedItems,
              subtotal,
              discountAmount,
              taxAmount,
              serviceCharge,
              grandTotal,
              updatedAt: timestamp,
              statusHistory: [
                ...o.statusHistory,
                {
                  status: o.status,
                  timestamp,
                  employeeId: currentEmployee.employeeId,
                  employeeName: currentEmployee.name,
                  notes: `Added ${newItems.length} new items. Generated additional ${kotNumber}`,
                },
              ],
            }
          : o
      )
    );

    logAudit('Add Items To Order', 'order', order.id, `Added ${newItems.length} items to order #${order.orderNumber}. Generated ${kotNumber}`);
    
    addNotification(
      `Items Added to Order #${order.orderNumber}`,
      `New KOT ${kotNumber} generated for ${order.tableName || order.tokenNumber}.`,
      'kitchen',
      'info',
      'kitchen'
    );
  };

  // Update order status
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, notes?: string) => {
    const timestamp = new Date().toISOString();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.status;
    let completedAt = order.completedAt;

    if (newStatus === 'completed' || newStatus === 'delivered') {
      completedAt = timestamp;
      // If dine-in, free table only if completed
      if (order.tableId) {
        setTables(prev =>
          prev.map(t =>
            t.id === order.tableId
              ? {
                  ...t,
                  status: 'cleaning', // set to cleaning after guest leaves
                  currentOrderId: undefined,
                  currentWaiterName: undefined,
                  currentCovers: undefined,
                  runningAmount: undefined,
                  occupiedSince: undefined,
                }
              : t
          )
        );
      }
    }

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              updatedAt: timestamp,
              completedAt,
              statusHistory: [
                ...o.statusHistory,
                {
                  status: newStatus,
                  timestamp,
                  employeeId: currentEmployee.employeeId,
                  employeeName: currentEmployee.name,
                  notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
                },
              ],
            }
          : o
      )
    );

    logAudit('Order Status Changed', 'order', orderId, `Order #${order.orderNumber} status changed to ${newStatus}`, oldStatus, newStatus);
  };

  // Process payment
  const processPayment = (
    orderId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    tendered?: number,
    change?: number
  ): boolean => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    const timestamp = new Date().toISOString();
    const newPayment = {
      id: `pay_${Date.now()}`,
      orderId,
      amount,
      method,
      reference,
      timestamp,
      cashierId: currentEmployee.employeeId,
      cashierName: currentEmployee.name,
      tendered,
      change,
    };

    const totalPaidSoFar = order.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
    const isFullyPaid = totalPaidSoFar >= order.grandTotal;
    const newPaymentStatus = isFullyPaid ? 'paid' : 'partially_paid';

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: newPaymentStatus,
              payments: [...o.payments, newPayment],
              updatedAt: timestamp,
            }
          : o
      )
    );

    // Update active shift financial tallies
    if (currentShift) {
      setCurrentShift(prev => {
        if (!prev) return null;
        const isCash = method === 'cash';
        const isCard = method === 'card';
        const isOnline = method === 'online' || method === 'bank_transfer' || method === 'wallet';
        
        const newCashSales = prev.cashSales + (isCash ? amount : 0);
        const newCardSales = prev.cardSales + (isCard ? amount : 0);
        const newOnlineSales = prev.onlineSales + (isOnline ? amount : 0);
        const newExpectedCash = prev.openingCash + newCashSales - prev.expenses - prev.refunds;

        return {
          ...prev,
          cashSales: newCashSales,
          cardSales: newCardSales,
          onlineSales: newOnlineSales,
          expectedCash: newExpectedCash,
        };
      });
    }

    logAudit('Payment Received', 'payment', orderId, `Received ${amount} ${branch.currency} via ${method} for Order #${order.orderNumber}. Status: ${newPaymentStatus}`);

    addNotification(
      `Payment Received: ${order.orderNumber}`,
      `Received ${amount} ${branch.currency} via ${method}. Payment status: ${newPaymentStatus.toUpperCase()}.`,
      'order',
      'success',
      'running_orders'
    );

    return true;
  };

  // Apply discount to order
  const applyDiscount = (
    orderId: string,
    type: 'percentage' | 'fixed',
    value: number,
    reason: string,
    authorizedByManager?: string
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let discountAmount = 0;
    if (type === 'percentage') {
      discountAmount = Math.round((order.subtotal * value) / 100);
    } else {
      discountAmount = Math.min(order.subtotal, value);
    }

    const taxableSubtotal = Math.max(0, order.subtotal - discountAmount);
    const taxAmount = Math.round((taxableSubtotal * order.taxRate) / 100);
    const serviceCharge = order.orderType === 'dine_in' ? Math.round((taxableSubtotal * branch.serviceChargeRate) / 100) : 0;
    const grandTotal = taxableSubtotal + taxAmount + serviceCharge + order.deliveryCharge;

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              discountType: type,
              discountValue: value,
              discountAmount,
              discountReason: reason,
              discountAuthorizedBy: authorizedByManager || currentEmployee.name,
              taxAmount,
              serviceCharge,
              grandTotal,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    logAudit('Discount Applied', 'discount', orderId, `Applied ${type === 'percentage' ? `${value}%` : `${value} ${branch.currency}`} discount (${discountAmount} ${branch.currency}). Reason: ${reason}. Authorized by: ${authorizedByManager || currentEmployee.name}`);
  };

  // Refund Order or Item
  const refundOrder = (
    orderId: string,
    amount: number,
    reason: string,
    managerPin: string,
    refundedItemId?: string
  ) => {
    if (!verifyManagerPin(managerPin)) {
      return { success: false, error: 'Invalid Manager PIN. Manager authorization required for refunds.' };
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const timestamp = new Date().toISOString();
    const manager = employees.find(e => e.pin === managerPin);
    const authorizedBy = manager ? manager.name : 'Authorized Manager';

    const newRefund = {
      id: `ref_${Date.now()}`,
      orderId,
      amount,
      reason,
      timestamp,
      authorizedBy,
      refundedItemId,
    };

    const totalRefunded = order.refunds.reduce((sum, r) => sum + r.amount, 0) + amount;
    const isFullyRefunded = totalRefunded >= order.grandTotal;
    const newPaymentStatus = isFullyRefunded ? 'refunded' : 'partially_refunded';

    const updatedItems = refundedItemId
      ? order.items.map(it => (it.id === refundedItemId ? { ...it, voided: true, voidReason: reason } : it))
      : order.items;

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: newPaymentStatus,
              refunds: [...o.refunds, newRefund],
              items: updatedItems,
              updatedAt: timestamp,
            }
          : o
      )
    );

    // Update shift refunds
    if (currentShift) {
      setCurrentShift(prev => {
        if (!prev) return null;
        const newRefunds = prev.refunds + amount;
        return {
          ...prev,
          refunds: newRefunds,
          expectedCash: prev.openingCash + prev.cashSales - prev.expenses - newRefunds,
        };
      });
    }

    logAudit('Refund Issued', 'refund', orderId, `Issued ${amount} ${branch.currency} refund for Order #${order.orderNumber}. Reason: ${reason}. Authorized by ${authorizedBy}`);

    addNotification(
      `Refund Issued: ${order.orderNumber}`,
      `Refund of ${amount} ${branch.currency} processed. Authorized by ${authorizedBy}.`,
      'order',
      'warning',
      'running_orders'
    );

    return { success: true };
  };

  // Cancel Order
  const cancelOrder = (orderId: string, reason: string, managerPin?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    // If order is paid, require manager PIN
    if (order.paymentStatus === 'paid' && managerPin) {
      if (!verifyManagerPin(managerPin)) {
        return { success: false, error: 'Invalid Manager PIN. Paid orders require manager authorization to cancel.' };
      }
    }

    const timestamp = new Date().toISOString();
    updateOrderStatus(orderId, 'cancelled', `Cancelled by ${currentEmployee.name}. Reason: ${reason}`);

    // Free table if dine-in
    if (order.tableId) {
      setTables(prev =>
        prev.map(t =>
          t.id === order.tableId
            ? {
                ...t,
                status: 'available',
                currentOrderId: undefined,
                currentWaiterName: undefined,
                currentCovers: undefined,
                runningAmount: undefined,
                occupiedSince: undefined,
              }
            : t
        )
      );
    }

    logAudit('Order Cancelled', 'order', orderId, `Order #${order.orderNumber} cancelled. Reason: ${reason}`);

    return { success: true };
  };

  // Assign Rider
  const assignRider = (orderId: string, riderId: string) => {
    const rider = riders.find(r => r.id === riderId);
    const order = orders.find(o => o.id === orderId);
    if (!rider || !order) return;

    const timestamp = new Date().toISOString();

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              deliveryRiderId: rider.id,
              deliveryRiderName: rider.name,
              deliveryRiderPhone: rider.phone,
              status: 'assigned_to_rider',
              updatedAt: timestamp,
              statusHistory: [
                ...o.statusHistory,
                {
                  status: 'assigned_to_rider',
                  timestamp,
                  employeeId: currentEmployee.employeeId,
                  employeeName: currentEmployee.name,
                  notes: `Assigned to Rider ${rider.name} (${rider.phone})`,
                },
              ],
            }
          : o
      )
    );

    setRiders(prev =>
      prev.map(r => (r.id === riderId ? { ...r, status: 'busy' } : r))
    );

    logAudit('Assign Rider', 'order', orderId, `Assigned rider ${rider.name} to delivery order #${order.orderNumber}`);

    addNotification(
      `Rider Assigned`,
      `Order #${order.orderNumber} assigned to ${rider.name} (${rider.phone}).`,
      'delivery',
      'info',
      'delivery'
    );
  };

  // Dispatch Delivery
  const dispatchDelivery = (orderId: string) => {
    const timestamp = new Date().toISOString();
    const estDeliveryTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'out_for_delivery',
              dispatchTime: timestamp,
              estimatedDeliveryTime: estDeliveryTime,
              updatedAt: timestamp,
              statusHistory: [
                ...o.statusHistory,
                {
                  status: 'out_for_delivery',
                  timestamp,
                  employeeId: currentEmployee.employeeId,
                  employeeName: currentEmployee.name,
                  notes: `Dispatched out for delivery with ${o.deliveryRiderName || 'rider'}`,
                },
              ],
            }
          : o
      )
    );

    logAudit('Delivery Dispatched', 'order', orderId, `Order dispatched out for delivery`);
  };

  // Complete Delivery
  const completeDelivery = (orderId: string, paymentMethod?: PaymentMethod) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const timestamp = new Date().toISOString();

    // If COD payment collected
    if (paymentMethod && order.paymentStatus === 'unpaid') {
      processPayment(orderId, order.grandTotal, paymentMethod, 'COD Delivery Collection');
    }

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'delivered',
              deliveredTime: timestamp,
              completedAt: timestamp,
              updatedAt: timestamp,
              statusHistory: [
                ...o.statusHistory,
                {
                  status: 'delivered',
                  timestamp,
                  employeeId: currentEmployee.employeeId,
                  employeeName: currentEmployee.name,
                  notes: `Delivered by ${o.deliveryRiderName}`,
                },
              ],
            }
          : o
      )
    );

    // Update rider performance
    if (order.deliveryRiderId) {
      setRiders(prev =>
        prev.map(r =>
          r.id === order.deliveryRiderId
            ? {
                ...r,
                status: 'available',
                deliveriesToday: r.deliveriesToday + 1,
                completedDeliveries: r.completedDeliveries + 1,
                cashCollected: r.cashCollected + (order.paymentStatus === 'paid' ? 0 : order.grandTotal),
              }
            : r
        )
      );
    }

    logAudit('Delivery Completed', 'order', orderId, `Order #${order.orderNumber} successfully delivered.`);

    addNotification(
      `Delivery Completed`,
      `Order #${order.orderNumber} delivered to ${order.customerName}.`,
      'delivery',
      'success',
      'delivery'
    );
  };

  // Table transfer
  const transferTable = (fromTableId: string, toTableId: string) => {
    const fromTable = tables.find(t => t.id === fromTableId);
    const toTable = tables.find(t => t.id === toTableId);

    if (!fromTable || !toTable) return { success: false, message: 'Table not found' };
    if (!fromTable.currentOrderId) return { success: false, message: 'Source table has no active order' };
    if (toTable.status === 'occupied') return { success: false, message: 'Target table is currently occupied' };

    const orderId = fromTable.currentOrderId;
    const timestamp = new Date().toISOString();

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              tableId: toTable.id,
              tableName: toTable.number,
              areaName: toTable.area,
              updatedAt: timestamp,
              statusHistory: [
                ...o.statusHistory,
                {
                  status: o.status,
                  timestamp,
                  employeeId: currentEmployee.employeeId,
                  employeeName: currentEmployee.name,
                  notes: `Transferred from table ${fromTable.number} to ${toTable.number}`,
                },
              ],
            }
          : o
      )
    );

    setTables(prev =>
      prev.map(t => {
        if (t.id === fromTableId) {
          return {
            ...t,
            status: 'cleaning',
            currentOrderId: undefined,
            currentWaiterName: undefined,
            currentCovers: undefined,
            runningAmount: undefined,
            occupiedSince: undefined,
          };
        }
        if (t.id === toTableId) {
          return {
            ...t,
            status: 'occupied',
            currentOrderId: orderId,
            currentWaiterName: fromTable.currentWaiterName,
            currentCovers: fromTable.currentCovers,
            runningAmount: fromTable.runningAmount,
            occupiedSince: fromTable.occupiedSince,
          };
        }
        return t;
      })
    );

    logAudit('Table Transferred', 'table', orderId, `Order transferred from ${fromTable.number} to ${toTable.number}`);

    return { success: true, message: `Order transferred to Table ${toTable.number}` };
  };

  const updateTableStatus = (tableId: string, status: TableStatus) => {
    setTables(prev => prev.map(t => (t.id === tableId ? { ...t, status } : t)));
    logAudit('Table Status Updated', 'table', tableId, `Status updated to ${status}`);
  };

  // Reprint Receipt & KOT with logging
  const reprintReceipt = (orderId: string, reason?: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              reprintCount: o.reprintCount + 1,
            }
          : o
      )
    );
    const order = orders.find(o => o.id === orderId);
    logAudit(
      'Receipt Reprinted',
      'order',
      orderId,
      `Reprinted customer receipt for order #${order?.orderNumber} (Reprint count: ${(order?.reprintCount || 0) + 1}). Reason: ${reason || 'Customer request'}`
    );
  };

  const reprintKOT = (kotId: string, reason?: string) => {
    const kot = kitchenTickets.find(k => k.id === kotId);
    if (kot) {
      setOrders(prev =>
        prev.map(o =>
          o.id === kot.orderId ? { ...o, kotReprintCount: o.kotReprintCount + 1 } : o
        )
      );
      logAudit(
        'KOT Reprinted',
        'order',
        kot.orderId,
        `Reprinted ${kot.kotNumber} for order #${kot.orderNumber}. Reason: ${reason || 'Kitchen request'}`
      );
    }
  };

  // KOT Status
  const updateKOTStatus = (kotId: string, status: 'new' | 'accepted' | 'preparing' | 'ready') => {
    const timestamp = new Date().toISOString();
    setKitchenTickets(prev =>
      prev.map(k =>
        k.id === kotId
          ? {
              ...k,
              status,
              completedAt: status === 'ready' ? timestamp : k.completedAt,
            }
          : k
      )
    );
  };

  // Settle Rider
  const settleRider = (riderId: string, expensesDeducted: number, notes?: string) => {
    const rider = riders.find(r => r.id === riderId);
    if (!rider) return { dueAmount: 0 };

    const netDue = Math.max(0, rider.cashCollected - expensesDeducted);

    setRiders(prev =>
      prev.map(r =>
        r.id === riderId
          ? {
              ...r,
              cashCollected: 0, // settled for the day
              status: 'available',
            }
          : r
      )
    );

    logAudit(
      'Rider Settlement',
      'payment',
      riderId,
      `Settled rider ${rider.name}. Cash collected: ${rider.cashCollected}, Expenses: ${expensesDeducted}, Net paid to restaurant: ${netDue}. Notes: ${notes || 'Shift end settlement'}`
    );

    addNotification(
      `Rider Settled: ${rider.name}`,
      `Rider settlement complete. Net amount of ${netDue} ${branch.currency} deposited.`,
      'delivery',
      'success',
      'delivery_riders'
    );

    return { dueAmount: netDue };
  };

  const addRider = (riderData: Omit<DeliveryRider, 'id' | 'deliveriesToday' | 'completedDeliveries' | 'failedDeliveries' | 'cashCollected' | 'averageDeliveryTimeMinutes'>) => {
    const newRider: DeliveryRider = {
      ...riderData,
      id: `rdr_${Date.now()}`,
      deliveriesToday: 0,
      completedDeliveries: 0,
      failedDeliveries: 0,
      cashCollected: 0,
      averageDeliveryTimeMinutes: 25,
    };
    setRiders(prev => [...prev, newRider]);
    logAudit('Rider Added', 'order', newRider.id, `Added delivery rider ${newRider.name}`);
  };

  const updateRider = (rider: DeliveryRider) => {
    setRiders(prev => prev.map(r => (r.id === rider.id ? rider : r)));
    logAudit('Rider Updated', 'order', rider.id, `Updated rider ${rider.name}`);
  };

  // Shift & Cash Drawer
  const openShift = (openingCash: number, terminal: string = 'POS-Terminal 01') => {
    const timestamp = new Date().toISOString();
    const shiftNumber = `SH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${shiftHistory.length + 1}`;
    const newShift: Shift = {
      id: `shf_${Date.now()}`,
      shiftNumber,
      employeeId: currentEmployee.employeeId,
      employeeName: currentEmployee.name,
      terminal,
      branchId: branch.id,
      startTime: timestamp,
      status: 'open',
      openingCash,
      cashSales: 0,
      cardSales: 0,
      onlineSales: 0,
      refunds: 0,
      expenses: 0,
      expectedCash: openingCash,
    };
    setCurrentShift(newShift);
    logAudit('Open Shift', 'shift', newShift.id, `Opened shift ${shiftNumber} with ${openingCash} ${branch.currency} opening cash.`);
    addNotification('Shift Opened', `Shift ${shiftNumber} opened successfully.`, 'shift', 'info', 'shifts');
  };

  const closeShift = (actualCash: number, closingNotes?: string): Shift => {
    if (!currentShift) throw new Error('No active shift to close');
    const timestamp = new Date().toISOString();
    const difference = actualCash - currentShift.expectedCash;

    const closedShift: Shift = {
      ...currentShift,
      endTime: timestamp,
      status: 'closed',
      actualCash,
      difference,
      closingNotes,
    };

    setShiftHistory(prev => [closedShift, ...prev]);
    setCurrentShift(null);

    logAudit(
      'Close Shift',
      'shift',
      closedShift.id,
      `Closed shift ${closedShift.shiftNumber}. Expected: ${closedShift.expectedCash}, Actual: ${actualCash}, Difference: ${difference}. Notes: ${closingNotes || 'None'}`
    );

    addNotification(
      `Shift Closed (${closedShift.shiftNumber})`,
      `Shift closed. Cash difference: ${difference > 0 ? `+${difference}` : difference} ${branch.currency}.`,
      'shift',
      difference === 0 ? 'success' : 'warning',
      'shifts'
    );

    return closedShift;
  };

  const addExpense = (expenseData: Omit<RestaurantExpense, 'id'>) => {
    const newExpense: RestaurantExpense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
    };
    setExpenses(prev => [newExpense, ...prev]);

    // Update active shift expenses
    if (currentShift) {
      setCurrentShift(prev => {
        if (!prev) return null;
        const newExp = prev.expenses + (expenseData.paymentMethod === 'cash' ? expenseData.amount : 0);
        return {
          ...prev,
          expenses: newExp,
          expectedCash: prev.openingCash + prev.cashSales - newExp - prev.refunds,
        };
      });
    }

    logAudit('Expense Recorded', 'payment', newExpense.id, `Recorded expense of ${expenseData.amount} ${branch.currency} for ${expenseData.description} (${expenseData.category})`);
  };

  // Inventory
  const adjustStock = (ingredientId: string, quantity: number, type: StockTransaction['type'], reason: string) => {
    const item = inventory.find(i => i.id === ingredientId);
    if (!item || quantity <= 0) return;

    const normalizedQuantity = Number(quantity.toFixed(2));
    const isIncoming = type === 'stock_in';
    const isAbsoluteAdjustment = type === 'adjustment';

    let newStock = item.currentStock;
    if (isAbsoluteAdjustment) {
      newStock = Math.max(0, normalizedQuantity);
    } else {
      const delta = isIncoming ? normalizedQuantity : -normalizedQuantity;
      newStock = Math.max(0, Number((item.currentStock + delta).toFixed(2)));
    }

    setInventory(prev =>
      prev.map(invItem =>
        invItem.id === ingredientId
          ? {
              ...invItem,
              currentStock: newStock,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : invItem
      )
    );

    const transaction: StockTransaction = {
      id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ingredientId: item.id,
      ingredientName: item.name,
      type,
      quantity: normalizedQuantity,
      unit: item.unit,
      reason,
      employeeName: currentEmployee.name,
      timestamp: new Date().toISOString(),
    };
    setStockTransactions(prev => [transaction, ...prev]);

    logAudit(
      'Inventory Stock Transaction',
      'inventory',
      ingredientId,
      `${type.toUpperCase()}: ${normalizedQuantity} ${item.unit}. Stock changed from ${item.currentStock} to ${newStock}. Reason: ${reason}`,
      String(item.currentStock),
      String(newStock)
    );

    if (newStock <= item.minStock) {
      addNotification(
        `Low Stock Alert: ${item.name}`,
        `${item.name} is now at ${newStock} ${item.unit} (Minimum threshold: ${item.minStock} ${item.unit}).`,
        'inventory',
        'warning',
        'inventory'
      );
    }
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `ing_${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setInventory(prev => [...prev, newItem]);
    logAudit('Inventory Item Added', 'inventory', newItem.id, `Added inventory item ${newItem.name}`);
  };

  const updateInventoryItem = (item: InventoryItem) => {
    const existing = inventory.find(i => i.id === item.id);
    if (!existing) return;

    const updatedItem: InventoryItem = {
      ...item,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setInventory(prev => prev.map(i => (i.id === item.id ? updatedItem : i)));
    logAudit(
      'Inventory Item Updated',
      'inventory',
      item.id,
      `Updated inventory item ${updatedItem.name}`,
      JSON.stringify(existing),
      JSON.stringify(updatedItem)
    );
  };

  const deleteInventoryItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return { success: false, error: 'Inventory item not found.' };

    const usedByMenuItems = menuItems.filter(menuItem =>
      menuItem.recipe?.some(recipeIngredient => recipeIngredient.ingredientId === itemId)
    );

    if (usedByMenuItems.length > 0) {
      return {
        success: false,
        error: `Cannot delete ${item.name}. It is used in recipe(s): ${usedByMenuItems.map(m => m.name).join(', ')}. Remove it from those recipes first.`,
      };
    }

    setInventory(prev => prev.filter(i => i.id !== itemId));
    logAudit('Inventory Item Deleted', 'inventory', itemId, `Deleted inventory item ${item.name}`);
    return { success: true };
  };

  // Menu Management
  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `item_${Date.now()}`,
    };
    setMenuItems(prev => [...prev, newItem]);
    logAudit('Menu Item Created', 'order', newItem.id, `Added ${newItem.name} to menu`);
  };

  const updateMenuItem = (item: MenuItem) => {
    setMenuItems(prev => prev.map(m => (m.id === item.id ? item : m)));
    logAudit('Menu Item Updated', 'order', item.id, `Updated menu item ${item.name}`);
  };

  const deleteMenuItem = (itemId: string) => {
    const itemToDelete = menuItems.find(item => item.id === itemId);

    if (!itemToDelete) {
      return;
    }

    setMenuItems(prev => prev.filter(item => item.id !== itemId));

    logAudit(
      'Menu Item Deleted',
      'order',
      itemId,
      `Deleted menu item ${itemToDelete.name}`
    );
  };

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems(prev =>
      prev.map(m => {
        if (m.id === itemId) {
          const nextAvailable = !m.available;
          logAudit('Menu Item Availability Changed', 'order', itemId, `Toggled ${m.name} to ${nextAvailable ? 'Available' : 'Sold Out'}`);
          return { ...m, available: nextAvailable };
        }
        return m;
      })
    );
  };

  const addCategory = (catData: Omit<MenuCategory, 'id'>) => {
    const newCat: MenuCategory = {
      ...catData,
      id: `cat_${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
  };

  // Customer CRM
  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpent: 0,
    };
    setCustomers(prev => [newCust, ...prev]);
    logAudit('Customer Created', 'order', newCust.id, `Created customer profile for ${newCust.name} (${newCust.phone})`);
    return newCust;
  };

  const updateCustomer = (customer: Customer) => {
    setCustomers(prev => prev.map(c => (c.id === customer.id ? customer : c)));
  };

  // Reset Demo Data
  const resetDemoData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setEmployees(initialEmployees);
    setCurrentEmployee(initialEmployees[1]);
    setRiders(initialRiders);
    setTables(initialTables);
    setCategories(initialCategories);
    setMenuItems(initialMenuItems);
    setCustomers(initialCustomers);
    setOrders(initialOrders);
    setKitchenTickets(initialKitchenTickets);
    setInventory(initialInventory);
    setStockTransactions([]);
    setExpenses(initialExpenses);
    setCurrentShift(initialCurrentShift);
    setShiftHistory([]);
    setAuditLogs(initialAuditLogs);
    setNotifications(initialNotifications);
    setActiveTab('pos');
    setSelectedOrderForModal(null);
    setPrintModalData(null);
  };

  // Printing modal triggers
  const openPrintModal = (config: {
    type: 'receipt' | 'kot' | 'shift_report' | 'daily_sales';
    order?: Order;
    kot?: KitchenTicket;
    shift?: Shift;
    isDuplicate?: boolean;
    format?: '80mm' | '58mm';
  }) => {
    setPrintModalData({
      isOpen: true,
      type: config.type,
      order: config.order,
      kot: config.kot,
      shift: config.shift,
      isDuplicate: config.isDuplicate ?? (config.order ? config.order.reprintCount > 0 : false),
      format: config.format || '80mm',
    });
  };

  const closePrintModal = () => {
    setPrintModalData(null);
  };

  return (
    <POSContext.Provider
      value={{
        branch,
        employees,
        currentEmployee,
        riders,
        tables,
        categories,
        menuItems,
        customers,
        orders,
        kitchenTickets,
        inventory,
        stockTransactions,
        suppliers,
        expenses,
        currentShift,
        shiftHistory,
        auditLogs,
        notifications,

        activeTab,
        setActiveTab,
        selectedOrderForModal,
        setSelectedOrderForModal,
        printModalData,
        openPrintModal,
        closePrintModal,

        markNotificationAsRead,
        clearAllNotifications,
        addNotification,

        switchEmployee,
        verifyManagerPin,
        createOrder,
        updateOrderStatus,
        addItemsToOrder,
        processPayment,
        applyDiscount,
        refundOrder,
        cancelOrder,
        assignRider,
        dispatchDelivery,
        completeDelivery,
        transferTable,
        updateTableStatus,
        reprintReceipt,
        reprintKOT,
        updateKOTStatus,
        settleRider,
        addRider,
        updateRider,
        openShift,
        closeShift,
        addExpense,
        adjustStock,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuItemAvailability,
        addCategory,
        addCustomer,
        updateCustomer,
        resetDemoData,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
