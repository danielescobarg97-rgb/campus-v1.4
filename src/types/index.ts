export type OrderStatus = 'recibido' | 'preparando' | 'listo' | 'entregado' | 'cancelado';

export type KitchenStation = 'bebidas' | 'plancha_cocina' | 'snacks_listos' | 'reposteria';

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number; // e.g. +1000 for almond milk
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  options: ModifierOption[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  prepTimeMinutes: number;
  station?: KitchenStation;
  stock?: number; // Numeric stock for finite goods (e.g. 5 left)
  isComboOfTheDay?: boolean; // Highlighted daily special
  comboDiscountPrice?: number;
  modifierGroups?: ModifierGroup[];
  locationId?: string; // Location affinity or all
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  selectedModifiers?: SelectedModifier[];
  assignedToFriend?: string; // 'Compañero de Fila' / Group order tag
}

export type PaymentMethod = 'campus_wallet' | 'mostrador_efectivo' | 'nequi_daviplata';

export interface Order {
  id: string;
  studentName: string;
  studentId: string;
  notes?: string;
  totalPrice: number;
  pickupCode: string;
  status: OrderStatus;
  items: OrderItem[];
  locationId: string;
  locationName: string;
  pickupType: 'inmediato' | 'programado';
  scheduledTime?: string; // e.g. "10:00"
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  isGroupOrder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  building: string;
  operatingHours: string;
  queueLoad: 'baja' | 'moderada' | 'alta';
  avgWaitMins: number;
}

export interface StudentWallet {
  balance: number;
  transactions: {
    id: string;
    description: string;
    amount: number; // positive for topup, negative for spend
    date: string;
  }[];
}

export interface StudentUser {
  id: string; // e.g. "EST-2026-491"
  name: string;
  email: string;
  password: string;
  walletBalance: number;
  transactions: {
    id: string;
    description: string;
    amount: number;
    date: string;
  }[];
  createdAt: string;
}

export type AuthRole = 'student' | 'admin' | null;

export type ViewMode = 'student' | 'cafeteria';

