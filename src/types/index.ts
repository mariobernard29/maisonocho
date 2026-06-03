// Types for Maison VIII fine pastry sales system & CRM

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  display_order: number;
  created_at?: string;
}

export interface VariantOption {
  name: string;
  price_adjust: number;
}

export interface ProductVariant {
  name: string;
  options: VariantOption[];
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  variants: ProductVariant[];
  is_available: boolean;
  is_featured: boolean;
  prep_time_minutes: number;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyalty_balance?: number;
  loyalty_accumulated?: number;
  auth_user_id?: string;
  address_default?: string;
  total_spent: number;
  orders_count: number;
  notes?: string;
  tags: string[];
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  variant_choices: Record<string, string>;
}

export type OrderStatus = 'pendiente' | 'confirmado' | 'preparacion' | 'camino' | 'entregado' | 'cancelado';

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  client_name: string;
  client_phone: string;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  distance_km?: number;
  delivery_instructions?: string;
  delivery_fee: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  delivery_date: string;
  delivery_time_slot: string;
  payment_method: 'efectivo' | 'transferencia' | 'link_pago';
  payment_status: 'pendiente' | 'pagado';
  notes?: string;
  twilio_sent?: boolean;
  items?: OrderItem[];
  loyalty_discount?: number;
  loyalty_earned?: number;
  created_at?: string;
}

export interface DeliveryZone {
  id: string;
  min_km: number;
  max_km: number;
  price: number;
  is_blocked: boolean;
}

export interface BlockedDate {
  id: string;
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface BlockedHour {
  id: string;
  day_of_week: number; // 0-6
  start_time?: string; // HH:MM:SS
  end_time?: string;
  max_orders_per_hour: number;
  reason?: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}
