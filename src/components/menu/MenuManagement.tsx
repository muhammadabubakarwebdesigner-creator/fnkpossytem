import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { MenuItem, MenuCategory, KitchenStation } from '../../types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChefHat,
  Search,
  Tag
} from 'lucide-react';

export const MenuManagement: React.FC = () => {
  const {
    branch,
    categories,
    menuItems,
    addMenuItem,
    updateMenuItem,
    toggleMenuItemAvailability,
    addCategory,
  } = usePOS();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍽️');

  // New Item Form
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(500);
  const [station, setStation] = useState<KitchenStation>('pizza_kitchen');

  const filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      icon: newCatIcon || '🍽️',
      sortOrder: categories.length + 1,
    });
    setNewCatName('');
    setShowAddCategoryModal(false);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: name.trim(),
        categoryId,
        description: description.trim(),
        basePrice,
        station,
      });
      setEditingItem(null);
    } else {
      addMenuItem({
        name: name.trim(),
        categoryId,
        description: description.trim(),
        basePrice,
        station,
        available: true,
        sizes: [
          { name: 'Regular', price: basePrice, costPrice: Math.round(basePrice * 0.35) },
        ],
      });
      setShowAddModal(false);
    }

    // Reset
    setName('');
    setDescription('');
    setBasePrice(500);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategoryId(item.categoryId);
    setDescription(item.description || '');
    setBasePrice(item.basePrice);
    setStation(item.station);
    setShowAddModal(true);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Menu & Pricing Catalog</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure menu categories, sizes, prices, availability, and kitchen station routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setName('');
              setDescription('');
              setBasePrice(500);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Product</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Categories ({menuItems.length})
            </button>
            {categories.map(cat => {
              const count = menuItems.filter(m => m.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-black' : 'text-slate-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3">Product Name & Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Kitchen Station</th>
                <th className="p-3">Sizes / Portions</th>
                <th className="p-3 text-right">Base Price</th>
                <th className="p-3 text-center">In Stock</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map(item => {
                const cat = categories.find(c => c.id === item.categoryId);
                return (
                  <tr key={item.id} className="hover:bg-slate-850 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-100 text-sm">{item.name}</div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 max-w-md line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {cat?.name || 'General'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-amber-300">
                      {item.station.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {item.sizes.map(s => (
                          <span
                            key={s.name}
                            className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300"
                          >
                            {s.name}: {branch.currency}{s.price}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-amber-400 text-sm">
                      {branch.currency} {item.basePrice.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleMenuItemAvailability(item.id)}
                        className={`px-2 py-1 rounded text-[10px] font-black uppercase transition ${
                          item.available
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {item.available ? 'AVAILABLE' : 'SOLD OUT'}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveItem}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                {editingItem ? 'Edit Menu Product' : 'Add New Menu Product'}
              </h3>
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
                <label className="block text-slate-400 font-semibold mb-1">Product Title *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Crown Crust Deluxe Pizza"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Kitchen Station *</label>
                  <select
                    value={station}
                    onChange={e => setStation(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    <option value="pizza_kitchen">Pizza Kitchen</option>
                    <option value="grill_fryer">Grill & Fryer</option>
                    <option value="beverage_counter">Beverage Counter</option>
                    <option value="dessert_station">Dessert Station</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Base Price ({branch.currency}) *</label>
                <input
                  required
                  type="number"
                  value={basePrice}
                  onChange={e => setBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-base font-black text-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ingredients and culinary notes"
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
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateCategory}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Add Menu Category</h3>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category Name *</label>
                <input
                  required
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Seafood, Mocktails"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Icon / Emoji</label>
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={e => setNewCatIcon(e.target.value)}
                  placeholder="🍤"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Add Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
