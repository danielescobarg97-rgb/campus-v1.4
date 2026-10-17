import React, { useState } from 'react';
import { Product, SelectedModifier, OrderItem } from '../../types';
import { X, Plus, Minus, Check, Clock, AlertTriangle, Users } from 'lucide-react';

interface ProductCustomizerModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
  isGroupOrderActive: boolean;
}

export const ProductCustomizerModal: React.FC<ProductCustomizerModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isGroupOrderActive,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [friendName, setFriendName] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, { optionId: string; optionName: string; priceDelta: number }>>(() => {
    const initial: Record<string, { optionId: string; optionName: string; priceDelta: number }> = {};
    product.modifierGroups?.forEach((group) => {
      if (group.required && group.options.length > 0) {
        initial[group.id] = {
          optionId: group.options[0].id,
          optionName: group.options[0].name,
          priceDelta: group.options[0].priceDelta,
        };
      }
    });
    return initial;
  });

  if (!isOpen) return null;

  const maxStock = typeof product.stock === 'number' ? product.stock : 99;

  // Calculate dynamic unit price
  let unitPrice = product.price;
  Object.values(selectedModifiers).forEach((m) => {
    unitPrice += m.priceDelta;
  });

  const totalPrice = unitPrice * quantity;

  const handleOptionSelect = (groupId: string, optionId: string, optionName: string, priceDelta: number) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [groupId]: { optionId, optionName, priceDelta },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedModifiers: SelectedModifier[] = Object.entries(selectedModifiers).map(([groupId, opt]) => {
      const group = product.modifierGroups?.find((g) => g.id === groupId);
      return {
        groupId,
        groupName: group?.name || '',
        optionId: opt.optionId,
        optionName: opt.optionName,
        priceDelta: opt.priceDelta,
      };
    });

    onAddToCart({
      productId: product.id,
      name: product.name,
      price: unitPrice,
      quantity,
      imageUrl: product.imageUrl,
      selectedModifiers: formattedModifiers.length > 0 ? formattedModifiers : undefined,
      assignedToFriend: friendName.trim() ? friendName.trim() : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Header with image */}
        <div className="relative h-48 sm:h-52 w-full bg-slate-900 shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-600 text-white mb-2 shadow-sm">
              {product.category}
            </span>
            <h2 className="text-xl font-bold leading-tight drop-shadow-sm">{product.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-200">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                ~{product.prepTimeMinutes} min de preparación
              </span>
              {typeof product.stock === 'number' && (
                <span className="flex items-center gap-1 font-semibold text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Quedan {product.stock} disponibles
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable modifiers content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed pt-1">{product.description}</p>

          {/* Modifier Groups */}
          {product.modifierGroups && product.modifierGroups.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Personaliza tu pedido
              </h3>

              {product.modifierGroups.map((group) => (
                <div key={group.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-bold text-slate-900">{group.name}</span>
                    {group.required ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                        Obligatorio
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-200 text-slate-600">
                        Opcional
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.options.map((option) => {
                      const isSelected = selectedModifiers[group.id]?.optionId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleOptionSelect(group.id, option.id, option.name, option.priceDelta)}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-left border text-sm transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-medium shadow-xs ring-1 ring-orange-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{option.name}</span>
                          </span>
                          {option.priceDelta > 0 && (
                            <span className="text-xs font-bold text-orange-700 shrink-0">
                              +${option.priceDelta.toLocaleString('es-CO')}
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

          {/* Compañero de Fila / Group Ordering Tag */}
          <div className="pt-4 bg-purple-50/60 p-4 rounded-2xl border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-black text-purple-900 uppercase tracking-wide">
                <Users className="w-4 h-4 text-purple-600" />
                Compañero de Fila: ¿Para quién es este ítem?
              </label>
              <span className="text-[10px] text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                Opcional
              </span>
            </div>
            <p className="text-[11px] text-purple-800/80">
              Asigna este plato con un nombre para identificarlo al repartir en la mesa o biblioteca
            </p>

            {/* Quick Friend Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Para Mí', 'Juan', 'Sofía', 'Camilo', 'Mateo', 'Valentina'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFriendName(preset === 'Para Mí' ? '' : `Para ${preset}`)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    (preset === 'Para Mí' && !friendName) || friendName === `Para ${preset}`
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="O escribe: Ej. Para Andrés (Ingeniería)"
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-800"
            />
          </div>

          {/* Quantity Controls */}
          <div className="pt-4 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Cantidad</span>
            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-xl bg-white text-slate-700 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-slate-900 text-base">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                disabled={quantity >= maxStock}
                className="w-8 h-8 rounded-xl bg-white text-slate-700 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Price and Add Button */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <div>
            <span className="block text-xs text-slate-500 font-medium">Total ítem</span>
            <span className="text-xl font-black text-slate-900">
              ${totalPrice.toLocaleString('es-CO')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={maxStock <= 0}
            className="flex-1 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <span>Agregar al Carrito</span>
          </button>
        </div>
      </div>
    </div>
  );
};
