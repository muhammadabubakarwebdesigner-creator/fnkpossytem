import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  OrderType,
  OrderItem,
  MenuItem,
  Customer,
  Order
} from '../../types';
import { ItemCustomizerModal } from '../modals/ItemCustomizerModal';
import {
  Utensils,
  PackageCheck,
  Bike,
  Globe2,
  Car,
  Search,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  Printer,
  CreditCard,
  UserPlus,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';

interface POSScreenProps {
  onOpenPayment: (order: Order) => void;
  addingToOrder?: Order | null;
  onFinishAddingItems?: () => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  onOpenPayment,
  addingToOrder,
  onFinishAddingItems,
}) => {
  const {
    branch,
    categories,
    menuItems,
    tables,
    employees,
    currentEmployee,
    riders,
    customers,
    addCustomer,
    updateCustomer,
    createOrder,
    addItemsToOrder,
    openPrintModal,
    setActiveTab,
  } = usePOS();

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected Order Type
  const [orderType, setOrderType] = useState<OrderType>(
    addingToOrder ? addingToOrder.orderType : 'dine_in'
  );

  // Dynamic Fields
  // Dine-In
  const [selectedTableId, setSelectedTableId] = useState<string>(
    addingToOrder?.tableId || ''
  );
  const [covers, setCovers] = useState<number>(addingToOrder?.covers || 2);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>(
    addingToOrder?.waiterId ||
      employees.find(e => e.role === 'waiter')?.id ||
      employees[2]?.id ||
      ''
  );

  // Customer / Delivery / Takeaway / Car
  const [customerPhone, setCustomerPhone] = useState<string>(
    addingToOrder?.customerPhone || ''
  );
  const [customerName, setCustomerName] = useState<string>(
    addingToOrder?.customerName || ''
  );
  const [customerAddress, setCustomerAddress] = useState<string>(
    addingToOrder?.deliveryAddress || ''
  );
  const [customerArea, setCustomerArea] = useState<string>(
    addingToOrder?.deliveryArea || ''
  );
  const [customerLandmark, setCustomerLandmark] = useState<string>(
    addingToOrder?.deliveryLandmark || ''
  );
  const [customerAltPhone, setCustomerAltPhone] = useState<string>(
    addingToOrder?.customerAlternatePhone || ''
  );
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [customerLookup, setCustomerLookup] = useState<string>('');
  const [showCustomerResults, setShowCustomerResults] = useState<boolean>(false);

  // Delivery
  const [selectedRiderId, setSelectedRiderId] = useState<string>(
    addingToOrder?.deliveryRiderId || ''
  );
  const [deliveryNotes, setDeliveryNotes] = useState<string>(
    addingToOrder?.deliveryNotes || ''
  );

  // Third Party
  const [thirdPartyPlatform, setThirdPartyPlatform] = useState<string>(
    addingToOrder?.thirdPartyPlatform || 'Foodpanda'
  );
  const [externalOrderId, setExternalOrderId] = useState<string>(
    addingToOrder?.externalOrderId || ''
  );

  // Car Service
  const [carRegistration, setCarRegistration] = useState<string>(
    addingToOrder?.carRegistration || ''
  );
  const [carMakeModel, setCarMakeModel] = useState<string>(
    addingToOrder?.carMakeModel || ''
  );
  const [carColor, setCarColor] = useState<string>(addingToOrder?.carColor || '');
  const [parkingBay, setParkingBay] = useState<string>(addingToOrder?.parkingBay || 'Bay 01');

  // General notes
  const [orderNotes, setOrderNotes] = useState<string>(addingToOrder?.notes || '');

  // Menu Selection & Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.id || 'cat_pizza'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [selectedItemForCustomizer, setSelectedItemForCustomizer] = useState<MenuItem | null>(null);

  // Discount
  const [orderDiscountType, setOrderDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [orderDiscountValue, setOrderDiscountValue] = useState<number>(0);
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);

  // Customer CRM helpers
  const normalizePhone = (value: string) => value.replace(/\D/g, '');

  const fillCustomerDetails = (customer: Customer) => {
    setMatchedCustomer(customer);
    setCustomerPhone(customer.phone || '');
    setCustomerName(customer.name || '');
    setCustomerAddress(customer.address || '');
    setCustomerArea(customer.area || '');
    setCustomerLandmark(customer.landmark || '');
    setCustomerAltPhone(customer.alternatePhone || '');
    setCustomerLookup('');
    setShowCustomerResults(false);
  };

  const clearMatchedCustomer = () => {
    setMatchedCustomer(null);
  };

  const customerSearchResults = (() => {
    const q = customerLookup.trim().toLowerCase();
    if (!q) return [];

    const cleanQ = normalizePhone(q);
    return customers
      .filter(customer => {
        const phoneMatch =
          cleanQ.length > 0 &&
          (normalizePhone(customer.phone).includes(cleanQ) ||
            normalizePhone(customer.alternatePhone || '').includes(cleanQ));

        return (
          phoneMatch ||
          customer.name.toLowerCase().includes(q) ||
          customer.address.toLowerCase().includes(q) ||
          customer.area.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  })();

  // Exact customer auto-link when a complete known phone number is entered.
  useEffect(() => {
    const cleanPhone = normalizePhone(customerPhone);
    if (cleanPhone.length < 7) {
      setMatchedCustomer(null);
      return;
    }

    const found = customers.find(
      customer =>
        normalizePhone(customer.phone) === cleanPhone ||
        normalizePhone(customer.alternatePhone || '') === cleanPhone
    );

    if (found) {
      setMatchedCustomer(found);
      setCustomerName(found.name || '');
      setCustomerAddress(found.address || '');
      setCustomerArea(found.area || '');
      setCustomerLandmark(found.landmark || '');
      setCustomerAltPhone(found.alternatePhone || '');
    } else {
      setMatchedCustomer(null);
    }
  }, [customerPhone, customers]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + S: Search Food
      if (e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F9: Place Order
      if (e.key === 'F9') {
        e.preventDefault();
        handlePlaceOrder(false);
      }
      // F8: Print Bill Preview
      if (e.key === 'F8') {
        e.preventDefault();
        handlePrintBillPreview();
      }
      // F10: Settle Payment
      if (e.key === 'F10') {
        e.preventDefault();
        handlePlaceOrder(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Filtered menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart Calculations
  const subtotal = cartItems.reduce((sum, it) => sum + it.totalPrice, 0);
  let discountAmount = 0;
  if (orderDiscountType === 'percentage' && orderDiscountValue > 0) {
    discountAmount = Math.round((subtotal * orderDiscountValue) / 100);
  } else if (orderDiscountType === 'fixed' && orderDiscountValue > 0) {
    discountAmount = Math.min(subtotal, orderDiscountValue);
  }
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRate = branch.taxRate;
  const taxAmount = Math.round((taxableSubtotal * taxRate) / 100);
  const serviceCharge = orderType === 'dine_in' ? Math.round((taxableSubtotal * branch.serviceChargeRate) / 100) : 0;
  const deliveryCharge = orderType === 'delivery' ? branch.defaultDeliveryCharge : 0;
  const grandTotal = taxableSubtotal + taxAmount + serviceCharge + deliveryCharge;

  // Add Item Click
  const handleItemCardClick = (item: MenuItem) => {
    if (!item.available) return;

    // If item has sizes or modifiers, open customizer modal
    if ((item.sizes && item.sizes.length > 1) || (item.modifierGroups && item.modifierGroups.length > 0)) {
      setSelectedItemForCustomizer(item);
    } else {
      // Add direct
      const defaultSize = item.sizes[0];
      const price = defaultSize ? defaultSize.price : item.basePrice;
      const orderItem: OrderItem = {
        id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        menuItemId: item.id,
        name: item.name,
        size: defaultSize ? defaultSize.name : undefined,
        unitPrice: price,
        quantity: 1,
        selectedModifiers: [],
        station: item.station,
        totalPrice: price,
        isSentToKitchen: false,
      };
      handleAddToCart(orderItem);
    }
  };

  const handleAddToCart = (orderItem: OrderItem) => {
    setCartItems(prev => {
      // Check if identical item already exists (same size, modifiers, notes)
      const existingIdx = prev.findIndex(
        it =>
          it.menuItemId === orderItem.menuItemId &&
          it.size === orderItem.size &&
          it.specialInstructions === orderItem.specialInstructions &&
          JSON.stringify(it.selectedModifiers) === JSON.stringify(orderItem.selectedModifiers)
      );

      if (existingIdx !== -1) {
        const copy = [...prev];
        const updatedQty = copy[existingIdx].quantity + orderItem.quantity;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: updatedQty,
          totalPrice: copy[existingIdx].unitPrice * updatedQty,
        };
        return copy;
      }

      return [...prev, orderItem];
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCartItems(prev => {
      const copy = [...prev];
      const newQty = copy[idx].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== idx);
      }
      copy[idx] = {
        ...copy[idx],
        quantity: newQty,
        totalPrice: copy[idx].unitPrice * newQty,
      };
      return copy;
    });
  };

  const removeCartItem = (idx: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Place Order / Submit
  const handlePlaceOrder = (proceedToPayment: boolean = false) => {
    if (cartItems.length === 0) {
      alert('Order cart is empty. Please add menu items.');
      return;
    }

    // Validation by order type
    if (orderType === 'dine_in') {
      if (!selectedTableId) {
        alert('Please select a Table for Dine-In order.');
        return;
      }
      if (!selectedWaiterId) {
        alert('Please assign a Waiter for this Dine-In order.');
        return;
      }
    }

    if (orderType === 'delivery') {
      if (!customerPhone.trim() || !customerAddress.trim()) {
        alert('Please provide customer phone number and delivery address.');
        return;
      }
    }

    if (orderType === 'takeaway') {
      if (!customerName.trim() && !customerPhone.trim()) {
        alert('Please enter a customer name or mobile number for takeaway pickup.');
        return;
      }
    }

    // If adding to existing order
    if (addingToOrder) {
      addItemsToOrder(addingToOrder.id, cartItems);
      setCartItems([]);
      if (onFinishAddingItems) onFinishAddingItems();
      setActiveTab('running_orders');
      return;
    }

    // Customer CRM link/create/update
    let finalCustomerId = matchedCustomer?.id;

    if (matchedCustomer) {
      const customerChanged =
        matchedCustomer.name !== (customerName.trim() || matchedCustomer.name) ||
        matchedCustomer.phone !== (customerPhone.trim() || matchedCustomer.phone) ||
        (matchedCustomer.alternatePhone || '') !== customerAltPhone.trim() ||
        (matchedCustomer.address || '') !== customerAddress.trim() ||
        (matchedCustomer.area || '') !== customerArea.trim() ||
        (matchedCustomer.landmark || '') !== customerLandmark.trim();

      if (customerChanged) {
        updateCustomer({
          ...matchedCustomer,
          name: customerName.trim() || matchedCustomer.name,
          phone: customerPhone.trim() || matchedCustomer.phone,
          alternatePhone: customerAltPhone.trim() || undefined,
          address: customerAddress.trim() || matchedCustomer.address,
          area: customerArea.trim() || matchedCustomer.area,
          landmark: customerLandmark.trim() || undefined,
        });
      }
    } else if (customerPhone.trim() || customerName.trim()) {
      const cleanPhone = normalizePhone(customerPhone);
      const existingByPhone =
        cleanPhone.length > 0
          ? customers.find(
              customer =>
                normalizePhone(customer.phone) === cleanPhone ||
                normalizePhone(customer.alternatePhone || '') === cleanPhone
            )
          : undefined;

      if (existingByPhone) {
        finalCustomerId = existingByPhone.id;
      } else {
        const created = addCustomer({
          name: customerName.trim() || 'Guest Customer',
          phone: customerPhone.trim() || 'N/A',
          address: customerAddress.trim() || 'Store Pickup',
          area: customerArea.trim() || 'Gulberg',
          landmark: customerLandmark.trim() || undefined,
          alternatePhone: customerAltPhone.trim() || undefined,
        });
        finalCustomerId = created.id;
      }
    }

    // Get selected Table and Waiter metadata
    const selectedTable = tables.find(t => t.id === selectedTableId);
    const selectedWaiter = employees.find(e => e.id === selectedWaiterId);
    const selectedRider = riders.find(r => r.id === selectedRiderId);

    const newOrder = createOrder({
      orderType,
      tableId: selectedTable?.id,
      tableName: selectedTable?.number,
      areaName: selectedTable?.area,
      covers,
      waiterId: selectedWaiter?.id,
      waiterName: selectedWaiter?.name,
      // Customer
      customerId: finalCustomerId,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerAlternatePhone: customerAltPhone.trim() || undefined,
      deliveryAddress: customerAddress.trim() || undefined,
      deliveryArea: customerArea.trim() || undefined,
      deliveryLandmark: customerLandmark.trim() || undefined,
      deliveryNotes: deliveryNotes.trim() || undefined,
      // Rider
      deliveryRiderId: selectedRider?.id,
      deliveryRiderName: selectedRider?.name,
      deliveryRiderPhone: selectedRider?.phone,
      // Third Party
      thirdPartyPlatform: orderType === 'third_party' ? thirdPartyPlatform : undefined,
      externalOrderId: orderType === 'third_party' ? externalOrderId : undefined,
      // Car Service
      carRegistration: orderType === 'car_service' ? carRegistration : undefined,
      carMakeModel: orderType === 'car_service' ? carMakeModel : undefined,
      carColor: orderType === 'car_service' ? carColor : undefined,
      parkingBay: orderType === 'car_service' ? parkingBay : undefined,
      // Items & Finance
      items: cartItems,
      discountType: orderDiscountValue > 0 ? orderDiscountType : undefined,
      discountValue: orderDiscountValue > 0 ? orderDiscountValue : undefined,
      notes: orderNotes.trim() || undefined,
    });

    // Reset Form
    setCartItems([]);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerAddress('');
    setCustomerArea('');
    setCustomerLandmark('');
    setCustomerAltPhone('');
    setMatchedCustomer(null);
    setCustomerLookup('');
    setShowCustomerResults(false);
    setOrderNotes('');

    if (proceedToPayment) {
      onOpenPayment(newOrder);
    } else {
      // Auto open print KOT modal or switch to running orders
      openPrintModal({
        type: 'receipt',
        order: newOrder,
      });
      setActiveTab('running_orders');
    }
  };

  const handlePrintBillPreview = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty.');
      return;
    }
    const tempOrder: Order = {
      id: 'preview',
      orderNumber: 'PREVIEW',
      invoiceNumber: 'PREVIEW',
      tokenNumber: 'PREVIEW',
      branchId: branch.id,
      orderType,
      status: 'new',
      paymentStatus: 'unpaid',
      items: cartItems,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      deliveryCharge,
      serviceCharge,
      grandTotal,
      payments: [],
      refunds: [],
      cashierId: currentEmployee.employeeId,
      cashierName: currentEmployee.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [],
      reprintCount: 0,
      kotReprintCount: 0,
      tableName: tables.find(t => t.id === selectedTableId)?.number,
      waiterName: employees.find(e => e.id === selectedWaiterId)?.name,
      customerName,
      customerPhone,
      deliveryAddress: customerAddress,
    };
    openPrintModal({ type: 'receipt', order: tempOrder });
  };

  const orderTypesConfig: { id: OrderType; label: string; icon: React.ElementType }[] = [
    { id: 'dine_in', label: 'Dine-In', icon: Utensils },
    { id: 'takeaway', label: 'Takeaway', icon: PackageCheck },
    { id: 'delivery', label: 'Delivery', icon: Bike },
    { id: 'third_party', label: 'Third Party', icon: Globe2 },
    { id: 'car_service', label: 'Car Service', icon: Car },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-57px)] overflow-hidden bg-slate-950 select-none">
      {/* LEFT & CENTER: ORDER CONFIG & MENU CATALOG (2/3 width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        {/* Banner if adding to existing order */}
        {addingToOrder && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-bold shadow">
            <span>
              Adding items to Order #{addingToOrder.orderNumber} (Token #{addingToOrder.tokenNumber})
              {addingToOrder.tableName ? ` - Table ${addingToOrder.tableName}` : ''}
            </span>
            <button
              onClick={onFinishAddingItems}
              className="px-2.5 py-0.5 rounded bg-slate-950 text-amber-400 text-xs font-bold hover:bg-slate-900"
            >
              Cancel Add
            </button>
          </div>
        )}

        {/* 1. ORDER TYPE SELECTOR BAR */}
        {!addingToOrder && (
          <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex items-center gap-1.5 overflow-x-auto">
            {orderTypesConfig.map(ot => {
              const Icon = ot.icon;
              const isSelected = orderType === ot.id;
              return (
                <button
                  key={ot.id}
                  onClick={() => setOrderType(ot.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs shrink-0 transition ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                  <span>{ot.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. DYNAMIC INPUT STRIP ACCORDING TO ORDER TYPE */}
        <div className="bg-slate-900/60 border-b border-slate-800 p-2.5 text-xs">
          {!addingToOrder && (orderType === 'takeaway' || orderType === 'delivery') && (
            <div className="mb-2 relative">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Find Existing Customer
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                <input
                  type="text"
                  value={customerLookup}
                  onFocus={() => setShowCustomerResults(true)}
                  onChange={e => {
                    setCustomerLookup(e.target.value);
                    setShowCustomerResults(true);
                  }}
                  placeholder="Search customer by name, phone, address or area..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {showCustomerResults && customerLookup.trim() && (
                <div className="absolute z-40 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-slate-950 border border-slate-700 rounded-xl shadow-2xl">
                  {customerSearchResults.length === 0 ? (
                    <div className="p-3 text-[11px] text-slate-500">
                      No existing customer found. Enter the new customer's details below.
                    </div>
                  ) : (
                    customerSearchResults.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => fillCustomerDetails(customer)}
                        className="w-full p-2.5 text-left border-b last:border-b-0 border-slate-800 hover:bg-slate-900 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-100">{customer.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {customer.phone} • {customer.area}
                            </div>
                          </div>
                          <div className="text-[10px] text-amber-400 font-mono">
                            {customer.totalOrders} orders
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {customer.address}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

                    {/* DINE-IN INPUTS */}
          {orderType === 'dine_in' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Table Number *
                </label>
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose Table --</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.number} ({t.area}) - {t.status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Covers / Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={covers}
                  onChange={e => setCovers(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Server / Waiter *
                </label>
                <select
                  value={selectedWaiterId}
                  onChange={e => setSelectedWaiterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Select Waiter --</option>
                  {employees
                    .filter(e => e.role === 'waiter' || e.role === 'cashier' || e.role === 'branch_manager')
                    .map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Customer (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Guest / Family Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </div>
          )}

          {/* TAKEAWAY INPUTS */}
          {orderType === 'takeaway' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Customer Mobile Phone
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="0300-1234567 (Auto Search)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer Full Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Token / Pickup Note
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Pickup in 20 mins"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </div>
            {matchedCustomer && (
              <div className="mt-2 flex items-center justify-between gap-2 p-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded text-[11px] text-emerald-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Existing Customer: <strong>{matchedCustomer.name}</strong> • {matchedCustomer.totalOrders} orders • {branch.currency} {matchedCustomer.totalSpent.toLocaleString()} spent
                </span>
                <button type="button" onClick={clearMatchedCustomer} className="text-emerald-300 hover:text-white">
                  Change
                </button>
              </div>
            )}
          )}

          {/* DELIVERY INPUTS */}
          {orderType === 'delivery' && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="0300-4567890 (Auto Lookup)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Delivery Area
                  </label>
                  <input
                    type="text"
                    value={customerArea}
                    onChange={e => setCustomerArea(e.target.value)}
                    placeholder="e.g. DHA Phase 5, Gulberg III"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Assign Rider
                  </label>
                  <select
                    value={selectedRiderId}
                    onChange={e => setSelectedRiderId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs"
                  >
                    <option value="">-- Assign Rider Later --</option>
                    {riders.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.vehicleRegistration}) - {r.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Complete Address *
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="House/Plot #, Street, Block, Landmark"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Delivery Notes
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    placeholder="Call upon arrival at gate"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="text"
                    value={customerAltPhone}
                    onChange={e => setCustomerAltPhone(e.target.value)}
                    placeholder="0321-..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={customerLandmark}
                    onChange={e => setCustomerLandmark(e.target.value)}
                    placeholder="Near mosque / market"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              {matchedCustomer && (
                <div className="flex items-center justify-between gap-2 p-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded text-[11px] text-emerald-300">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Existing Customer: <strong>{matchedCustomer.name}</strong> • Orders: {matchedCustomer.totalOrders} • Total Spent: {branch.currency} {matchedCustomer.totalSpent.toLocaleString()}
                  </span>
                  <button type="button" onClick={clearMatchedCustomer} className="text-emerald-300 hover:text-white">
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* THIRD PARTY INPUTS */}
          {orderType === 'third_party' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Ordering Platform
                </label>
                <select
                  value={thirdPartyPlatform}
                  onChange={e => setThirdPartyPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-bold"
                >
                  <option value="Foodpanda">Foodpanda Delivery</option>
                  <option value="Careem NOW">Careem NOW</option>
                  <option value="Bykea Food">Bykea Food</option>
                  <option value="Corporate Account">Corporate Account</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  External Order / ID #
                </label>
                <input
                  type="text"
                  value={externalOrderId}
                  onChange={e => setExternalOrderId(e.target.value)}
                  placeholder="e.g. FP-981240"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Rider / Pickup Info
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Platform rider name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </div>
          )}

          {/* CAR SERVICE INPUTS */}
          {orderType === 'car_service' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-center">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Car Reg # *
                </label>
                <input
                  type="text"
                  value={carRegistration}
                  onChange={e => setCarRegistration(e.target.value)}
                  placeholder="e.g. LEA-2024-88"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Make / Model
                </label>
                <input
                  type="text"
                  value={carMakeModel}
                  onChange={e => setCarMakeModel(e.target.value)}
                  placeholder="e.g. Honda Civic"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={carColor}
                  onChange={e => setCarColor(e.target.value)}
                  placeholder="White / Black"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Parking / Bay #
                </label>
                <input
                  type="text"
                  value={parkingBay}
                  onChange={e => setParkingBay(e.target.value)}
                  placeholder="Bay 01"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="0300-..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. MENU SEARCH & CATEGORY BAR */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Food Item by name, recipe or code (Shift + S)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map(cat => {
              const count = menuItems.filter(m => m.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] font-normal ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. PRODUCT CARDS GRID */}
        <div className="flex-1 overflow-y-auto p-3.5 bg-slate-950">
          {filteredMenuItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <Info className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
              <span>No food items match the filter or search criteria.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMenuItems.map(item => {
                const hasCustomization =
                  (item.sizes && item.sizes.length > 1) ||
                  (item.modifierGroups && item.modifierGroups.length > 0);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemCardClick(item)}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition select-none group relative overflow-hidden ${
                      item.available
                        ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition line-clamp-2 leading-tight">
                          {item.name}
                        </h4>
                        {!item.available && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold shrink-0">
                            Sold Out
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <div className="text-xs font-mono font-black text-amber-400">
                        {branch.currency} {item.basePrice.toLocaleString()}
                        {item.sizes.length > 1 && (
                          <span className="text-[9px] font-sans text-slate-400 ml-1 font-normal">
                            from
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {hasCustomization && (
                          <span className="text-[9px] bg-slate-800 text-amber-300/80 px-1 py-0.5 rounded font-medium border border-slate-700">
                            Options
                          </span>
                        )}
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-slate-950 text-amber-400 border border-amber-500/30 flex items-center justify-center transition">
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: ORDER CART & BILLING BREAKDOWN (1/3 width) */}
      <div className="w-full lg:w-96 shrink-0 bg-slate-900 flex flex-col h-full border-t lg:border-t-0 select-none">
        {/* Cart Header */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              Current Order Cart
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
              {cartItems.reduce((sum, it) => sum + it.quantity, 0)}
            </span>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={() => setCartItems([])}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-medium transition"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
              <Utensils className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400">Cart is empty</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Click any food item from the menu catalog on the left to add it to this order.
              </p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {item.name}
                    </div>
                    {item.size && (
                      <span className="text-[10px] text-amber-400/90 font-semibold">
                        Size: {item.size}
                      </span>
                    )}

                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="text-[10px] text-slate-400 pl-1 mt-0.5">
                        {item.selectedModifiers.map(m => (m.type === 'add' ? `+ ${m.name}` : `- ${m.name}`)).join(', ')}
                      </div>
                    )}

                    {item.specialInstructions && (
                      <div className="text-[10px] text-amber-400/80 italic pl-1 mt-0.5">
                        * {item.specialInstructions}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-black text-amber-400">
                      {branch.currency} {item.totalPrice.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      @{item.unitPrice}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateCartQty(idx, -1)}
                      className="p-1 hover:bg-slate-800 text-slate-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-slate-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(idx, 1)}
                      className="p-1 hover:bg-slate-800 text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeCartItem(idx)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom: Calculations & Action Buttons */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
          {/* Bill Calculation Summary */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200">
                {branch.currency} {subtotal.toLocaleString()}
              </span>
            </div>

            {/* Discount section */}
            <div className="flex justify-between items-center text-slate-400">
              <button
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                <span>{discountAmount > 0 ? `Discount (${orderDiscountValue}${orderDiscountType === 'percentage' ? '%' : ''})` : '+ Add Discount'}</span>
              </button>
              <span className="font-mono text-amber-400">
                -{branch.currency} {discountAmount.toLocaleString()}
              </span>
            </div>

            {showDiscountInput && (
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex gap-2 items-center text-xs">
                <select
                  value={orderDiscountType}
                  onChange={e => setOrderDiscountType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-200 text-[11px]"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Flat</option>
                </select>
                <input
                  type="number"
                  value={orderDiscountValue || ''}
                  onChange={e => setOrderDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="Val"
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-[11px]"
                />
                <button
                  onClick={() => setShowDiscountInput(false)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Done
                </button>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Sales Tax ({taxRate}%):</span>
              <span className="font-mono text-slate-200">
                {branch.currency} {taxAmount.toLocaleString()}
              </span>
            </div>

            {orderType === 'dine_in' && (
              <div className="flex justify-between text-slate-400">
                <span>Service Charge ({branch.serviceChargeRate}%):</span>
                <span className="font-mono text-slate-200">
                  {branch.currency} {serviceCharge.toLocaleString()}
                </span>
              </div>
            )}

            {orderType === 'delivery' && (
              <div className="flex justify-between text-slate-400">
                <span>Delivery Charge:</span>
                <span className="font-mono text-slate-200">
                  {branch.currency} {deliveryCharge.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm border-t border-slate-800 pt-1.5 text-slate-100">
              <span className="uppercase tracking-wider">Grand Total:</span>
              <span className="font-mono text-amber-400">
                {branch.currency} {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              disabled={cartItems.length === 0}
              onClick={handlePrintBillPreview}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition disabled:opacity-40"
              title="Print Bill Preview (F8)"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Bill (F8)</span>
            </button>

            <button
              disabled={cartItems.length === 0}
              onClick={() => handlePlaceOrder(true)}
              className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-sm"
              title="Pay & Settle (F10)"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay (F10)</span>
            </button>
          </div>

          {/* Master Place / Send to Kitchen Button */}
          <button
            disabled={cartItems.length === 0}
            onClick={() => handlePlaceOrder(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-40"
          >
            <ChefHat className="w-4 h-4 stroke-[2.5]" />
            <span>
              {addingToOrder
                ? 'Generate Additional KOT & Add Items'
                : 'Send to Kitchen / Place Order (F9)'}
            </span>
          </button>
        </div>
      </div>

      {/* Item Customizer Modal (Size, Toppings, Notes) */}
      {selectedItemForCustomizer && (
        <ItemCustomizerModal
          item={selectedItemForCustomizer}
          onClose={() => setSelectedItemForCustomizer(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};
