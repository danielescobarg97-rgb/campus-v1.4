import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeOrders,
  subscribeProducts,
  updateOrderStatus,
  updateProduct,
  createProduct,
  deleteProduct,
  resetCatalogAndOrders,
  getStoredLocations,
} from '../../services/store';
import { Order, OrderStatus, Product, KitchenStation } from '../../types';
import { playOrderChime, playReadyChime } from '../../utils/audio';
import { StaffQRScannerModal } from './StaffQRScannerModal';
import { FinanceDashboard } from './FinanceDashboard';
import { BatchPreparationPanel } from './BatchPreparationPanel';
import { ProductEditModal } from './ProductEditModal';
import { ProductImage } from '../../components/ProductImage';
import {
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  DollarSign,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  RotateCcw,
  Plus,
  Search,
  Check,
  CheckSquare,
  Square,
  ArrowRight,
  ArrowLeft,
  X,
  Sun,
  Moon,
  LogOut,
  Pencil,
  Trash2,
  AlertTriangle,
  QrCode,
  MapPin,
  Calendar,
  Layers,
  Users,
  Lock,
} from 'lucide-react';

interface CafeteriaAppProps {
  onLogout?: () => void;
}

const STATIONS: { id: KitchenStation; label: string }[] = [
  { id: 'plancha_cocina', label: 'Plancha / Cocina Caliente' },
  { id: 'bebidas', label: 'Estación de Bebidas & Café' },
  { id: 'snacks_listos', label: 'Snacks & Mostrador' },
  { id: 'reposteria', label: 'Repostería & Hojaldres' },
];

export const CafeteriaApp: React.FC<CafeteriaAppProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'kanban' | 'menu' | 'finance' | 'history'>('kanban');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc-central');

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // High contrast theme state for kitchen glare readability
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('campusbite_kds_theme') === 'dark';
  });

  // Checklist for order items
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Menu editing states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const handleExitAndLock = () => {
    sessionStorage.removeItem('campusbite_admin_auth');
    if (onLogout) {
      onLogout();
    } else {
      navigate('/');
    }
  };

  // Subscriptions
  useEffect(() => {
    const unsubOrders = subscribeOrders((ords) => {
      setOrders(ords);
    });

    const unsubProducts = subscribeProducts((prods) => {
      setProducts(prods);
    });

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  const toggleHighContrast = () => {
    const next = !isHighContrast;
    setIsHighContrast(next);
    localStorage.setItem('campusbite_kds_theme', next ? 'dark' : 'light');
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    if (newStatus === 'listo' && soundEnabled) {
      playReadyChime();
    } else if (newStatus === 'preparando' && soundEnabled) {
      playOrderChime();
    }
  };

  const toggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter orders by location
  const locationOrders = orders.filter((o) => o.locationId === selectedLocationId);

  // Kanban columns
  const receivedOrders = locationOrders.filter((o) => o.status === 'recibido');
  const preparingOrders = locationOrders.filter((o) => o.status === 'preparando');
  const readyOrders = locationOrders.filter((o) => o.status === 'listo');
  const deliveredOrders = locationOrders.filter((o) => o.status === 'entregado');

  const locations = getStoredLocations();

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isHighContrast ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* KDS Header */}
      <header
        className={`sticky top-0 z-40 border-b shadow-sm ${
          isHighContrast
            ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md'
            : 'bg-white/95 border-slate-200 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg leading-tight">Cocina KDS • CampusBite</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30">
                  Pantalla Cocina
                </span>
              </div>
              {/* Location Switcher */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className={`bg-transparent font-bold focus:outline-none cursor-pointer ${
                    isHighContrast ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/20 p-1 rounded-2xl border border-slate-700/30">
            <button
              type="button"
              onClick={() => setActiveTab('kanban')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'kanban'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tablero Kanban ({locationOrders.filter((o) => o.status !== 'entregado').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Menú & Stock
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'finance'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Finanzas
            </button>
          </div>

          {/* Controls: Scanner, Sound, Contrast, Logout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Despachar QR</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title={soundEnabled ? 'Sonido activado' : 'Silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleHighContrast}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Alternar tema alto contraste"
            >
              {isHighContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleExitAndLock}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 text-xs font-bold transition-all shadow-sm"
              title="Cerrar sesión de personal y bloquear acceso"
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Bloquear KDS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'kanban' && (
          <div className="space-y-6">
            {/* Feature 5: Kitchen Batching Summary Panel */}
            <BatchPreparationPanel orders={locationOrders} products={products} />

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {/* Column 1: Recibidos */}
              <div
                className={`rounded-2xl border p-4 space-y-3 ${
                  isHighContrast
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <h3 className="font-bold text-sm">1. Recibidos en Cola</h3>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    {receivedOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {receivedOrders.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-8">
                      No hay pedidos nuevos en cola.
                    </p>
                  ) : (
                    receivedOrders.map((ord) => renderOrderCard(ord, 'preparando'))
                  )}
                </div>
              </div>

              {/* Column 2: Preparando */}
              <div
                className={`rounded-2xl border p-4 space-y-3 ${
                  isHighContrast
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                    <h3 className="font-bold text-sm">2. En Preparación</h3>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                    {preparingOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {preparingOrders.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-8">
                      Ningún pedido se está preparando ahora.
                    </p>
                  ) : (
                    preparingOrders.map((ord) => renderOrderCard(ord, 'listo'))
                  )}
                </div>
              </div>

              {/* Column 3: Listos para recoger */}
              <div
                className={`rounded-2xl border p-4 space-y-3 ${
                  isHighContrast
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-sm">3. Listos en Mostrador</h3>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {readyOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {readyOrders.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-8">
                      No hay pedidos pendientes de entrega.
                    </p>
                  ) : (
                    readyOrders.map((ord) => renderOrderCard(ord, 'entregado'))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Menu & Stock Management */}
        {activeTab === 'menu' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Inventario y Catálogo de Productos</h2>
                <p className="text-xs text-slate-400">
                  Ajusta precios, activa/desactiva disponibilidad y gestiona el stock numérico
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreatingProduct(true);
                  }}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nuevo Plato / Bebida</span>
                </button>

                <button
                  type="button"
                  onClick={resetCatalogAndOrders}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Demo</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between ${
                    isHighContrast ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <ProductImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        fallbackCategory={prod.category}
                        className="w-16 h-16 rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase text-orange-500 truncate">
                            {prod.category}
                          </span>
                          {prod.isComboOfTheDay && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                              Combo Día
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm leading-snug line-clamp-2">{prod.name}</h4>
                        <span className="text-xs font-black text-slate-400 block mt-0.5">
                          ${prod.price.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Stock and Availability controls */}
                    <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Stock Disponible</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const newStock = Math.max(0, (prod.stock || 0) - 1);
                              updateProduct({
                                ...prod,
                                stock: newStock,
                                isAvailable: newStock > 0,
                              });
                            }}
                            className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center font-bold hover:bg-slate-700"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold w-6 text-center">
                            {typeof prod.stock === 'number' ? prod.stock : '∞'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newStock = (prod.stock || 0) + 1;
                              updateProduct({
                                ...prod,
                                stock: newStock,
                                isAvailable: true,
                              });
                            }}
                            className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center font-bold hover:bg-slate-700"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Estado</span>
                        <button
                          type="button"
                          onClick={() => updateProduct({ ...prod, isAvailable: !prod.isAvailable })}
                          className={`mt-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            prod.isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {prod.isAvailable ? 'Disponible' : 'Agotado'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Edit and Delete Actions */}
                  <div className="pt-2.5 border-t border-slate-700/40 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(prod);
                        setIsCreatingProduct(false);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar Producto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar "${prod.name}" del menú?`)) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Finance Dashboard */}
        {activeTab === 'finance' && (
          <FinanceDashboard
            orders={orders}
            products={products}
            selectedLocationId={selectedLocationId}
          />
        )}
      </main>

      {/* Staff QR Scanner Modal */}
      {isQRScannerOpen && (
        <StaffQRScannerModal
          orders={locationOrders}
          isOpen={true}
          onClose={() => setIsQRScannerOpen(false)}
        />
      )}

      {/* Product Edit / Creation Modal */}
      {(editingProduct !== null || isCreatingProduct) && (
        <ProductEditModal
          product={editingProduct}
          isOpen={true}
          onClose={() => {
            setEditingProduct(null);
            setIsCreatingProduct(false);
          }}
          onSave={(saved) => {
            if ('id' in saved) {
              updateProduct(saved as Product);
            } else {
              createProduct(saved);
            }
          }}
          onDelete={(id) => {
            deleteProduct(id);
          }}
        />
      )}
    </div>
  );

  // Helper render function for each Kanban ticket
  function renderOrderCard(order: Order, nextStatus: OrderStatus) {
    const isScheduled = order.pickupType === 'programado';

    return (
      <div
        key={order.id}
        className={`p-3.5 rounded-2xl border transition-all ${
          isHighContrast
            ? 'bg-slate-950 border-slate-700/80 shadow-md'
            : 'bg-slate-50 border-slate-200/90 shadow-xs'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-black text-orange-500">
              #{order.pickupCode}
            </span>
            <span className="text-xs font-bold truncate max-w-[120px]">
              {order.studentName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {order.isPaid ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                PAGADO
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                COBRAR
              </span>
            )}
          </div>
        </div>

        {/* Scheduled or Group order tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {isScheduled && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Recojo: {order.scheduledTime}
            </span>
          )}
          {order.isGroupOrder && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Grupal
            </span>
          )}
        </div>

        {/* Items checklist */}
        <div className="my-2.5 space-y-1.5 text-xs">
          {order.items.map((item, idx) => {
            const key = `${order.id}-${idx}`;
            const isChecked = !!checkedItems[key];

            return (
              <div
                key={idx}
                onClick={() => toggleItemCheck(order.id, idx)}
                className={`p-1.5 rounded-lg flex items-start justify-between gap-2 cursor-pointer select-none transition-colors ${
                  isChecked
                    ? 'opacity-40 line-through bg-transparent'
                    : isHighContrast
                    ? 'bg-slate-900/60 hover:bg-slate-900'
                    : 'bg-white hover:bg-slate-100'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold">
                      {item.quantity}x {item.name}
                    </span>
                    {item.assignedToFriend && (
                      <span className="text-[10px] text-purple-400 block font-semibold">
                        👤 {item.assignedToFriend}
                      </span>
                    )}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="text-[10px] text-amber-400">
                        {item.selectedModifiers.map((m, mIdx) => (
                          <span key={mIdx} className="block">
                            • {m.groupName}: {m.optionName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notes */}
        {order.notes && (
          <p className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mb-2">
            ⚠️ <em>"{order.notes}"</em>
          </p>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleStatusChange(order.id, nextStatus)}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            nextStatus === 'preparando'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : nextStatus === 'listo'
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <span>
            {nextStatus === 'preparando'
              ? 'Comenzar a Preparar →'
              : nextStatus === 'listo'
              ? '¡Marcar Como Listo! 🔔'
              : 'Completar Entrega ✓'}
          </span>
        </button>
      </div>
    );
  }
};
