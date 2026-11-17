import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeProducts,
  subscribeOrders,
  subscribeWallet,
  subscribeLocation,
  setActiveLocation,
  createOrder,
  calculateDynamicPrepTime,
  debitWallet,
  getCachedActiveOrder,
  getStoredLocations,
  logoutStudent,
  subscribeCurrentStudent,
  getCurrentStudent,
} from '../../services/store';
import { Product, OrderItem, Order, StudentWallet, CampusLocation, PaymentMethod, StudentUser } from '../../types';
import { LiveOrderTracker } from './LiveOrderTracker';
import { OrderQRCodeModal } from './OrderQRCodeModal';
import { ProductCustomizerModal } from './ProductCustomizerModal';
import { WalletModal } from './WalletModal';
import { CombosCarousel } from './CombosCarousel';
import { ProductImage } from '../../components/ProductImage';
import { playOrderChime } from '../../utils/audio';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  Clock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  History,
  QrCode,
  MapPin,
  Wallet,
  Users,
  Calendar,
  Zap,
  WifiOff,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

interface StudentAppProps {
  onLogout?: () => void;
}

export const StudentApp: React.FC<StudentAppProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  // Current logged in student
  const [currentStudent, setCurrentStudentState] = useState<StudentUser | null>(() => getCurrentStudent());

  // App States
  const [products, setProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<StudentWallet>({ balance: 45000, transactions: [] });
  const [activeLocation, setLocationState] = useState<CampusLocation>(getStoredLocations()[0]);
  const [loading, setLoading] = useState(true);

  // Filters & Cart
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals & Active state
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [quickQRModalOrder, setQuickQRModalOrder] = useState<Order | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [orderConfirmedNotice, setOrderConfirmedNotice] = useState<string | null>(null);

  // Offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Scheduling & Group ordering
  const [pickupType, setPickupType] = useState<'inmediato' | 'programado'>('inmediato');
  const [scheduledTime, setScheduledTime] = useState<string>('10:00 AM');
  const [isGroupOrderActive, setIsGroupOrderActive] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('campus_wallet');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Profile
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('campusbite_student_name') || 'Valentina Torres';
  });
  const [studentId, setStudentId] = useState(() => {
    return localStorage.getItem('campusbite_student_id') || 'EST-2024-491';
  });

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscriptions
  useEffect(() => {
    const unsubProducts = subscribeProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });

    const unsubOrders = subscribeOrders((ords) => {
      setAllOrders(ords);
    });

    const unsubWallet = subscribeWallet((w) => {
      setWallet(w);
    });

    const unsubLoc = subscribeLocation((loc) => {
      setLocationState(loc);
    });

    const unsubStudent = subscribeCurrentStudent((user) => {
      setCurrentStudentState(user);
      if (user) {
        setStudentName(user.name);
        setStudentId(user.id);
      }
    });

    // Check cached offline active order
    const cached = getCachedActiveOrder();
    if (cached && cached.status !== 'entregado' && cached.status !== 'cancelado') {
      setActiveOrderId(cached.id);
    }

    return () => {
      unsubProducts();
      unsubOrders();
      unsubWallet();
      unsubLoc();
      unsubStudent();
    };
  }, []);

  const handleStudentLogout = () => {
    logoutStudent();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/');
    }
  };

  // Filter student orders
  const studentOrders = allOrders.filter(
    (o) => o.studentId === studentId || o.studentName.toLowerCase() === studentName.toLowerCase()
  );

  // Find currently active order (prioritizing non-delivered)
  const currentActiveOrder =
    (activeOrderId && allOrders.find((o) => o.id === activeOrderId)) ||
    studentOrders.find((o) => o.status !== 'entregado' && o.status !== 'cancelado') ||
    getCachedActiveOrder();

  // Dynamic queue calculation
  const dynamicPrep = calculateDynamicPrepTime(
    cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
    allOrders,
    activeLocation.id
  );

  // Categories
  const categories = ['Todos', 'Menú del Día', 'Comida Rápida', 'Cafetería', 'Snacks & Típicos', 'Repostería', 'Bebidas Frías', 'Desayunos & Bowls'];

  // Filtered products by location, category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Highlighted Combos del Día (Carousel list)
  const combosOfTheDay = products.filter((p) => p.isComboOfTheDay && p.isAvailable);

  // Cart total calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Helper to assign or edit friend tag directly in cart
  const handleAssignFriendToCartItem = (index: number, name: string) => {
    setCart((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        assignedToFriend: name.trim() ? name.trim() : undefined,
      };
      return copy;
    });
    if (name.trim()) {
      setIsGroupOrderActive(true);
    }
  };

  // Add item to cart
  const handleAddToCart = (item: OrderItem) => {
    setCart((prev) => {
      // If it has modifiers or assigned to a friend, add as distinct item
      if (item.selectedModifiers?.length || item.assignedToFriend) {
        return [...prev, item];
      }
      const existingIdx = prev.findIndex(
        (i) => i.productId === item.productId && !i.selectedModifiers?.length && !i.assignedToFriend
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += item.quantity;
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setCart((prev) => {
        const copy = [...prev];
        copy[index].quantity = newQty;
        return copy;
      });
    }
  };

  // 1-Click Upsell juice or coffee addition
  const handleAddUpsell = () => {
    const upsellProduct = products.find((p) => p.id === 'prod-jugo-natural') || products.find((p) => p.category.includes('Bebidas'));
    if (!upsellProduct) return;

    handleAddToCart({
      productId: upsellProduct.id,
      name: `${upsellProduct.name} (Combo Promocional)`,
      price: 2500, // Special upsell price
      quantity: 1,
      imageUrl: upsellProduct.imageUrl,
    });
  };

  // Submit Order
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Check stock for finite items
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && typeof prod.stock === 'number' && prod.stock < item.quantity) {
        alert(`Lo sentimos, solo quedan ${prod.stock} unidades de ${prod.name}.`);
        return;
      }
    }

    // Check wallet balance if paying with CampusPay
    if (paymentMethod === 'campus_wallet' && wallet.balance < cartSubtotal) {
      alert(`Saldo insuficiente en CampusPay ($${wallet.balance.toLocaleString('es-CO')}). Por favor recarga o paga en mostrador.`);
      setIsWalletOpen(true);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const isPaid = paymentMethod === 'campus_wallet';
      if (isPaid) {
        debitWallet(cartSubtotal, 'Procesando');
      }

      const newOrder = createOrder({
        studentName,
        studentId,
        notes: orderNotes.trim() ? orderNotes : undefined,
        totalPrice: cartSubtotal,
        status: 'recibido',
        locationId: activeLocation.id,
        locationName: activeLocation.name,
        pickupType,
        scheduledTime: pickupType === 'programado' ? scheduledTime : undefined,
        paymentMethod,
        isPaid,
        isGroupOrder: isGroupOrderActive,
        items: cart,
      });

      playOrderChime();
      setActiveOrderId(newOrder.id);
      setCart([]);
      setIsCartOpen(false);
      setOrderNotes('');
      setIsSubmitting(false);

      setOrderConfirmedNotice(`¡Pedido #${newOrder.pickupCode} enviado a cocina!`);
      setTimeout(() => setOrderConfirmedNotice(null), 4000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#032244] flex flex-col font-sans">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-[#032244] text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 shrink-0 text-[#D7131A]" />
          <span>Estás sin conexión a internet. Tus pedidos y QR están disponibles en modo local offline.</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Campus Location Dropdown */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/aistudio/UNIGO_logo_50365f1d.png"
              alt="UNIGO"
              className="h-8 sm:h-9 w-auto object-contain shrink-0"
            />
            <span className="hidden sm:inline-block h-7 w-px bg-[#032244]/15 shrink-0" />
            <div className="min-w-0">
              {/* Multi-Location Switcher */}
              <div className="flex items-center gap-1 text-xs text-[#032244]/75 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#D7131A] shrink-0" />
                <select
                  value={activeLocation.id}
                  onChange={(e) => setActiveLocation(e.target.value)}
                  className="bg-transparent font-bold text-[#032244] hover:text-[#D7131A] focus:outline-none cursor-pointer py-0.5 pr-1 max-w-[175px] sm:max-w-none truncate"
                >
                  {getStoredLocations().map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.operatingHours})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Header: CampusPay Wallet, History & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* CampusPay Pill */}
            <button
              type="button"
              onClick={() => setIsWalletOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#F5F6F8] border border-slate-200 hover:border-[#D7131A] text-[#032244] transition-all shadow-xs active:scale-95"
            >
              <Wallet className="w-4 h-4 text-[#D7131A]" />
              <div className="text-left text-xs">
                <span className="text-[10px] block leading-none text-[#032244]/65 font-semibold">CampusPay</span>
                <span className="font-black text-[#032244] leading-none tabular-nums">
                  ${wallet.balance.toLocaleString('es-CO')}
                </span>
              </div>
            </button>

            {/* Order History */}
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="p-2 text-[#032244]/75 hover:text-[#032244] hover:bg-[#F5F6F8] rounded-xl transition-colors relative"
              title="Mis pedidos anteriores"
            >
              <History className="w-5 h-5" />
              {studentOrders.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D7131A] ring-2 ring-white" />
              )}
            </button>

            {/* Student Profile & Secure Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right text-xs">
                <span className="font-bold text-[#032244] block leading-tight truncate max-w-[130px]">
                  {currentStudent?.name || studentName}
                </span>
                <span className="text-[10px] text-[#032244]/60 font-medium block leading-tight font-mono">
                  {currentStudent?.id || studentId}
                </span>
              </div>

              <button
                type="button"
                onClick={handleStudentLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#D7131A] hover:bg-[#D7131A]/10 border border-[#D7131A]/25 transition-colors shadow-xs active:scale-95"
                title="Cerrar sesión de estudiante"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 flex-1 w-full">
        {/* Order confirmation toast notice */}
        {orderConfirmedNotice && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span className="font-bold text-sm">{orderConfirmedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setOrderConfirmedNotice(null)}
              className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Real-Time Live Order Tracker (If student has pending order) */}
        {currentActiveOrder && currentActiveOrder.status !== 'entregado' && (
          <LiveOrderTracker
            order={currentActiveOrder}
            onOpenQR={() => setQuickQRModalOrder(currentActiveOrder)}
          />
        )}

        {/* Location Queue Status Pill & Time Estimation Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                dynamicPrep.queueLoad === 'alta'
                  ? 'bg-[#D7131A]'
                  : dynamicPrep.queueLoad === 'moderada'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-bold text-[#032244]">
              {activeLocation.name}:
            </span>
            <span className="text-[#032244]/75">
              {dynamicPrep.queueLoad === 'alta'
                ? 'Alta demanda en cocina (+15 min)'
                : dynamicPrep.queueLoad === 'moderada'
                ? 'Demanda media en cocina'
                : 'Cocina despejada (atención rápida)'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[#032244]/70 font-medium tabular-nums">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D7131A]" />
              Tiempo estimado: <strong className="text-[#032244] font-bold">~{dynamicPrep.estimatedMinutes} min</strong>
            </span>
            <span>•</span>
            <span>{dynamicPrep.pendingOrdersCount} pedidos en cola</span>
          </div>
        </div>

        {/* Feature 6: Menú del Día & Especiales del Campus (Carousel) */}
        {combosOfTheDay.length > 0 && (
          <CombosCarousel
            combos={combosOfTheDay}
            onSelectCombo={(combo) => setCustomizingProduct(combo)}
          />
        )}

        {/* Search & Category Filter Pills */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#032244]/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empanada, café, hamburguesa, croissant, jugo..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D7131A] text-sm font-medium text-[#032244] placeholder-slate-400 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#032244]/40 hover:text-[#032244]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#D7131A] text-white shadow-md shadow-[#D7131A]/20'
                      : 'bg-white text-[#032244] border border-slate-200 hover:border-[#032244]/30'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const isOutOfStock = !product.isAvailable || (typeof product.stock === 'number' && product.stock <= 0);
            const isLowStock = typeof product.stock === 'number' && product.stock > 0 && product.stock <= 4;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col group ${
                  isOutOfStock ? 'opacity-65 grayscale-20' : ''
                }`}
              >
                {/* Product Image with Fallback */}
                <div className="relative h-44 w-full bg-[#F5F6F8] overflow-hidden">
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    fallbackCategory={product.category}
                    className="w-full h-full"
                    imgClassName="group-hover:scale-105 transition-transform duration-300"
                    showFallbackLabel={true}
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#032244] backdrop-blur-xs shadow-xs">
                      {product.category}
                    </span>
                    {isLowStock && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D7131A] text-white shadow-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        ¡Quedan {product.stock}!
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#032244] text-white shadow-xs">
                        Agotado
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-xl bg-[#032244]/85 text-white text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1 z-20 tabular-nums">
                    <Clock className="w-3 h-3 text-[#D7131A]" />
                    ~{product.prepTimeMinutes} min
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3
                      title={product.name}
                      className="font-bold text-[#032244] text-base leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#D7131A] transition-colors"
                    >
                      {product.name}
                    </h3>
                    <p
                      title={product.description}
                      className="text-xs text-[#032244]/65 mt-1 line-clamp-2 min-h-[2rem] leading-relaxed"
                    >
                      {product.description}
                    </p>
                  </div>

                  {/* Price & Action Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-[#032244]/55 block font-medium">Precio</span>
                      <span className="text-lg font-black text-[#032244] tabular-nums">
                        ${product.price.toLocaleString('es-CO')}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setCustomizingProduct(product)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : product.modifierGroups?.length
                          ? 'bg-[#032244] text-white hover:bg-[#0a3466] shadow-xs'
                          : 'bg-[#D7131A] text-white hover:bg-[#b51016] shadow-md shadow-[#D7131A]/15'
                      }`}
                    >
                      {product.modifierGroups?.length ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          <span>Personalizar</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Cart Bar (When items are in cart) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom-5">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#032244] hover:bg-[#021933] text-white p-4 rounded-3xl shadow-2xl shadow-[#032244]/30 flex items-center justify-between gap-4 border border-white/10 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D7131A] text-white flex items-center justify-center font-bold text-sm shadow-md tabular-nums">
                {cartItemsCount}
              </div>
              <div className="text-left">
                <span className="text-xs text-white/70 block font-medium">
                  {isGroupOrderActive ? 'Pedido Grupal en Carrito' : 'Tu pedido actual'}
                </span>
                <span className="text-base font-black text-white tabular-nums">
                  ${cartSubtotal.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-white bg-[#D7131A] px-3.5 py-2 rounded-2xl">
              <span>Revisar y Pedir</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#032244]/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#032244] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#D7131A]" />
                <div>
                  <h3 className="font-bold text-base leading-tight">Tu Carrito de Pedido</h3>
                  <span className="text-xs text-white/70">{activeLocation.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Cart Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
              {/* Feature 1: Schedule & Grab Pickup Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#032244]/65 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#D7131A]" />
                  Momento de Recogida
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPickupType('inmediato')}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                      pickupType === 'inmediato'
                        ? 'border-[#D7131A] bg-[#D7131A]/5 text-[#032244] ring-1 ring-[#D7131A]'
                        : 'border-slate-200 text-[#032244]/75 hover:border-[#032244]/30'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-black text-[#032244] mb-0.5">
                      <Zap className="w-3.5 h-3.5 text-[#D7131A]" /> Inmediato
                    </span>
                    <span className="text-[11px] text-[#032244]/65">
                      Listo en ~{dynamicPrep.estimatedMinutes} min
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickupType('programado')}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                      pickupType === 'programado'
                        ? 'border-[#032244] bg-[#032244]/5 text-[#032244] ring-1 ring-[#032244]'
                        : 'border-slate-200 text-[#032244]/75 hover:border-[#032244]/30'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-black text-[#032244] mb-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#032244]" /> Programar
                    </span>
                    <span className="text-[11px] text-[#032244]/65">Para el receso</span>
                  </button>
                </div>

                {pickupType === 'programado' && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 text-xs">
                    <span className="font-bold text-indigo-950 block">Selecciona la hora de recogida:</span>
                    <div className="flex flex-wrap gap-2">
                      {['10:00 AM', '12:00 PM', '14:00 PM', '16:00 PM'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setScheduledTime(time)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                            scheduledTime === time
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feature 5: Group Ordering Toggle */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#032244] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#032244]" />
                    Modo "Compañero de Fila" (Pedido Grupal)
                  </span>
                  <p className="text-[11px] text-[#032244]/65">Pide por tus amigos y etiqueta cada plato</p>
                </div>
                <input
                  type="checkbox"
                  checked={isGroupOrderActive}
                  onChange={(e) => setIsGroupOrderActive(e.target.checked)}
                  className="w-5 h-5 rounded text-[#D7131A] accent-[#D7131A] cursor-pointer"
                />
              </div>

              {/* Items List */}
              <div className="pt-4 space-y-3">
                {/* Friend Account Summary if any item is assigned */}
                {cart.some((i) => i.assignedToFriend) && (
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs space-y-1.5 animate-in fade-in">
                    <span className="font-black text-purple-950 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      Cuentas Claras por Compañero de Fila:
                    </span>
                    <div className="space-y-1 pt-1">
                      {Object.entries(
                        cart.reduce<Record<string, number>>((acc, item) => {
                          const friend = item.assignedToFriend || 'Para Ti';
                          acc[friend] = (acc[friend] || 0) + item.price * item.quantity;
                          return acc;
                        }, {})
                      ).map(([friend, subtotal]) => (
                        <div key={friend} className="flex justify-between text-purple-900 font-semibold pl-1 text-[11px]">
                          <span>👤 {friend}:</span>
                          <span className="font-bold">${subtotal.toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Platos en la orden
                </span>
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        {item.assignedToFriend && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                            👤 {item.assignedToFriend}
                          </span>
                        )}
                      </div>
                      <span className="text-[#D7131A] font-bold block mt-0.5 tabular-nums">
                        ${(item.price * item.quantity).toLocaleString('es-CO')}
                      </span>
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                          {item.selectedModifiers.map((m, mIdx) => (
                            <span key={mIdx} className="block">
                              • {m.groupName}: {m.optionName} {m.priceDelta > 0 && `(+$${m.priceDelta})`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Compañero de Fila: Asignación Directa y Clara */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 bg-[#F5F6F8] p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-[#032244] uppercase flex items-center gap-1 tracking-wider">
                            <Users className="w-3 h-3 text-[#032244]" />
                            ¿Para quién es este plato?
                          </span>
                          {item.assignedToFriend ? (
                            <span className="text-[10px] font-bold text-[#032244] bg-[#032244]/10 px-2 py-0.5 rounded-md">
                              {item.assignedToFriend}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              (Para Ti)
                            </span>
                          )}
                        </div>

                        {/* Quick Chips and custom input */}
                        <div className="flex flex-wrap items-center gap-1">
                          {['Para Mí', 'Juan', 'Sofía', 'Camilo', 'Mateo'].map((friend) => {
                            const isSelected =
                              (!item.assignedToFriend && friend === 'Para Mí') ||
                              item.assignedToFriend === `Para ${friend}` ||
                              item.assignedToFriend === friend;

                            return (
                              <button
                                key={friend}
                                type="button"
                                onClick={() =>
                                  handleAssignFriendToCartItem(
                                    idx,
                                    friend === 'Para Mí' ? '' : `Para ${friend}`
                                  )
                                }
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  isSelected
                                    ? 'bg-[#032244] text-white shadow-xs'
                                    : 'bg-white text-[#032244] border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {friend}
                              </button>
                            );
                          })}

                          <input
                            type="text"
                            value={item.assignedToFriend || ''}
                            onChange={(e) => handleAssignFriendToCartItem(idx, e.target.value)}
                            placeholder="O escribe nombre..."
                            className="px-2 py-1 text-[10px] bg-white border border-slate-200 rounded-lg flex-1 min-w-[90px] font-semibold text-[#032244] focus:outline-none focus:ring-1 focus:ring-[#D7131A]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(idx, item.quantity - 1)}
                          className="text-[#032244]/60 hover:text-[#032244] p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-[#032244] w-4 text-center tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(idx, item.quantity + 1)}
                          className="text-[#032244]/60 hover:text-[#032244] p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(idx, 0)}
                        className="text-slate-400 hover:text-[#D7131A] p-1 text-[10px] flex items-center gap-0.5 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature 6: Smart 1-Click Upsell */}
              <div className="pt-4 bg-[#032244]/[0.04] p-3.5 rounded-2xl border border-[#032244]/15 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#032244] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D7131A]" />
                    ¿Añadir Jugo de Fruta Natural (+20% OFF)?
                  </span>
                  <span className="text-xs font-black text-[#D7131A] tabular-nums">+$2.500</span>
                </div>
                <p className="text-[11px] text-[#032244]/70">
                  Combo especial con tu comida. Agrégalo con 1 clic.
                </p>
                <button
                  type="button"
                  onClick={handleAddUpsell}
                  className="w-full py-2 bg-[#032244] hover:bg-[#0a3466] text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  + Agregar Bebida Promo al Carrito
                </button>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#032244]/65 block">
                  Método de Pago
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('campus_wallet')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'campus_wallet'
                        ? 'border-[#D7131A] bg-[#D7131A]/5 text-[#032244] ring-1 ring-[#D7131A] font-bold'
                        : 'border-slate-200 text-[#032244]/75'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 mb-1">
                      <Wallet className="w-4 h-4 text-[#D7131A]" /> CampusPay (1-Click)
                    </span>
                    <span className="text-[11px] text-[#032244]/65 font-normal tabular-nums">
                      Saldo: ${wallet.balance.toLocaleString('es-CO')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mostrador_efectivo')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'mostrador_efectivo'
                        ? 'border-[#032244] bg-[#032244]/5 text-[#032244] ring-1 ring-[#032244] font-bold'
                        : 'border-slate-200 text-[#032244]/75'
                    }`}
                  >
                    <span className="block mb-1">En Mostrador</span>
                    <span className="text-[11px] text-[#032244]/65 font-normal">Pagas al retirar</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="pt-4 space-y-1.5">
                <label className="text-xs font-bold text-[#032244] block">
                  Notas para la cocina (Opcional)
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ej. Salsa tártara aparte, cubiertos extra..."
                  className="w-full px-3 py-2 text-xs bg-[#F5F6F8] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D7131A] text-[#032244]"
                />
              </div>
            </div>

            {/* Footer Checkout */}
            <div className="p-4 sm:p-5 bg-[#F5F6F8] border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
              <div>
                <span className="block text-xs text-[#032244]/60 font-medium">Total a pagar</span>
                <span className="text-xl font-black text-[#032244] tabular-nums">
                  ${cartSubtotal.toLocaleString('es-CO')}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCheckout}
                className="flex-1 py-3.5 px-6 bg-[#D7131A] hover:bg-[#b51016] active:scale-[0.98] text-white font-bold text-sm rounded-2xl shadow-md shadow-[#D7131A]/20 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
              >
                {isSubmitting ? (
                  <span>Enviando comanda...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirmar y Enviar Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Customizer Modal */}
      {customizingProduct && (
        <ProductCustomizerModal
          product={customizingProduct}
          isOpen={true}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={handleAddToCart}
          isGroupOrderActive={isGroupOrderActive}
        />
      )}

      {/* CampusPay Wallet Modal */}
      {isWalletOpen && (
        <WalletModal
          isOpen={true}
          onClose={() => setIsWalletOpen(false)}
          wallet={wallet}
          studentName={studentName}
          studentId={studentId}
        />
      )}

      {/* QR Pickup Modal */}
      {quickQRModalOrder && (
        <OrderQRCodeModal
          order={quickQRModalOrder}
          isOpen={true}
          onClose={() => setQuickQRModalOrder(null)}
        />
      )}

      {/* Order History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#032244]/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#032244] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#D7131A]" />
                <h3 className="font-bold text-base">Mis Pedidos Anteriores</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
              {studentOrders.length === 0 ? (
                <p className="text-center text-xs text-[#032244]/50 py-8">
                  No tienes pedidos registrados con este ID ({studentId}).
                </p>
              ) : (
                studentOrders.map((ord) => (
                  <div key={ord.id} className="pt-3 pb-2 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#032244] tabular-nums">Pedido #{ord.pickupCode}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.status === 'entregado'
                              ? 'bg-slate-100 text-[#032244]/70'
                              : ord.status === 'listo'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-[#D7131A]/10 text-[#D7131A]'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#032244]/65 mt-0.5">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                      <span className="text-[10px] text-[#032244]/50">
                        {new Date(ord.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • {ord.locationName}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#032244] block tabular-nums">
                        ${ord.totalPrice.toLocaleString('es-CO')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowHistoryModal(false);
                          setQuickQRModalOrder(ord);
                        }}
                        className="mt-1 text-[11px] font-bold text-[#D7131A] hover:text-[#b51016] flex items-center gap-1"
                      >
                        <QrCode className="w-3 h-3" /> Ver QR
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/90 bg-white text-center text-xs text-[#032244]/65">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 UNIGO • Más campus, menos filas.</p>
          <div className="flex items-center gap-3">
            <span>
              Sesión activa: <strong className="text-[#032244]">{currentStudent?.name || studentName}</strong> ({currentStudent?.id || studentId})
            </span>
            <button
              type="button"
              onClick={handleStudentLogout}
              className="text-[#D7131A] font-bold hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
