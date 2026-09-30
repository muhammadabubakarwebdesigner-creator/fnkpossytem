import React, { useMemo, useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { InventoryItem, StockTransaction } from '../../types';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Search,
  Pencil,
  Trash2,
  History,
  ArrowUpRight,
  ArrowDownRight,
  RotateCw,
  X,
} from 'lucide-react';

type InventoryFormState = {
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  purchaseCost: number;
  supplierName: string;
  storeLocation: string;
};

const emptyForm: InventoryFormState = {
  name: '',
  category: 'Dairy',
  unit: 'KG',
  currentStock: 10,
  minStock: 5,
  purchaseCost: 500,
  supplierName: '',
  storeLocation: '',
};

const transactionLabels: Record<StockTransaction['type'], string> = {
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
  wastage: 'Wastage',
  adjustment: 'Physical Count',
  order_consumption: 'Order Consumption',
};

export const InventoryManagement: React.FC = () => {
  const {
    branch,
    inventory,
    stockTransactions,
    adjustStock,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<StockTransaction['type']>('stock_in');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<InventoryFormState>(emptyForm);
  const [addError, setAddError] = useState('');

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState<InventoryFormState>(emptyForm);
  const [editError, setEditError] = useState('');

  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [historyIngredientId, setHistoryIngredientId] = useState<string>('all');
  const [historyType, setHistoryType] = useState<'all' | StockTransaction['type']>('all');

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inventory;

    return inventory.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.supplierName.toLowerCase().includes(q) ||
      item.storeLocation.toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);

  const filteredTransactions = useMemo(() => {
    return stockTransactions.filter(transaction => {
      const ingredientMatch =
        historyIngredientId === 'all' || transaction.ingredientId === historyIngredientId;
      const typeMatch =
        historyType === 'all' || transaction.type === historyType;
      return ingredientMatch && typeMatch;
    });
  }, [stockTransactions, historyIngredientId, historyType]);

  const resetAdjustment = () => {
    setSelectedItemForAdjust(null);
    setAdjustType('stock_in');
    setAdjustQty(1);
    setAdjustReason('');
    setAdjustError('');
  };

  const openAdjustment = (
    item: InventoryItem,
    type: StockTransaction['type'] = 'stock_in'
  ) => {
    setSelectedItemForAdjust(item);
    setAdjustType(type);
    setAdjustQty(type === 'adjustment' ? item.currentStock : 1);
    setAdjustReason('');
    setAdjustError('');
  };

  const handleConfirmAdjustment = () => {
    if (!selectedItemForAdjust) return;

    if (!Number.isFinite(adjustQty) || adjustQty < 0) {
      setAdjustError('Enter a valid quantity.');
      return;
    }

    if (adjustType !== 'adjustment' && adjustQty <= 0) {
      setAdjustError('Quantity must be greater than zero.');
      return;
    }

    if (
      (adjustType === 'stock_out' || adjustType === 'wastage') &&
      adjustQty > selectedItemForAdjust.currentStock
    ) {
      setAdjustError(
        `Only ${selectedItemForAdjust.currentStock} ${selectedItemForAdjust.unit} is currently available.`
      );
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError('Please enter a reason / note for this stock transaction.');
      return;
    }

    adjustStock(
      selectedItemForAdjust.id,
      adjustQty,
      adjustType,
      adjustReason.trim()
    );

    resetAdjustment();
  };

  const handleCreateInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!addForm.name.trim()) {
      setAddError('Ingredient name is required.');
      return;
    }

    if (addForm.currentStock < 0 || addForm.minStock < 0 || addForm.purchaseCost < 0) {
      setAddError('Stock, minimum threshold and cost cannot be negative.');
      return;
    }

    addInventoryItem({
      name: addForm.name.trim(),
      category: addForm.category.trim() || 'Other',
      unit: addForm.unit,
      currentStock: addForm.currentStock,
      minStock: addForm.minStock,
      purchaseCost: addForm.purchaseCost,
      supplierId: 'sup_manual',
      supplierName: addForm.supplierName.trim() || 'Not Assigned',
      storeLocation: addForm.storeLocation.trim() || 'Not Assigned',
    });

    setShowAddModal(false);
    setAddForm(emptyForm);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditError('');
    setEditForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minStock: item.minStock,
      purchaseCost: item.purchaseCost,
      supplierName: item.supplierName,
      storeLocation: item.storeLocation,
    });
  };

  const handleUpdateInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditError('');

    if (!editForm.name.trim()) {
      setEditError('Ingredient name is required.');
      return;
    }

    if (editForm.minStock < 0 || editForm.purchaseCost < 0) {
      setEditError('Minimum threshold and cost cannot be negative.');
      return;
    }

    updateInventoryItem({
      ...editingItem,
      name: editForm.name.trim(),
      category: editForm.category.trim() || 'Other',
      unit: editForm.unit,
      minStock: editForm.minStock,
      purchaseCost: editForm.purchaseCost,
      supplierName: editForm.supplierName.trim() || 'Not Assigned',
      storeLocation: editForm.storeLocation.trim() || 'Not Assigned',
    });

    setEditingItem(null);
  };

  const handleDeleteInventoryItem = () => {
    if (!deletingItem) return;

    setDeleteError('');
    const result = deleteInventoryItem(deletingItem.id);

    if (!result.success) {
      setDeleteError(result.error || 'Unable to delete this ingredient.');
      return;
    }

    setDeletingItem(null);
  };

  const openHistoryForItem = (item: InventoryItem) => {
    setHistoryIngredientId(item.id);
    setHistoryType('all');
    setShowHistory(true);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return date.toLocaleString();
  };

  const transactionDirection = (type: StockTransaction['type']) => {
    if (type === 'stock_in') return '+';
    if (type === 'adjustment') return '=';
    return '-';
  };

  const transactionClass = (type: StockTransaction['type']) => {
    if (type === 'stock_in') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
    if (type === 'wastage') return 'text-rose-300 bg-rose-500/10 border-rose-500/30';
    if (type === 'order_consumption') return 'text-sky-300 bg-sky-500/10 border-sky-500/30';
    if (type === 'stock_out') return 'text-orange-300 bg-orange-500/10 border-orange-500/30';
    return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-400" />
            <span>Raw Ingredients & Recipe Inventory</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time recipe consumption tracking, stock movement history, wastage logging, and minimum thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {lowStockItems.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{lowStockItems.length} Low Stock Items</span>
            </div>
          )}

          <button
            onClick={() => {
              setHistoryIngredientId('all');
              setHistoryType('all');
              setShowHistory(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition"
          >
            <History className="w-4 h-4" />
            <span>Stock History</span>
          </button>

          <button
            onClick={() => {
              setAddForm(emptyForm);
              setAddError('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Ingredient</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800">
        <div className="relative max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ingredient, category, supplier or location..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-w-[1180px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3">Ingredient Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right">Min Threshold</th>
                <th className="p-3 text-right">Unit Cost</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Store Location</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {filteredInventory.map(item => {
                const isLow = item.currentStock <= item.minStock;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{item.name}</div>
                      <button
                        onClick={() => openHistoryForItem(item)}
                        className="mt-1 text-[10px] text-sky-400 hover:text-sky-300 font-semibold"
                      >
                        View History
                      </button>
                    </td>

                    <td className="p-3 text-slate-400">{item.category}</td>

                    <td className="p-3 text-right font-mono font-black text-sm">
                      <span className={isLow ? 'text-rose-400' : 'text-slate-100'}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>

                    <td className="p-3 text-right font-mono text-slate-400">
                      {item.minStock} {item.unit}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-amber-400">
                      {branch.currency} {item.purchaseCost}
                    </td>

                    <td className="p-3 text-slate-300">{item.supplierName}</td>

                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {item.storeLocation}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isLow
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isLow ? 'LOW STOCK' : 'OPTIMAL'}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => openAdjustment(item, 'stock_in')}
                          className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition"
                          title="Stock In / Stock Out / Wastage / Physical Count"
                        >
                          Stock
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition"
                          title="Edit Ingredient"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setDeletingItem(item);
                            setDeleteError('');
                          }}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
                          title="Delete Ingredient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-500">
                    No inventory ingredients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Stock Transaction: {selectedItemForAdjust.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Current Stock: <strong className="text-slate-200">{selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}</strong>
                </p>
              </div>

              <button onClick={resetAdjustment} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-2 text-xs">
                Transaction Type
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('stock_in');
                    setAdjustQty(1);
                    setAdjustError('');
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    adjustType === 'stock_in'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Stock In (+)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('stock_out');
                    setAdjustQty(1);
                    setAdjustError('');
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    adjustType === 'stock_out'
                      ? 'bg-orange-500 text-slate-950 border-orange-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Stock Out (-)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('wastage');
                    setAdjustQty(1);
                    setAdjustError('');
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    adjustType === 'wastage'
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Wastage (-)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('adjustment');
                    setAdjustQty(selectedItemForAdjust.currentStock);
                    setAdjustError('');
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    adjustType === 'adjustment'
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <RotateCw className="w-4 h-4" />
                  Physical Count
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-xs">
                {adjustType === 'adjustment'
                  ? `Actual Physical Stock (${selectedItemForAdjust.unit})`
                  : `Quantity (${selectedItemForAdjust.unit})`}
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={adjustQty}
                onChange={e => {
                  setAdjustQty(parseFloat(e.target.value) || 0);
                  setAdjustError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
              />

              {adjustType === 'adjustment' && (
                <p className="text-[10px] text-amber-300 mt-1.5">
                  Physical Count sets the stock to this exact quantity. It does not add or subtract this number.
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-xs">
                Reason / Notes *
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={e => {
                  setAdjustReason(e.target.value);
                  setAdjustError('');
                }}
                placeholder={
                  adjustType === 'stock_in'
                    ? 'e.g. Supplier delivery received'
                    : adjustType === 'stock_out'
                    ? 'e.g. Issued to another branch'
                    : adjustType === 'wastage'
                    ? 'e.g. Expired / damaged stock'
                    : 'e.g. Physical inventory count'
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {adjustError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {adjustError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={resetAdjustment}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmAdjustment}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD INGREDIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateInventoryItem}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Add Raw Ingredient</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <InventoryForm
              form={addForm}
              setForm={setAddForm}
              currency={branch.currency}
              includeCurrentStock
            />

            {addError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {addError}
              </div>
            )}

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
                Save Ingredient
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT INGREDIENT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleUpdateInventoryItem}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">Edit Raw Ingredient</h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Use Stock Transaction to change current stock so the movement remains in history.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <InventoryForm
              form={editForm}
              setForm={setEditForm}
              currency={branch.currency}
              includeCurrentStock={false}
            />

            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 flex justify-between items-center">
              <span className="text-xs text-slate-400">Current Stock</span>
              <span className="font-mono font-black text-slate-100">
                {editingItem.currentStock} {editingItem.unit}
              </span>
            </div>

            {editError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-300">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete Raw Ingredient?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You are about to delete <strong className="text-slate-200">{deletingItem.name}</strong>.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
              If this ingredient is currently used in any menu recipe, the system will block deletion until it is removed from that recipe.
            </div>

            {deleteError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setDeletingItem(null);
                  setDeleteError('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Keep Ingredient
              </button>

              <button
                onClick={handleDeleteInventoryItem}
                className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
              >
                Delete Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK HISTORY MODAL */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  Stock Transaction History
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manual stock movements and automatic recipe consumption.
                </p>
              </div>

              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                  Ingredient
                </label>
                <select
                  value={historyIngredientId}
                  onChange={e => setHistoryIngredientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                >
                  <option value="all">All Ingredients</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                  Transaction Type
                </label>
                <select
                  value={historyType}
                  onChange={e => setHistoryType(e.target.value as 'all' | StockTransaction['type'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                >
                  <option value="all">All Transaction Types</option>
                  <option value="stock_in">Stock In</option>
                  <option value="stock_out">Stock Out</option>
                  <option value="wastage">Wastage</option>
                  <option value="adjustment">Physical Count</option>
                  <option value="order_consumption">Order Consumption</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date / Time</th>
                    <th className="p-3">Ingredient</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Employee</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {formatDateTime(transaction.timestamp)}
                      </td>
                      <td className="p-3 font-bold text-slate-100">
                        {transaction.ingredientName}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 rounded border text-[10px] font-black ${transactionClass(transaction.type)}`}>
                          {transactionLabels[transaction.type]}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-100 whitespace-nowrap">
                        {transactionDirection(transaction.type)}{transaction.quantity} {transaction.unit}
                      </td>
                      <td className="p-3 text-slate-300">{transaction.reason}</td>
                      <td className="p-3 text-slate-400 font-mono text-[10px]">
                        {transaction.referenceId || '—'}
                      </td>
                      <td className="p-3 text-slate-300">{transaction.employeeName}</td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <History className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <div className="text-slate-400 font-bold">No stock transactions found</div>
                        <div className="text-slate-600 text-[10px] mt-1">
                          New stock movements and recipe consumption will appear here.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
              </span>

              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface InventoryFormProps {
  form: InventoryFormState;
  setForm: React.Dispatch<React.SetStateAction<InventoryFormState>>;
  currency: string;
  includeCurrentStock: boolean;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  form,
  setForm,
  currency,
  includeCurrentStock,
}) => {
  const update = <K extends keyof InventoryFormState>(
    key: K,
    value: InventoryFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-3 text-xs">
      <div>
        <label className="block text-slate-400 font-semibold mb-1">Ingredient Name *</label>
        <input
          required
          type="text"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g. Cheddar Cheese Blocks"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Category</label>
          <input
            type="text"
            value={form.category}
            onChange={e => update('category', e.target.value)}
            placeholder="Dairy / Poultry / Bakery"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Unit</label>
          <select
            value={form.unit}
            onChange={e => update('unit', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold"
          >
            <option value="KG">KG (Kilograms)</option>
            <option value="Gram">Gram</option>
            <option value="Litre">Litre</option>
            <option value="ML">ML</option>
            <option value="Pieces">Pieces</option>
            <option value="Packs">Packs</option>
          </select>
        </div>
      </div>

      <div className={`grid ${includeCurrentStock ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
        {includeCurrentStock && (
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Opening Stock</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.currentStock}
              onChange={e => update('currentStock', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
            />
          </div>
        )}

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Min Threshold</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.minStock}
            onChange={e => update('minStock', parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">
            Unit Cost ({currency})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.purchaseCost}
            onChange={e => update('purchaseCost', parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Supplier Name</label>
          <input
            type="text"
            value={form.supplierName}
            onChange={e => update('supplierName', e.target.value)}
            placeholder="Supplier / Mill"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Store Location</label>
          <input
            type="text"
            value={form.storeLocation}
            onChange={e => update('storeLocation', e.target.value)}
            placeholder="Chiller / Freezer / Pantry"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
          />
        </div>
      </div>
    </div>
  );
};
