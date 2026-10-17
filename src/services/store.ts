import { Product, Order, OrderStatus, StudentWallet, CampusLocation, StudentUser } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, CAMPUS_LOCATIONS } from '../firebase/seed';
import {
  apiRegisterStudent,
  apiLoginStudent,
  apiGetStudent,
  apiTopupWallet,
  apiDebitWallet,
} from './api';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  studentFromDb,
  studentToDb,
  orderFromDb,
  orderToDb,
} from './supabase';

const PRODUCTS_KEY = 'campusbite_products_v4';
const ORDERS_KEY = 'campusbite_orders_v4';
const WALLET_KEY = 'campusbite_wallet_v4';
const OFFLINE_ORDER_KEY = 'campusbite_offline_active_order';
const ACTIVE_LOCATION_KEY = 'campusbite_active_location_v4';
const STUDENTS_DB_KEY = 'campusbite_students_db_v4';
const CURRENT_STUDENT_KEY = 'campusbite_current_student_session_v4';
const SYNC_CHANNEL_NAME = 'campusbite_broadcast_v4';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (e) {
  console.debug('BroadcastChannel not supported', e);
}

function notifySubscribers(type: 'products' | 'orders' | 'wallet' | 'location' | 'student') {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, timestamp: Date.now() });
    } catch (e) {
      console.debug('Failed to postMessage on channel', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('campusbite_update', { detail: { type } }));
  }
}

// ---------------- PRODUCTS ----------------

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    // Ensure any newly added initial products (like new combos) are present
    const existingIds = new Set(parsed.map((p: Product) => p.id));
    const missingInitial = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
    if (missingInitial.length > 0) {
      const merged = [...parsed, ...missingInitial];
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function subscribeProducts(callback: (products: Product[]) => void): () => void {
  callback(getStoredProducts());

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent<{ type?: string }>;
    if (!custom.detail || custom.detail.type === 'products') {
      callback(getStoredProducts());
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'products') {
      callback(getStoredProducts());
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PRODUCTS_KEY) {
      callback(getStoredProducts());
    }
  };

  window.addEventListener('campusbite_update', handleUpdate);
  window.addEventListener('storage', handleStorage);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('campusbite_update', handleUpdate);
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}

export function updateProduct(updated: Product): void {
  const products = getStoredProducts().map((p) => (p.id === updated.id ? updated : p));
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  notifySubscribers('products');
}

export function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
  };
  const products = [newProduct, ...getStoredProducts()];
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  notifySubscribers('products');
  return newProduct;
}

export function deleteProduct(productId: string): void {
  const products = getStoredProducts().filter((p) => p.id !== productId);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  notifySubscribers('products');
}

// ---------------- ORDERS ----------------

let supabaseOrdersChannel: any = null;

async function syncOrdersWithSupabase(callback?: (orders: Order[]) => void) {
  if (!isSupabaseConfigured()) return;
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const remoteOrders = data.map(orderFromDb);
      const local = getStoredOrders();
      const remoteIds = new Set(remoteOrders.map((o) => o.id));
      const merged = [...remoteOrders, ...local.filter((o) => !remoteIds.has(o.id))];
      localStorage.setItem(ORDERS_KEY, JSON.stringify(merged));
      notifySubscribers('orders');
      if (callback) callback(merged);
    }
  } catch (err) {
    console.warn('[SUPABASE] Orders sync error:', err);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return parsed;
  } catch {
    return INITIAL_ORDERS;
  }
}

export function subscribeOrders(callback: (orders: Order[]) => void): () => void {
  callback(getStoredOrders());

  // Trigger cloud sync if Supabase is configured
  if (isSupabaseConfigured()) {
    syncOrdersWithSupabase(callback);

    // Setup Supabase Real-time listener for multi-device sync
    if (!supabaseOrdersChannel) {
      try {
        const client = getSupabaseClient();
        supabaseOrdersChannel = client
          .channel('public_orders_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload: any) => {
              if (payload.eventType === 'INSERT' && payload.new) {
                const newOrder = orderFromDb(payload.new);
                const current = getStoredOrders().filter((o) => o.id !== newOrder.id);
                const updated = [newOrder, ...current];
                localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
                notifySubscribers('orders');
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedOrder = orderFromDb(payload.new);
                const current = getStoredOrders().map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
                localStorage.setItem(ORDERS_KEY, JSON.stringify(current));
                notifySubscribers('orders');
              } else if (payload.eventType === 'DELETE' && payload.old) {
                const current = getStoredOrders().filter((o) => o.id !== payload.old.id);
                localStorage.setItem(ORDERS_KEY, JSON.stringify(current));
                notifySubscribers('orders');
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('[SUPABASE] Failed to subscribe to orders realtime channel', e);
      }
    }
  }

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent<{ type?: string }>;
    if (!custom.detail || custom.detail.type === 'orders') {
      callback(getStoredOrders());
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'orders') {
      callback(getStoredOrders());
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ORDERS_KEY) {
      callback(getStoredOrders());
    }
  };

  window.addEventListener('campusbite_update', handleUpdate);
  window.addEventListener('storage', handleStorage);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('campusbite_update', handleUpdate);
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}

export function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'pickupCode'>): Order {
  const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
  const newOrder: Order = {
    ...orderData,
    id: `ord-${pickupCode}`,
    pickupCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orders = [newOrder, ...getStoredOrders()];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  // Deduct numeric stock for ordered items
  const allProducts = getStoredProducts();
  let productsModified = false;
  const updatedProducts = allProducts.map((p) => {
    const orderedItem = orderData.items.find((item) => item.productId === p.id);
    if (orderedItem && typeof p.stock === 'number') {
      const remainingStock = Math.max(0, p.stock - orderedItem.quantity);
      productsModified = true;
      return {
        ...p,
        stock: remainingStock,
        isAvailable: remainingStock > 0, // Auto out-of-stock
      };
    }
    return p;
  });

  if (productsModified) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
    notifySubscribers('products');
  }

  // Cache as offline active order for student
  setCachedActiveOrder(newOrder);

  // Sync to Supabase cloud table if configured
  if (isSupabaseConfigured()) {
    void (async () => {
      try {
        const { error } = await getSupabaseClient()
          .from('orders')
          .insert([orderToDb(newOrder)]);
        if (error) console.warn('[SUPABASE] Error persisting order to cloud:', error.message);
      } catch (err) {
        console.warn('[SUPABASE] Exception sending order to cloud:', err);
      }
    })();
  }

  notifySubscribers('orders');
  return newOrder;
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
  const orders = getStoredOrders().map((o) => {
    if (o.id === orderId) {
      const updated = { ...o, status: newStatus, updatedAt: new Date().toISOString() };
      // Keep offline cache synced if it's the cached order
      const cached = getCachedActiveOrder();
      if (cached && cached.id === orderId) {
        setCachedActiveOrder(updated);
      }
      return updated;
    }
    return o;
  });
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  notifySubscribers('orders');

  // Sync to Supabase cloud table if configured
  if (isSupabaseConfigured()) {
    void (async () => {
      try {
        const { error } = await getSupabaseClient()
          .from('orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);
        if (error) console.warn('[SUPABASE] Error updating order status:', error.message);
      } catch (err) {
        console.warn('[SUPABASE] Exception updating order in cloud:', err);
      }
    })();
  }
}

export function deleteOrder(orderId: string): void {
  const orders = getStoredOrders().filter((o) => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  notifySubscribers('orders');

  if (isSupabaseConfigured()) {
    void (async () => {
      try {
        const { error } = await getSupabaseClient()
          .from('orders')
          .delete()
          .eq('id', orderId);
        if (error) console.warn('[SUPABASE] Error deleting order from cloud:', error.message);
      } catch (err) {
        console.warn('[SUPABASE] Exception deleting order:', err);
      }
    })();
  }
}

// ---------------- DYNAMIC ESTIMATION ----------------

export interface DynamicPrepResult {
  estimatedMinutes: number;
  queueLoad: 'baja' | 'moderada' | 'alta';
  pendingOrdersCount: number;
  stationBreakdown: Record<string, number>;
}

export function calculateDynamicPrepTime(
  items: { productId: string; quantity: number }[],
  allOrders: Order[],
  locationId: string
): DynamicPrepResult {
  const products = getStoredProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Base item prep time (max among items + modest batch addition)
  let maxBasePrepTime = 2;
  items.forEach((item) => {
    const p = productMap.get(item.productId);
    const itemPrep = p?.prepTimeMinutes || 4;
    if (itemPrep > maxBasePrepTime) {
      maxBasePrepTime = itemPrep;
    }
  });

  // Calculate active load in this location
  const pendingOrders = allOrders.filter(
    (o) => o.locationId === locationId && (o.status === 'recibido' || o.status === 'preparando')
  );

  const pendingOrdersCount = pendingOrders.length;

  let queueLoad: 'baja' | 'moderada' | 'alta' = 'baja';
  let queueBufferMinutes = 0;

  if (pendingOrdersCount >= 6) {
    queueLoad = 'alta';
    queueBufferMinutes = 10;
  } else if (pendingOrdersCount >= 3) {
    queueLoad = 'moderada';
    queueBufferMinutes = 5;
  } else {
    queueLoad = 'baja';
    queueBufferMinutes = 1;
  }

  // Station breakdown for kitchen analytics
  const stationBreakdown: Record<string, number> = {
    bebidas: 0,
    plancha_cocina: 0,
    snacks_listos: 0,
    reposteria: 0,
  };

  pendingOrders.forEach((o) => {
    o.items.forEach((item) => {
      const p = productMap.get(item.productId);
      const st = p?.station || 'snacks_listos';
      stationBreakdown[st] = (stationBreakdown[st] || 0) + item.quantity;
    });
  });

  const estimatedMinutes = Math.min(35, maxBasePrepTime + queueBufferMinutes);

  return {
    estimatedMinutes,
    queueLoad,
    pendingOrdersCount,
    stationBreakdown,
  };
}

// ---------------- STUDENT ACCOUNTS & PERSONAL WALLET ----------------

const INITIAL_STUDENTS: StudentUser[] = [
  {
    id: 'EST-2024-491',
    name: 'Valentina Torres',
    email: 'valentina@universidad.edu.co',
    password: '1234',
    walletBalance: 45000,
    transactions: [
      {
        id: 'tx-init-1',
        description: 'Bono de bienvenida CampusPay',
        amount: 45000,
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'EST-2023-118',
    name: 'Camilo Rodríguez',
    email: 'camilo@universidad.edu.co',
    password: '1234',
    walletBalance: 30000,
    transactions: [
      {
        id: 'tx-init-2',
        description: 'Recarga PSE Nequi',
        amount: 30000,
        date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export function getStoredStudents(): StudentUser[] {
  try {
    const raw = localStorage.getItem(STUDENTS_DB_KEY);
    if (!raw) {
      localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return parsed;
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function getCurrentStudent(): StudentUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_STUDENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentStudent(student: StudentUser | null): void {
  if (!student) {
    localStorage.removeItem(CURRENT_STUDENT_KEY);
  } else {
    localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(student));
  }
  notifySubscribers('student');
  notifySubscribers('wallet');
  ensureStudentRealtime();
}

export async function registerStudent(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: StudentUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPass = password.trim();

  const studentId = `EST-2026-${Math.floor(100 + Math.random() * 900)}`;
  const newStudent: StudentUser = {
    id: studentId,
    name: cleanName,
    email: cleanEmail,
    password: cleanPass,
    walletBalance: 25000,
    transactions: [
      {
        id: `tx-welcome-${Date.now()}`,
        description: 'Bono de bienvenida por nuevo registro CampusPay',
        amount: 25000,
        date: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  // 1. SUPABASE CLOUD (PostgreSQL + Auth) - Priority #1 for cross-device persistence
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();

      // Check if student with this email already exists in Supabase
      const { data: existing, error: checkErr } = await client
        .from('students')
        .select('id, email')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: 'Este correo electrónico ya está registrado en Supabase. Por favor inicia sesión con tu contraseña.',
        };
      }

      // Insert new student into Supabase PostgreSQL table
      const { error: insertErr } = await client
        .from('students')
        .insert([studentToDb(newStudent)]);

      if (insertErr) {
        console.warn('[SUPABASE] Registration error:', insertErr.message, insertErr);
        if (insertErr.code === '42P01') {
          return {
            success: false,
            error: 'La tabla "students" no existe en Supabase. Ejecuta el script SQL en el Editor SQL de Supabase.',
          };
        }
      } else {
        // Successfully saved in Supabase cloud!
        const students = getStoredStudents();
        const updated = [newStudent, ...students.filter((s) => s.email.toLowerCase() !== cleanEmail)];
        localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(updated));
        setCurrentStudent(newStudent);
        return { success: true, user: newStudent };
      }
    } catch (err: any) {
      console.warn('[SUPABASE] Registration network exception:', err);
    }
  }

  // 2. Central API route fallback (if local server is available)
  try {
    const apiRes = await apiRegisterStudent(cleanName, cleanEmail, cleanPass);
    if (apiRes.success && apiRes.user) {
      const students = getStoredStudents();
      const updated = [
        apiRes.user,
        ...students.filter((s) => s.email.toLowerCase() !== cleanEmail),
      ];
      localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(updated));
      setCurrentStudent(apiRes.user);
      return { success: true, user: apiRes.user };
    }

    if (apiRes.error && apiRes.error.includes('registrado')) {
      return { success: false, error: apiRes.error };
    }
  } catch (err) {
    console.warn('[AUTH] Fallback API call failed:', err);
  }

  // 3. Fallback to local storage (e.g. offline mode)
  const students = getStoredStudents();
  const existing = students.find((s) => s.email.toLowerCase() === cleanEmail);
  if (existing) {
    return {
      success: false,
      error: 'Este correo electrónico ya está registrado. Por favor inicia sesión.',
    };
  }

  const updatedStudents = [newStudent, ...students];
  localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(updatedStudents));
  setCurrentStudent(newStudent);

  return { success: true, user: newStudent };
}

export async function loginStudent(
  email: string,
  password: string
): Promise<{ success: boolean; user?: StudentUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // 1. SUPABASE CLOUD (PostgreSQL 'students' table across all devices)
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('students')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (error && error.code === '42P01') {
        return {
          success: false,
          error: 'La tabla "students" no existe en Supabase. Ejecuta el script SQL en Supabase para sincronizar entre dispositivos.',
        };
      }

      if (data) {
        const remoteUser = studentFromDb(data);
        if (remoteUser.password && remoteUser.password !== cleanPassword) {
          return {
            success: false,
            error: 'Contraseña incorrecta. Verifica tus datos de acceso.',
          };
        }

        // Cache locally and establish current active session
        const students = getStoredStudents();
        const updated = [remoteUser, ...students.filter((s) => s.email.toLowerCase() !== cleanEmail)];
        localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(updated));
        setCurrentStudent(remoteUser);
        return { success: true, user: remoteUser };
      }
    } catch (err) {
      console.warn('[SUPABASE] Login error, falling back to local/demo check:', err);
    }
  }

  // 2. Query central backend API route (if server is active)
  try {
    const apiRes = await apiLoginStudent(cleanEmail, cleanPassword);
    if (apiRes.success && apiRes.user) {
      const students = getStoredStudents();
      const updated = [
        apiRes.user,
        ...students.filter((s) => s.email.toLowerCase() !== cleanEmail),
      ];
      localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(updated));
      setCurrentStudent(apiRes.user);
      return { success: true, user: apiRes.user };
    }

    if (apiRes.error && !apiRes.error.includes('conexión') && !apiRes.error.includes('servidor')) {
      return { success: false, error: apiRes.error };
    }
  } catch (err) {
    console.warn('[AUTH] Central login call failed, trying local fallback:', err);
  }

  // 3. Fallback to local storage (for demo accounts or offline mode)
  const students = getStoredStudents();
  const found = students.find(
    (s) => s.email.toLowerCase() === cleanEmail && s.password === cleanPassword
  );

  if (!found) {
    return {
      success: false,
      error: 'Correo o contraseña incorrectos. Verifica tus datos o regístrate si es tu primera vez.',
    };
  }

  // If found locally and Supabase is configured, opportunistically sync student record to Supabase
  if (isSupabaseConfigured()) {
    void (async () => {
      try {
        await getSupabaseClient()
          .from('students')
          .upsert([studentToDb(found)]);
      } catch (err) {
        console.debug('[SUPABASE] Opportunistic upsert exception:', err);
      }
    })();
  }

  setCurrentStudent(found);
  return { success: true, user: found };
}

export async function syncCurrentStudentWithRemote(): Promise<StudentUser | null> {
  const current = getCurrentStudent();
  if (!current) return null;

  // 1. Supabase Cloud Sync
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('students')
        .select('*')
        .eq('id', current.id)
        .maybeSingle();

      if (!error && data) {
        const remoteUser = studentFromDb(data);
        if (
          remoteUser.walletBalance !== current.walletBalance ||
          remoteUser.transactions?.length !== current.transactions?.length ||
          remoteUser.name !== current.name
        ) {
          setCurrentStudent(remoteUser);
          return remoteUser;
        }
        return current;
      }
    } catch (e) {
      console.debug('[SUPABASE] Background student sync exception', e);
    }
  }

  // 2. Fallback to local server API
  try {
    const res = await apiGetStudent(current.id);
    if (res.success && res.user) {
      if (
        res.user.walletBalance !== current.walletBalance ||
        res.user.transactions?.length !== current.transactions?.length
      ) {
        setCurrentStudent(res.user);
        return res.user;
      }
    }
  } catch (e) {
    // Silent fail for background sync
  }
  return current;
}

let studentRealtimeChannel: any = null;
let subscribedStudentId: string | null = null;

function ensureStudentRealtime() {
  const current = getCurrentStudent();
  if (!current || !isSupabaseConfigured()) {
    if (studentRealtimeChannel) {
      try {
        studentRealtimeChannel.unsubscribe();
      } catch (e) {}
      studentRealtimeChannel = null;
      subscribedStudentId = null;
    }
    return;
  }

  if (studentRealtimeChannel && subscribedStudentId === current.id) {
    return;
  }

  if (studentRealtimeChannel) {
    try {
      studentRealtimeChannel.unsubscribe();
    } catch (e) {}
    studentRealtimeChannel = null;
  }

  try {
    const client = getSupabaseClient();
    subscribedStudentId = current.id;
    studentRealtimeChannel = client
      .channel(`realtime_student_profile_${current.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
          filter: `id=eq.${current.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            const remoteUser = studentFromDb(payload.new);
            const students = getStoredStudents().map((s) => (s.id === remoteUser.id ? remoteUser : s));
            localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(students));
            localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(remoteUser));
            notifySubscribers('student');
            notifySubscribers('wallet');
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('[SUPABASE] Failed to listen to student realtime changes:', err);
  }
}

export function logoutStudent(): void {
  if (studentRealtimeChannel) {
    try {
      studentRealtimeChannel.unsubscribe();
    } catch (e) {}
    studentRealtimeChannel = null;
    subscribedStudentId = null;
  }
  setCurrentStudent(null);
}

export function subscribeCurrentStudent(
  callback: (user: StudentUser | null) => void
): () => void {
  callback(getCurrentStudent());
  ensureStudentRealtime();

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent<{ type?: string }>;
    if (!custom.detail || custom.detail.type === 'student') {
      callback(getCurrentStudent());
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'student') {
      callback(getCurrentStudent());
    }
  };

  window.addEventListener('campusbite_update', handleUpdate);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('campusbite_update', handleUpdate);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}

// ---------------- STUDENT WALLET (CAMPUSPAY) ----------------

export function getStoredWallet(): StudentWallet {
  const current = getCurrentStudent();
  if (current) {
    return {
      balance: current.walletBalance,
      transactions: current.transactions || [],
    };
  }

  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) {
      return { balance: 0, transactions: [] };
    }
    return JSON.parse(raw);
  } catch {
    return { balance: 0, transactions: [] };
  }
}

export function subscribeWallet(callback: (wallet: StudentWallet) => void): () => void {
  callback(getStoredWallet());

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent<{ type?: string }>;
    if (!custom.detail || custom.detail.type === 'wallet' || custom.detail.type === 'student') {
      callback(getStoredWallet());
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'wallet' || event.data?.type === 'student') {
      callback(getStoredWallet());
    }
  };

  window.addEventListener('campusbite_update', handleUpdate);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('campusbite_update', handleUpdate);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}

export function topupWallet(amount: number, method: string = 'PSE / Tarjeta'): StudentWallet {
  const current = getCurrentStudent();

  if (current) {
    const updatedUser: StudentUser = {
      ...current,
      walletBalance: current.walletBalance + amount,
      transactions: [
        {
          id: `tx-top-${Date.now()}`,
          description: `Recarga de saldo vía ${method}`,
          amount,
          date: new Date().toISOString(),
        },
        ...(current.transactions || []),
      ],
    };

    // Update in DB locally
    const students = getStoredStudents().map((s) => (s.id === current.id ? updatedUser : s));
    localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(students));
    localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(updatedUser));

    // 1. Persist to Supabase PostgreSQL table
    if (isSupabaseConfigured()) {
      void (async () => {
        try {
          const { error } = await getSupabaseClient()
            .from('students')
            .update({
              wallet_balance: updatedUser.walletBalance,
              transactions: updatedUser.transactions,
            })
            .eq('id', current.id);
          if (error) console.warn('[SUPABASE] Topup sync error:', error.message);
        } catch (err) {
          console.warn('[SUPABASE] Topup sync exception:', err);
        }
      })();
    }

    // 2. Persist to local server API
    apiTopupWallet(current.id, amount, method).catch((err: any) => {
      console.warn('[WALLET] Central topup sync error:', err);
    });

    notifySubscribers('student');
    notifySubscribers('wallet');

    return {
      balance: updatedUser.walletBalance,
      transactions: updatedUser.transactions,
    };
  }

  const currentWallet = getStoredWallet();
  const updated: StudentWallet = {
    balance: currentWallet.balance + amount,
    transactions: [
      {
        id: `tx-top-${Date.now()}`,
        description: `Recarga de saldo vía ${method}`,
        amount,
        date: new Date().toISOString(),
      },
      ...currentWallet.transactions,
    ],
  };
  localStorage.setItem(WALLET_KEY, JSON.stringify(updated));
  notifySubscribers('wallet');
  return updated;
}

export function debitWallet(amount: number, orderCode: string): boolean {
  const current = getCurrentStudent();

  if (current) {
    if (current.walletBalance < amount) return false;

    const updatedUser: StudentUser = {
      ...current,
      walletBalance: current.walletBalance - amount,
      transactions: [
        {
          id: `tx-pay-${Date.now()}`,
          description: `Pago Pedido #${orderCode}`,
          amount: -amount,
          date: new Date().toISOString(),
        },
        ...(current.transactions || []),
      ],
    };

    // Update in DB locally
    const students = getStoredStudents().map((s) => (s.id === current.id ? updatedUser : s));
    localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(students));
    localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(updatedUser));

    // 1. Persist to Supabase PostgreSQL table
    if (isSupabaseConfigured()) {
      void (async () => {
        try {
          const { error } = await getSupabaseClient()
            .from('students')
            .update({
              wallet_balance: updatedUser.walletBalance,
              transactions: updatedUser.transactions,
            })
            .eq('id', current.id);
          if (error) console.warn('[SUPABASE] Debit sync error:', error.message);
        } catch (err) {
          console.warn('[SUPABASE] Debit sync exception:', err);
        }
      })();
    }

    // 2. Persist to local server API
    apiDebitWallet(current.id, amount, orderCode).catch((err: any) => {
      console.warn('[WALLET] Central debit sync error:', err);
    });

    notifySubscribers('student');
    notifySubscribers('wallet');
    return true;
  }

  const currentWallet = getStoredWallet();
  if (currentWallet.balance < amount) return false;

  const updated: StudentWallet = {
    balance: currentWallet.balance - amount,
    transactions: [
      {
        id: `tx-pay-${Date.now()}`,
        description: `Pago Pedido #${orderCode}`,
        amount: -amount,
        date: new Date().toISOString(),
      },
      ...currentWallet.transactions,
    ],
  };
  localStorage.setItem(WALLET_KEY, JSON.stringify(updated));
  notifySubscribers('wallet');
  return true;
}

// ---------------- OFFLINE CACHE ----------------

export function getCachedActiveOrder(): Order | null {
  try {
    const raw = localStorage.getItem(OFFLINE_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedActiveOrder(order: Order | null): void {
  try {
    if (!order) {
      localStorage.removeItem(OFFLINE_ORDER_KEY);
    } else {
      localStorage.setItem(OFFLINE_ORDER_KEY, JSON.stringify(order));
    }
  } catch (e) {
    console.debug('Failed to cache order offline', e);
  }
}

// ---------------- CAMPUS LOCATIONS ----------------

export function getStoredLocations(): CampusLocation[] {
  return CAMPUS_LOCATIONS;
}

export function getActiveLocation(): CampusLocation {
  try {
    const storedId = localStorage.getItem(ACTIVE_LOCATION_KEY);
    const found = CAMPUS_LOCATIONS.find((l) => l.id === storedId);
    return found || CAMPUS_LOCATIONS[0];
  } catch {
    return CAMPUS_LOCATIONS[0];
  }
}

export function setActiveLocation(locationId: string): void {
  localStorage.setItem(ACTIVE_LOCATION_KEY, locationId);
  notifySubscribers('location');
}

export function subscribeLocation(callback: (location: CampusLocation) => void): () => void {
  callback(getActiveLocation());

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent<{ type?: string }>;
    if (!custom.detail || custom.detail.type === 'location') {
      callback(getActiveLocation());
    }
  };

  window.addEventListener('campusbite_update', handleUpdate);
  return () => {
    window.removeEventListener('campusbite_update', handleUpdate);
  };
}

// Reset store
export function resetCatalogAndOrders(): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
  localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(INITIAL_STUDENTS));
  localStorage.removeItem(OFFLINE_ORDER_KEY);
  notifySubscribers('products');
  notifySubscribers('orders');
  notifySubscribers('wallet');
  notifySubscribers('student');
}
