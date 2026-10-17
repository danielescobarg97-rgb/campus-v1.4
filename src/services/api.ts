import { StudentUser } from '../types';

/**
 * Client for CampusBite Global Centralized API.
 * Ensures authentication, student profiles, and wallet balances
 * are persistent and synchronized across devices (PC, smartphone, tablets).
 */

const API_BASE = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  user?: StudentUser;
  students?: StudentUser[];
  error?: string;
  message?: string;
  data?: T;
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Register a new student in the central database.
 * Persistent across all devices.
 */
export async function apiRegisterStudent(
  name: string,
  email: string,
  password: string
): Promise<ApiResponse<StudentUser>> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Error del servidor (${res.status}).`,
      };
    }

    return {
      success: true,
      user: data.user,
      message: data.message,
    };
  } catch (err: any) {
    console.warn('[API] Registration error:', err);
    return {
      success: false,
      error: 'No se pudo conectar con el servidor central de autenticación. Verifica tu conexión de red.',
    };
  }
}

/**
 * Login a student against the central database.
 * Allows login from any device (PC, phone) using registered credentials.
 */
export async function apiLoginStudent(
  email: string,
  password: string
): Promise<ApiResponse<StudentUser>> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Credenciales inválidas.',
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (err: any) {
    console.warn('[API] Login error:', err);
    return {
      success: false,
      error: 'Error de conexión con el servidor central. Comprueba tu red.',
    };
  }
}

/**
 * Fetch a student's profile & updated balance from the central database.
 */
export async function apiGetStudent(studentIdOrEmail: string): Promise<ApiResponse<StudentUser>> {
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentIdOrEmail)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { success: false, error: 'Estudiante no encontrado en la base central.' };
    }

    const data = await res.json();
    return { success: true, user: data.user };
  } catch {
    return { success: false, error: 'Error al consultar datos en la nube.' };
  }
}

/**
 * Top up student wallet centrally in database.
 */
export async function apiTopupWallet(
  studentId: string,
  amount: number,
  method: string = 'PSE / Tarjeta'
): Promise<ApiResponse<StudentUser>> {
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Error al recargar saldo central.' };
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: 'Fallo al sincronizar recarga con el servidor central.' };
  }
}

/**
 * Debit student wallet centrally in database.
 */
export async function apiDebitWallet(
  studentId: string,
  amount: number,
  orderCode: string
): Promise<ApiResponse<StudentUser>> {
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/debit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, orderCode }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Error al procesar cobro en servidor central.' };
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: 'Fallo al sincronizar pago con el servidor central.' };
  }
}
