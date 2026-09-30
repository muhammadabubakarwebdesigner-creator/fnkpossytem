export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'third_party' | 'car_service';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'sent_to_kitchen'
  | 'preparing'
  | 'ready'
  | 'ready_for_pickup'
  | 'ready_for_dispatch'
  | 'assigned_to_rider'
  | 'out_for_delivery'
  | 'delivered'
  | 'taken_to_car'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'online'
  | 'bank_transfer'
  | 'wallet'
  | 'third_party_payment'
  | 'split';

export type TableStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'bill_requested'
  | 'cleaning'
  | 'disabled';

export type KitchenStation = 'pizza_kitchen' | 'grill_fryer' | 'beverage_counter' | 'dessert_station';

export type EmployeeRole =
  | 'super_admin'
  | 'owner'
  | 'branch_manager'
  | 'cashier'
  | 'waiter'
  | 'kitchen_staff'
  | 'delivery_dispatcher'
  | 'delivery_rider'
  | 'accountant';

export interface Modifier {
  id: string;
  name: string;
  price: number;
  type: 'add' | 'remove'; // e.g. + Extra Cheese, - No Olives
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: Modifier[];
}

export interface MenuItemSize {
  name: string; // e.g., Small, Medium, Large, Regular
  price: number;
  costPrice?: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number; // e.g., 0.25 (kg)
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  basePrice: number;
  sizes: MenuItemSize[];
  modifierGroups?: ModifierGroup[];
  available: boolean;
  station: KitchenStation;
  image?: string;
  recipe?: RecipeIngredient[];
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  size?: string;
  unitPrice: number;
  quantity: number;
  selectedModifiers: Modifier[];
  specialInstructions?: string;
  station: KitchenStation;
  itemDiscount?: number;
  totalPrice: number;
  isSentToKitchen?: boolean;
  kotId?: string;
  voided?: boolean;
  voidReason?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  timestamp: string;
  cashierId: string;
  cashierName: string;
  tendered?: number;
  change?: number;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  timestamp: string;
  authorizedBy: string; // Manager name
  refundedItemId?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // FNK-1397990
  invoiceNumber: string; // 226070
  tokenNumber: string; // 019
  branchId: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Specific order type metadata
  // Dine-In
  tableId?: string;
  tableName?: string;
  areaName?: string;
  covers?: number;
  waiterId?: string;
  waiterName?: string;
  
  // Takeaway & Delivery & Car
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAlternatePhone?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  deliveryLandmark?: string;
  deliveryNotes?: string;
  
  // Delivery details
  deliveryRiderId?: string;
  deliveryRiderName?: string;
  deliveryRiderPhone?: string;
  dispatchTime?: string;
  estimatedDeliveryTime?: string;
  deliveredTime?: string;
  
  // Third Party
  thirdPartyPlatform?: string;
  externalOrderId?: string;
  commissionPercentage?: number;
  
  // Car Service
  carRegistration?: string;
  carMakeModel?: string;
  carColor?: string;
  parkingBay?: string;
  
  // Financial calculations
  items: OrderItem[];
  subtotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount: number;
  discountReason?: string;
  discountAuthorizedBy?: string;
  taxRate: number; // e.g. 16%
  taxAmount: number;
  deliveryCharge: number;
  serviceCharge: number;
  grandTotal: number;
  
  // Payments
  payments: PaymentRecord[];
  refunds: RefundRecord[];
  
  // Tracking
  cashierId: string;
  cashierName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Printing & History
  statusHistory: OrderStatusHistoryItem[];
  reprintCount: number;
  kotReprintCount: number;
  isHeld?: boolean;
}

export interface KitchenTicketItem {
  id: string;
  name: string;
  size?: string;
  quantity: number;
  modifiers: string[];
  specialInstructions?: string;
  station: KitchenStation;
}

export interface KitchenTicket {
  id: string;
  kotNumber: string; // KOT-104
  orderId: string;
  orderNumber: string;
  tokenNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  waiterName?: string;
  createdAt: string;
  items: KitchenTicketItem[];
  isAdditional: boolean;
  station: KitchenStation | 'all';
  status: 'new' | 'accepted' | 'preparing' | 'ready';
  completedAt?: string;
}

export interface RestaurantTable {
  id: string;
  number: string;
  name?: string;
  area: string; // Ground Floor, First Floor, Rooftop, Terrace, Family Hall
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  currentWaiterName?: string;
  currentCovers?: number;
  occupiedSince?: string;
  runningAmount?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  area: string;
  landmark?: string;
  notes?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
}

export interface DeliveryRider {
  id: string;
  riderId: string; // e.g. RDR-01
  name: string;
  phone: string;
  cnic: string;
  emergencyPhone: string;
  branch: string;
  shift: string;
  vehicleType: 'Motorcycle' | 'Scooter' | 'Car' | 'Bicycle';
  vehicleRegistration: string;
  active: boolean;
  status: 'available' | 'busy' | 'off_duty';
  deliveriesToday: number;
  completedDeliveries: number;
  failedDeliveries: number;
  cashCollected: number;
  averageDeliveryTimeMinutes: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  branchId: string;
  status: 'active' | 'inactive';
  pin: string; // 4-digit PIN for fast terminal access
  joiningDate: string;
}

export interface Shift {
  id: string;
  shiftNumber: string;
  employeeId: string;
  employeeName: string;
  terminal: string;
  branchId: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingCash: number;
  cashSales: number;
  cardSales: number;
  onlineSales: number;
  refunds: number;
  expenses: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  closingNotes?: string;
}

export interface CashDrawerTransaction {
  id: string;
  shiftId: string;
  type: 'cash_in' | 'cash_out' | 'petty_cash' | 'refund' | 'paid_out';
  amount: number;
  reason: string;
  employeeName: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string; // KG, Litre, Pieces, Packs
  currentStock: number;
  minStock: number;
  purchaseCost: number;
  supplierId: string;
  supplierName: string;
  storeLocation: string;
  lastUpdated: string;
}

export interface StockTransaction {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: 'stock_in' | 'stock_out' | 'wastage' | 'adjustment' | 'order_consumption';
  quantity: number;
  unit: string;
  reason: string;
  referenceId?: string; // Order ID or PO ID
  employeeName: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  currentPayable: number;
}

export interface PurchaseOrderItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  createdAt: string;
  receivedAt?: string;
  notes?: string;
}

export interface RestaurantExpense {
  id: string;
  date: string;
  category: 'Utilities' | 'Maintenance' | 'Fuel' | 'Cleaning' | 'Petty Cash' | 'Staff' | 'Delivery' | 'Other';
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  employeeName: string;
  receiptReference?: string;
}

export interface AuditLog {
  id: string;
  employeeId: string;
  employeeName: string;
  action: string;
  recordType: 'order' | 'payment' | 'refund' | 'discount' | 'shift' | 'table' | 'inventory';
  recordId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  branch: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  taxRegistrationNumber: string;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
  taxRate: number; // e.g. 16%
  serviceChargeRate: number; // e.g. 5% for dine-in
  defaultDeliveryCharge: number; // e.g. 150
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'kitchen' | 'delivery' | 'inventory' | 'shift' | 'system';
  severity: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  linkTab?: string;
}
