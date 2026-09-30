import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { MenuItem, KitchenStation } from '../../types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Save,
  Package,
  ChefHat
} from 'lucide-react';

type SizeDraft = {
  name: string;
  price: number;
  costPrice: number;
};

const DEFAULT_SIZES: SizeDraft[] = [
  { name: 'Small', price: 0, costPrice: 0 },
  { name: 'Regular', price: 0, costPrice: 0 },
  { name: 'Large', price: 0, costPrice: 0 },
  { name: 'Extra Large', price: 0, costPrice: 0 },
];

export const MenuManagement: React.FC = () => {
  const {
    branch,
    categories,
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    addCategory,
  } = usePOS();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍽️');

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(500);
  const [station, setStation] = useState<KitchenStation>('pizza_kitchen');
  const [available, setAvailable] = useState(true);
  const [sizes, setSizes] = useState<SizeDraft[]>([
    { name: 'Regular', price: 500, costPrice: 175 },
  ]);

  const filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const categoryName =
        categories.find(category => category.id === item.categoryId)?.name || '';

      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const resetItemForm = () => {
    setEditingItem(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setBasePrice(500);
    setStation('pizza_kitchen');
    setAvailable(true);
    setSizes([{ name: 'Regular', price: 500, costPrice: 175 }]);
  };

  const openAddModal = () => {
    resetItemForm();
    setShowAddModal(true);
  };

  const closeItemModal = () => {
    setShowAddModal(false);
    resetItemForm();
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      icon: newCatIcon || '🍽️',
      sortOrder: categories.length + 1,
    });

    setNewCatName('');
    setNewCatIcon('🍽️');
    setShowAddCategoryModal(false);
  };

  const handleBasePriceChange = (value: number) => {
    const nextPrice = Number.isFinite(value) ? Math.max(0, value) : 0;
    setBasePrice(nextPrice);

    if (sizes.length === 1 && sizes[0].name.toLowerCase() === 'regular') {
      setSizes([
        {
          ...sizes[0],
          price: nextPrice,
          costPrice: sizes[0].costPrice || Math.round(nextPrice * 0.35),
        },
      ]);
    }
  };

  const updateSize = (
    index: number,
    field: keyof SizeDraft,
    value: string | number
  ) => {
    setSizes(prev =>
      prev.map((size, sizeIndex) => {
        if (sizeIndex !== index) return size;

        if (field === 'name') {
          return { ...size, name: String(value) };
        }

        const numericValue = Number(value);
        return {
          ...size,
          [field]: Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0,
        };
      })
    );
  };

  const addSize = (presetName = '') => {
    const cleanPreset = presetName.trim();

    if (
      cleanPreset &&
      sizes.some(size => size.name.toLowerCase() === cleanPreset.toLowerCase())
    ) {
      return;
    }

    setSizes(prev => [
      ...prev,
      {
        name: cleanPreset,
        price: basePrice,
        costPrice: Math.round(basePrice * 0.35),
      },
    ]);
  };

  const addAllStandardSizes = () => {
    setSizes(prev => {
      const next = [...prev];

      DEFAULT_SIZES.forEach(defaultSize => {
        if (
          !next.some(
            size => size.name.toLowerCase() === defaultSize.name.toLowerCase()
          )
        ) {
          next.push({
            name: defaultSize.name,
            price: basePrice,
            costPrice: Math.round(basePrice * 0.35),
          });
        }
      });

      return next;
    });
  };

  const removeSize = (index: number) => {
    setSizes(prev => prev.filter((_, sizeIndex) => sizeIndex !== index));
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      window.alert('Please enter a product title.');
      return;
    }

    if (!categoryId) {
      window.alert('Please select a category.');
      return;
    }

    const cleanSizes = sizes
      .map(size => ({
        name: size.name.trim(),
        price: Math.max(0, Number(size.price) || 0),
        costPrice: Math.max(0, Number(size.costPrice) || 0),
      }))
      .filter(size => size.name.length > 0);

    if (cleanSizes.length === 0) {
      window.alert('Please add at least one size / portion.');
      return;
    }

    const duplicateSizeNames = cleanSizes.some(
      (size, index) =>
        cleanSizes.findIndex(
          other => other.name.toLowerCase() === size.name.toLowerCase()
        ) !== index
    );

    if (duplicateSizeNames) {
      window.alert('Each size / portion must have a unique name.');
      return;
    }

    const normalizedBasePrice = Math.max(0, Number(basePrice) || 0);

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: name.trim(),
        categoryId,
        description: description.trim(),
        basePrice: normalizedBasePrice,
        station,
        available,
        sizes: cleanSizes,
      });
    } else {
      addMenuItem({
        name: name.trim(),
        categoryId,
        description: description.trim(),
        basePrice: normalizedBasePrice,
        station,
        available,
        sizes: cleanSizes,
      });
    }

    closeItemModal();
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategoryId(item.categoryId);
    setDescription(item.description || '');
    setBasePrice(item.basePrice);
    setStation(item.station);
    setAvailable(item.available);

    setSizes(
      item.sizes && item.sizes.length > 0
        ? item.sizes.map(size => ({
            name: size.name,
            price: size.price,
            costPrice: size.costPrice ?? 0,
          }))
        : [
            {
              name: 'Regular',
              price: item.basePrice,
              costPrice: Math.round(item.basePrice * 0.35),
            },
          ]
    );

    setShowAddModal(true);
  };

  const handleDeleteItem = (item: MenuItem) => {
    const confirmed = window.confirm(
      `Delete "${item.name}" from the menu?\n\nThis removes the product from the current menu catalog. Existing historical orders will remain unchanged.`
    );

    if (!confirmed) return;

    deleteMenuItem(item.id);

    if (editingItem?.id === item.id) {
      closeItemModal();
    }
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
            Add, edit and delete menu products, sizes, prices, availability and kitchen routing.
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
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Product</span>
          </button>
        </div>
      </div>

      {/* Categories and search */}
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
                  <span
                    className={`text-[10px] ${
                      isSelected ? 'text-slate-900 font-black' : 'text-slate-500'
                    }`}
                  >
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

      {/* Menu table */}
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
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-100 text-sm">
                        {item.name}
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-400 max-w-md line-clamp-2 mt-0.5">
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
                        {item.sizes?.length ? (
                          item.sizes.map((size, index) => (
                            <span
                              key={`${size.name}-${index}`}
                              className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300"
                            >
                              {size.name}: {branch.currency}{' '}
                              {size.price.toLocaleString()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            No sizes
                          </span>
                        )}
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

                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">No menu products found.</p>
                    <p className="text-[11px] mt-1">
                      Change the filter or add a new product.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveItem}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {editingItem ? 'Edit Menu Product' : 'Add New Menu Product'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure product information and individual prices for every size.
                </p>
              </div>

              <button
                type="button"
                onClick={closeItemModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">
                    Product Title *
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Crown Crust Deluxe Pizza"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Kitchen Station *
                  </label>
                  <select
                    value={station}
                    onChange={e => setStation(e.target.value as KitchenStation)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-amber-500"
                  >
                    <option value="pizza_kitchen">Pizza Kitchen</option>
                    <option value="grill_fryer">Grill & Fryer</option>
                    <option value="beverage_counter">Beverage Counter</option>
                    <option value="dessert_station">Dessert Station</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Base Price ({branch.currency}) *
                  </label>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={basePrice}
                    onChange={e =>
                      handleBasePriceChange(parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono text-base font-black text-amber-400 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Availability
                  </label>

                  <button
                    type="button"
                    onClick={() => setAvailable(prev => !prev)}
                    className={`w-full p-2.5 rounded-lg border font-black text-xs transition ${
                      available
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {available ? 'AVAILABLE FOR SALE' : 'SOLD OUT / DISABLED'}
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ingredients, serving details and culinary notes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 resize-none outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Size management */}
              <div className="border border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-950/70 p-3 flex items-center justify-between gap-3 flex-wrap border-b border-slate-700">
                  <div>
                    <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-amber-400" />
                      Sizes / Variants & Individual Pricing
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Every size can have its own selling price and cost price.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Small', 'Regular', 'Large', 'Extra Large'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => addSize(preset)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300"
                      >
                        + {preset}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={addAllStandardSizes}
                      className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-black text-amber-300"
                    >
                      Add All
                    </button>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-[1fr_140px_140px_36px] gap-2 px-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    <span>Size / Variant Name</span>
                    <span>Selling Price</span>
                    <span>Cost Price</span>
                    <span />
                  </div>

                  {sizes.map((size, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_140px_140px_36px] gap-2 items-center"
                    >
                      <input
                        required
                        value={size.name}
                        onChange={e => updateSize(index, 'name', e.target.value)}
                        placeholder="e.g. Medium"
                        className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                      />

                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-slate-500">
                          {branch.currency}
                        </span>
                        <input
                          required
                          min="0"
                          step="0.01"
                          type="number"
                          value={size.price}
                          onChange={e =>
                            updateSize(index, 'price', e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-2 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-slate-500">
                          {branch.currency}
                        </span>
                        <input
                          required
                          min="0"
                          step="0.01"
                          type="number"
                          value={size.costPrice}
                          onChange={e =>
                            updateSize(index, 'costPrice', e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-2 text-xs font-mono text-slate-300 outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        disabled={sizes.length === 1}
                        title={
                          sizes.length === 1
                            ? 'At least one size is required'
                            : 'Remove size'
                        }
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addSize()}
                    className="w-full mt-2 py-2 rounded-lg border border-dashed border-slate-600 hover:border-amber-500 text-slate-400 hover:text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Custom Size / Variant
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3">
              {editingItem ? (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItem)}
                  className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Product
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateCategory}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                Add Menu Category
              </h3>

              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Category Name *
                </label>
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
                <label className="block text-slate-400 font-semibold mb-1">
                  Icon / Emoji
                </label>
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
