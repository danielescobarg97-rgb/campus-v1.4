import React, { useState } from 'react';
import { Product, KitchenStation } from '../../types';
import { ProductImage } from '../../components/ProductImage';
import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  Plus,
  Utensils,
  Clock,
  DollarSign,
  Package,
  Layers,
  Image,
} from 'lucide-react';

interface ProductEditModalProps {
  product: Product | null; // null if creating a new product
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product | Omit<Product, 'id' | 'createdAt'>) => void;
  onDelete?: (productId: string) => void;
}

const CATEGORIES = [
  'Menú del Día',
  'Comida Rápida',
  'Cafetería',
  'Snacks & Típicos',
  'Repostería',
  'Bebidas Frías',
  'Desayunos & Bowls',
];

const STATIONS: { id: KitchenStation; label: string }[] = [
  { id: 'plancha_cocina', label: 'Plancha / Cocina Caliente' },
  { id: 'bebidas', label: 'Bebidas & Cafetería' },
  { id: 'snacks_listos', label: 'Snacks & Mostrador' },
  { id: 'reposteria', label: 'Repostería & Hornos' },
];

const PRESET_IMAGES = [
  {
    name: 'Hamburguesa',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Café Latte',
    url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Empanadas',
    url: 'https://images.unsplash.com/photo-1628106235973-f655b57cad49?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Croissant',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sándwich',
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Jugo Natural',
    url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bowl Frutas',
    url: 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Almuerzo Ejecutivo',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
];

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '12000');
  const [category, setCategory] = useState(product?.category || 'Comida Rápida');
  const [station, setStation] = useState<KitchenStation>(product?.station || 'plancha_cocina');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(product?.prepTimeMinutes?.toString() || '8');
  const [stock, setStock] = useState(
    typeof product?.stock === 'number' ? product.stock.toString() : '20'
  );
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [isComboOfTheDay, setIsComboOfTheDay] = useState(product?.isComboOfTheDay ?? false);
  const [comboDiscountPrice, setComboDiscountPrice] = useState(
    product?.comboDiscountPrice?.toString() || ''
  );
  const [imageUrl, setImageUrl] = useState(
    product?.imageUrl || PRESET_IMAGES[0].url
  );

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre del producto es obligatorio');
      return;
    }

    const numericPrice = parseInt(price, 10) || 0;
    const numericPrepTime = parseInt(prepTimeMinutes, 10) || 5;
    const numericStock = stock.trim() === '' ? undefined : parseInt(stock, 10);
    const numericDiscount = comboDiscountPrice.trim() ? parseInt(comboDiscountPrice, 10) : undefined;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      category,
      station,
      prepTimeMinutes: numericPrepTime,
      stock: numericStock,
      isAvailable: numericStock !== undefined ? numericStock > 0 && isAvailable : isAvailable,
      isComboOfTheDay,
      comboDiscountPrice: numericDiscount,
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      modifierGroups: product?.modifierGroups,
    };

    if (isEditing && product) {
      onSave({
        ...product,
        ...payload,
      });
    } else {
      onSave(payload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!product || !onDelete) return;
    if (confirmDelete) {
      onDelete(product.id);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600 rounded-xl">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none">
                {isEditing ? 'Editar Plato o Producto' : 'Crear Nuevo Plato / Producto'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ajustes de catálogo, stock numérico y estación de cocina
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Nombre del Plato / Producto *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Sándwich de Pavo o Capuchino"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-slate-800 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Descripción e Ingredientes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla los ingredientes y características del producto..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800"
            />
          </div>

          {/* Price, Stock and Prep Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-orange-600" /> Precio (COP)
              </label>
              <input
                type="number"
                required
                min={0}
                step={100}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-blue-600" /> Stock Finito
              </label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="20 (o vacío)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Prep (Min)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Station & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" /> Estación de Cocina KDS
              </label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value as KitchenStation)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
              >
                {STATIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Disponibilidad en mostrador</label>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAvailable(true)}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all ${
                    isAvailable
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  ✓ Disponible
                </button>
                <button
                  type="button"
                  onClick={() => setIsAvailable(false)}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all ${
                    !isAvailable
                      ? 'bg-red-50 border-red-500 text-red-800 ring-1 ring-red-500'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  ✕ Agotado
                </button>
              </div>
            </div>
          </div>

          {/* Menú del Día / Combo Highlight toggle */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-950 block">
                  ¿Destacar en el Carrusel del "Menú del Día"?
                </span>
                <span className="text-[11px] text-amber-800">
                  Aparecerá como banner interactivo especial en la vista de estudiantes
                </span>
              </div>
              <input
                type="checkbox"
                checked={isComboOfTheDay}
                onChange={(e) => setIsComboOfTheDay(e.target.checked)}
                className="w-5 h-5 rounded text-orange-600 accent-orange-600 cursor-pointer"
              />
            </div>

            {isComboOfTheDay && (
              <div className="pt-2 border-t border-amber-200 flex items-center gap-3">
                <label className="font-bold text-amber-900 shrink-0">Precio original tachado:</label>
                <input
                  type="number"
                  value={comboDiscountPrice}
                  onChange={(e) => setComboDiscountPrice(e.target.value)}
                  placeholder="Ej. 19500"
                  className="w-36 px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl font-mono text-xs"
                />
              </div>
            )}
          </div>

          {/* Image URL & Preset Thumbnails */}
          <div className="space-y-2 pt-1">
            <label className="font-bold text-slate-700 block flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-slate-500" /> Imagen del Producto
            </label>
            <div className="flex gap-3 items-center">
              <ProductImage
                src={imageUrl}
                alt={name || 'Vista previa'}
                fallbackCategory={category}
                className="w-14 h-14 rounded-xl shrink-0"
              />
              <div className="flex-1 min-w-0">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Si la URL falla o está vacía, se mostrará el placeholder SVG institucional automáticamente.
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">
                Fotos Rápidas Recomendadas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.name}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                      imageUrl === img.url
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {img.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Delete Option if editing */}
          {isEditing && onDelete && (
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDelete}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  confirmDelete
                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {confirmDelete
                    ? '¿Estás seguro? Haz clic de nuevo para eliminar'
                    : 'Eliminar este producto del menú'}
                </span>
              </button>
            </div>
          )}

          {/* Submit and Save Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
