import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StudentUser, Order } from '../types';

/**
 * Storage keys for runtime Supabase credentials (fallback/override for testing without redeploying)
 */
const STORAGE_SUPABASE_URL = 'campusbite_supabase_url';
const STORAGE_SUPABASE_KEY = 'campusbite_supabase_anon_key';

/**
 * Retrieves the effective Supabase URL and Anon Key.
 * Priority:
 * 1. Runtime / LocalStorage overrides (useful for testing on preview environments)
 * 2. Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 */
export function getSupabaseCredentials(): { url: string; key: string; source: 'env' | 'custom' | 'none' } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let customUrl = '';
  let customKey = '';
  if (typeof window !== 'undefined') {
    customUrl = (localStorage.getItem(STORAGE_SUPABASE_URL) || '').trim();
    customKey = (localStorage.getItem(STORAGE_SUPABASE_KEY) || '').trim();
  }

  if (customUrl && customKey && !customUrl.includes('your-project')) {
    return { url: customUrl, key: customKey, source: 'custom' };
  }

  if (envUrl && envKey && !envUrl.includes('your-project')) {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  return {
    url: customUrl || envUrl || 'https://placeholder.supabase.co',
    key: customKey || envKey || 'placeholder-anon-key',
    source: 'none',
  };
}

export function isSupabaseConfigured(): boolean {
  const creds = getSupabaseCredentials();
  return creds.source !== 'none' && creds.url.startsWith('https://') && creds.key.length > 20;
}

export function saveCustomSupabaseConfig(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
    reinitSupabaseClient();
    window.dispatchEvent(new CustomEvent('campusbite_supabase_config_changed'));
  }
}

export function clearCustomSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_SUPABASE_URL);
    localStorage.removeItem(STORAGE_SUPABASE_KEY);
    reinitSupabaseClient();
    window.dispatchEvent(new CustomEvent('campusbite_supabase_config_changed'));
  }
}

/**
 * Singleton Supabase Client with dynamic credential invalidation
 */
let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient {
  const creds = getSupabaseCredentials();
  if (!cachedClient || cachedUrl !== creds.url || cachedKey !== creds.key) {
    cachedUrl = creds.url;
    cachedKey = creds.key;
    cachedClient = createClient(creds.url, creds.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}

export function reinitSupabaseClient(): SupabaseClient {
  const creds = getSupabaseCredentials();
  cachedUrl = creds.url;
  cachedKey = creds.key;
  cachedClient = createClient(creds.url, creds.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return cachedClient;
}

// Default export/named export
export const supabase = getSupabaseClient();

/**
 * Diagnostic test to verify connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase no está configurado aún. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const client = getSupabaseClient();
    // Test simple select on students table
    const { error } = await client.from('students').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Conexión a Supabase exitosa, pero la tabla "students" no existe. Ejecuta el script SQL en Supabase.',
        };
      }
      return {
        success: false,
        message: `Error de Supabase: ${error.message} (${error.code || error.details || 'Error desconocido'})`,
      };
    }

    return {
      success: true,
      message: '¡Conexión exitosa a Supabase Cloud y tabla "students" verificada!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al conectar con Supabase: ${err.message || 'Verifica la URL y la llave anónima.'}`,
    };
  }
}

// ---------------- DATABASE DATA MAPPERS ----------------

export interface DbStudent {
  id: string;
  name: string;
  email: string;
  password?: string;
  wallet_balance: number;
  transactions: any[];
  created_at?: string;
}

export function studentFromDb(row: any): StudentUser {
  let parsedTransactions = row.transactions;
  if (typeof parsedTransactions === 'string') {
    try {
      parsedTransactions = JSON.parse(parsedTransactions);
    } catch {
      parsedTransactions = [];
    }
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password || '',
    walletBalance: typeof row.wallet_balance === 'number' ? row.wallet_balance : Number(row.wallet_balance || 0),
    transactions: Array.isArray(parsedTransactions) ? parsedTransactions : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function studentToDb(student: StudentUser): DbStudent {
  return {
    id: student.id,
    name: student.name,
    email: student.email.toLowerCase().trim(),
    password: student.password,
    wallet_balance: student.walletBalance,
    transactions: student.transactions || [],
    created_at: student.createdAt,
  };
}

export interface DbOrder {
  id: string;
  student_name: string;
  student_id: string;
  notes?: string | null;
  total_price: number;
  pickup_code: string;
  status: string;
  items: any;
  location_id: string;
  location_name: string;
  pickup_type: string;
  scheduled_time?: string | null;
  payment_method: string;
  is_paid: boolean;
  is_group_order: boolean;
  created_at: string;
  updated_at: string;
}

export function orderFromDb(row: any): Order {
  let parsedItems = row.items;
  if (typeof parsedItems === 'string') {
    try {
      parsedItems = JSON.parse(parsedItems);
    } catch {
      parsedItems = [];
    }
  }

  return {
    id: row.id,
    studentName: row.student_name || 'Estudiante',
    studentId: row.student_id || '',
    notes: row.notes || undefined,
    totalPrice: typeof row.total_price === 'number' ? row.total_price : Number(row.total_price || 0),
    pickupCode: row.pickup_code || '0000',
    status: row.status as any,
    items: Array.isArray(parsedItems) ? parsedItems : [],
    locationId: row.location_id || 'loc-central',
    locationName: row.location_name || 'Cafetería Central',
    pickupType: (row.pickup_type as any) || 'inmediato',
    scheduledTime: row.scheduled_time || undefined,
    paymentMethod: (row.payment_method as any) || 'campus_wallet',
    isPaid: Boolean(row.is_paid),
    isGroupOrder: Boolean(row.is_group_order),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function orderToDb(order: Order): DbOrder {
  return {
    id: order.id,
    student_name: order.studentName,
    student_id: order.studentId,
    notes: order.notes || null,
    total_price: order.totalPrice,
    pickup_code: order.pickupCode,
    status: order.status,
    items: order.items,
    location_id: order.locationId,
    location_name: order.locationName,
    pickup_type: order.pickupType,
    scheduled_time: order.scheduledTime || null,
    payment_method: order.paymentMethod,
    is_paid: order.isPaid,
    is_group_order: Boolean(order.isGroupOrder),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}
