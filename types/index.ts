// ============================================================
// VEE LIFESTYLE — Central TypeScript Types
// ============================================================

export type UserRole = 'customer' | 'rider' | 'admin';
export type Gender = 'man' | 'woman' | 'unisex';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'failed';
export type PayoutStatus = 'pending' | 'paid' | 'failed';
export type NotificationType = 'order' | 'promo' | 'system' | 'delivery';

// ─── Product ──────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category?: Category;
  price: number;
  sale_price: number | null;
  images: string[];
  gender: Gender;
  sizes: string[];
  colors: ProductColor[];
  stock: number;
  published: boolean;
  featured?: boolean;
  created_at: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

// ─── Cart ─────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: ProductColor;
}

// ─── Orders ───────────────────────────────────────────────
export interface DeliveryAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  county: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  color: ProductColor;
}

export interface Order {
  id: string;
  customer_id: string | null;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  paystack_ref: string | null;
  mpesa_ref: string | null;
  rider_id: string | null;
  rider?: RiderProfile;
  delivery_address: DeliveryAddress;
  tracking_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

// ─── Wishlist ─────────────────────────────────────────────
export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

// ─── Rider ────────────────────────────────────────────────
export interface RiderProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  vehicle_type: string;
  license_plate: string;
  verified: boolean;
  active: boolean;
  earnings_total: number;
  current_lat: number | null;
  current_lng: number | null;
  created_at: string;
}

export interface RiderEarning {
  id: string;
  rider_id: string;
  order_id: string;
  order?: Order;
  amount: number;
  payout_status: PayoutStatus;
  paid_at: string | null;
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  action_url?: string;
  created_at: string;
}

// ─── Offers/Banners ───────────────────────────────────────
export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_url: string;
  cta_label: string;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

// ─── Settings ─────────────────────────────────────────────
export interface DeliverySettings {
  id: string;
  base_rate: number;
  per_km_rate: number;
  max_distance_km: number;
  rider_base_pay: number;
  rider_per_km_pay: number;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
}

// ─── Analytics ────────────────────────────────────────────
export interface SalesMetric {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  active_riders: number;
  revenue_change: number;
  orders_change: number;
}

// ─── Filter State ─────────────────────────────────────────
export interface FilterState {
  gender: Gender | 'all';
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
  category: string | null;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  search: string;
}

// ─── Paystack ─────────────────────────────────────────────
export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface MpesaSTKResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
  };
}

// ─── GPS Broadcast ────────────────────────────────────────
export interface GPSPayload {
  rider_id: string;
  order_id: string;
  lat: number;
  lng: number;
  timestamp: string;
}
