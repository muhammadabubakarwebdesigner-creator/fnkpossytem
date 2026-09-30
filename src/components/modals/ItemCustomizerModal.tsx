import React, { useState } from 'react';
import { MenuItem, MenuItemSize, Modifier, OrderItem } from '../../types';
import { usePOS } from '../../context/POSContext';
import { X, Plus, Minus, Check } from 'lucide-react';

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (orderItem: OrderItem) => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const { branch } = usePOS();

  if (!item) return null;

  // Selected size defaults to medium or first available size
  const [selectedSize, setSelectedSize] = useState<MenuItemSize>(
    item.sizes.length > 1 ? item.sizes[1] || item.sizes[0] : item.sizes[0]
  );
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Toggle modifier
  const toggleModifier = (mod: Modifier) => {
    setSelectedModifiers(prev => {
      const exists = prev.some(m => m.id === mod.id);
      if (exists) {
        return prev.filter(m => m.id !== mod.id);
      } else {
        return [...prev, mod];
      }
    });
  };

  // Calculate unit price and total price
  const basePrice = selectedSize ? selectedSize.price : item.basePrice;
  const modifiersPrice = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  const unitPrice = basePrice + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const orderItem: OrderItem = {
      id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      menuItemId: item.id,
      name: item.name,
      size: selectedSize ? selectedSize.name : undefined,
      unitPrice,
      quantity,
      selectedModifiers,
      specialInstructions: specialInstructions.trim() || undefined,
      station: item.station,
      totalPrice,
      isSentToKitchen: false,
    };
    onAddToCart(orderItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-black text-slate-100">{item.name}</h3>
            {item.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customization Options */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Size Selection */}
          {item.sizes && item.sizes.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Choose Size / Portion
              </label>
              <div className="grid grid-cols-3 gap-2">
                {item.sizes.map(size => {
                  const isSelected = selectedSize?.name === size.name;
                  return (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">{size.name}</div>
                      <div className="text-xs font-mono mt-1 text-amber-400 font-black">
                        {branch.currency} {size.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {item.modifierGroups && item.modifierGroups.length > 0 && (
            <div className="space-y-4">
              {item.modifierGroups.map(group => (
                <div key={group.id}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {group.name}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map(mod => {
                      const isSelected = selectedModifiers.some(m => m.id === mod.id);
                      return (
                        <button
                          key={mod.id}
                          onClick={() => toggleModifier(mod)}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? 'bg-amber-500 border-amber-500 text-slate-950'
                                  : 'border-slate-600'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{mod.name}</span>
                          </div>
                          {mod.price > 0 && (
                            <span className="text-[10px] font-mono text-amber-400 shrink-0 ml-1">
                              +{mod.price}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Kitchen Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Special Kitchen Instructions
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra Crispy Crust, Less Spicy, No Mayo..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
            />
            {/* Quick quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Extra Crispy', 'Less Spicy', 'Extra Spicy', 'Well Done', 'No Cut / Uncut'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setSpecialInstructions(prev => (prev ? `${prev}, ${chip}` : chip))
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium border border-slate-700/60"
                >
                  +{chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: Quantity & Confirm Add */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Qty:</span>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-slate-800 text-slate-300 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-bold font-mono text-slate-100">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-slate-800 text-slate-300 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">Total</div>
              <div className="text-base font-black text-amber-400 font-mono">
                {branch.currency} {totalPrice.toLocaleString()}
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
