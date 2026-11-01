export type Role = 'client' | 'vendor' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  is_active: boolean;
  vendor_profile?: VendorProfile;
}

export interface VendorProfile {
  id: number;
  user_id: number;
  business_name: string;
  category: string;
  description?: string;
  location?: string;
  phone?: string;
  is_verified: boolean;
}

export interface Service {
  id: number;
  vendor_id: number;
  category: string;
  name: string;
  description?: string;
  price: string;
  unit: string;
  is_active: boolean;
  vendor?: { id: number; name: string };
}

export interface EventItem {
  id: number;
  client_id: number;
  title: string;
  type: string;
  event_date: string;
  venue?: string;
  location?: string;
  guest_count: number;
  budget: string;
  status: string;
  notes?: string;
  bookings_count?: number;
}

export interface EventSummary {
  budget: number;
  committed: number;
  remaining_budget: number;
  paid: number;
  outstanding: number;
}

export interface Booking {
  id: number;
  event_id: number;
  client_id: number;
  service_id: number;
  vendor_id: number;
  quantity: number;
  unit_price: string;
  agreed_price: string;
  scheduled_date?: string;
  status: string;
  notes?: string;
  service?: Service;
  event?: EventItem;
  client?: { id: number; name: string; phone?: string };
  vendor?: { id: number; name: string; phone?: string };
  payments?: Payment[];
}

export interface Payment {
  id: number;
  booking_id: number;
  recorded_by: number;
  confirmed_by?: number;
  amount: string;
  method: 'mpesa' | 'bank' | 'cash';
  reference?: string;
  type: 'deposit' | 'balance' | 'full';
  status: 'pending' | 'confirmed' | 'rejected';
  paid_at: string;
  note?: string;
  recorder?: { id: number; name: string };
  confirmer?: { id: number; name: string };
  booking?: Booking;
}

export interface PaymentSettings {
  id: number;
  currency: string;
  deposit_percentage: number;
  require_reference: boolean;
  confirmation_role: 'admin' | 'vendor_or_admin';
  allowed_methods: string[];
  receipt_prefix: string;
  business_name?: string;
  business_details?: string;
}

export interface Option {
  id: number;
  group: string;
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface AppNotification {
  id: number;
  title: string;
  body?: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
