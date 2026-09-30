import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { InventoryItem, StockTransaction } from '../../types';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCw,
  Search,
  CheckCircle2,
  Trash2,
  Utensils
} from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const { branch, inventory, adjustStock, addInventoryItem, menuItems } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<StockTransaction['type']>('stock_in');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Add Item state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Dairy');
  const [newUnit, setNewUnit] = useState('KG');
  const [newStock, setNewStock] = useState<number>(10);
  const [newMinStock, setNewMinStock] = useState<number>(5);
  const [newCost, setNewCost] = useState<number>(500);
  const [newSupplier, setNewSupplier] = useState('Premo Dairy Distributors');
  const [newLocation, setNewLocation] = useState('Chiller A');

  const filteredInventory = inventory.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  const handleConfirmAdjustment = () => {
    if (!selectedItemForAdjust || adjustQty <= 0) return;
    adjustStock(
      selectedItemForAdjust.id,
      adjustQty,
      adjustType,
      adjustReason || `${adjustType.toUpperCase()} manual adjustment`
    );
    setSelectedItemForAdjust(null);
    setAdjustQty(1);
    setAdjustReason('');
  };

  const handleCreateInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addInventoryItem({
      name: newName.trim(),
      category: newCategory,
      unit: newUnit,
      currentStock: newStock,
      minStock: newMinStock,
      purchaseCost: newCost,
      supplierId: 'sup_01',
      supplierName: newSupplier,
      storeLocation: newLocation,
    });

    setShowAddModal(false);
    setNewName('');
  };

  const lowStockItems = inventory.filter(i => i.currentStock <= i.minStock);

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
            Real-time recipe consumption tracking, stock-ins, wastage logging, and minimum thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lowStockItems.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>{lowStockItems.length} Low Stock Items</span>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Ingredient</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search raw ingredient by name or category..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
                <th className="p-3 text-center">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredInventory.map(item => {
                const isLow = item.currentStock <= item.minStock;

                return (
                  <tr key={item.id} className="hover:bg-slate-850 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{item.name}</div>
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
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{item.storeLocation}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isLow
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isLow ? 'LOW STOCK' : 'OPTIMAL'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedItemForAdjust(item);
                          setAdjustType('stock_in');
                          setAdjustQty(1);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST STOCK MODAL */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Adjust Stock: {selectedItemForAdjust.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Current Stock: {selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForAdjust(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'stock_in', label: 'Stock In (+)' },
                    { id: 'wastage', label: 'Wastage (-)' },
                    { id: 'adjustment', label: 'Adjustment' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAdjustType(t.id as any)}
                      className={`p-2 rounded-lg text-xs font-bold border transition ${
                        adjustType === t.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Quantity ({selectedItemForAdjust.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustQty}
                  onChange={e => setAdjustQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Daily market purchase, spoilage, audit count"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedItemForAdjust(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdjustment}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD INGREDIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateInventoryItem}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Add Raw Ingredient</h3>
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
                <label className="block text-slate-400 font-semibold mb-1">Ingredient Name *</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Cheddar Cheese Blocks"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Dairy / Poultry / Bakery"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unit</label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold"
                  >
                    <option value="KG">KG (Kilograms)</option>
                    <option value="Litre">Litre</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Packs">Packs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={newMinStock}
                    onChange={e => setNewMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cost ({branch.currency})</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={e => setNewCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={e => setNewSupplier(e.target.value)}
                    placeholder="Supplier / Mill"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Store Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="Chiller / Freezer / Pantry"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
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
                Save Ingredient
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
