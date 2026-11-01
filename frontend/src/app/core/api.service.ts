import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  AppNotification, Booking, EventItem, EventSummary, Option, Payment, PaymentSettings, Service, User, VendorProfile,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ---- Catalogue (public) ----
  services(params?: Record<string, string>) {
    return this.http.get<Service[]>(`${this.api}/services`, { params });
  }
  service(id: number) {
    return this.http.get<Service>(`${this.api}/services/${id}`);
  }
  vendors(params?: Record<string, string>) {
    return this.http.get<VendorProfile[]>(`${this.api}/vendors`, { params });
  }

  // ---- Dashboard ----
  dashboard() {
    return this.http.get<any>(`${this.api}/dashboard`);
  }

  // ---- Events (client) ----
  events() {
    return this.http.get<EventItem[]>(`${this.api}/events`);
  }
  event(id: number) {
    return this.http.get<{ event: EventItem & { bookings: Booking[] }; summary: EventSummary }>(`${this.api}/events/${id}`);
  }
  createEvent(data: Partial<EventItem>) {
    return this.http.post<EventItem>(`${this.api}/events`, data);
  }
  updateEvent(id: number, data: Partial<EventItem>) {
    return this.http.put<EventItem>(`${this.api}/events/${id}`, data);
  }
  deleteEvent(id: number) {
    return this.http.delete(`${this.api}/events/${id}`);
  }

  // ---- Bookings ----
  bookings() {
    return this.http.get<Booking[]>(`${this.api}/bookings`);
  }
  booking(id: number) {
    return this.http.get<{ booking: Booking; paid: number; balance: number }>(`${this.api}/bookings/${id}`);
  }
  createBooking(data: { event_id: number; service_id: number; quantity: number; notes?: string }) {
    return this.http.post<Booking>(`${this.api}/bookings`, data);
  }
  updateBookingStatus(id: number, status: string) {
    return this.http.patch<Booking>(`${this.api}/bookings/${id}/status`, { status });
  }

  // ---- Payments ----
  payments(params?: Record<string, string>) {
    return this.http.get<Payment[]>(`${this.api}/payments`, { params });
  }
  recordPayment(data: Partial<Payment>) {
    return this.http.post<Payment>(`${this.api}/payments`, data);
  }
  confirmPayment(id: number) {
    return this.http.patch<Payment>(`${this.api}/payments/${id}/confirm`, {});
  }
  rejectPayment(id: number) {
    return this.http.patch<Payment>(`${this.api}/payments/${id}/reject`, {});
  }
  receipt(id: number) {
    return this.http.get<any>(`${this.api}/payments/${id}/receipt`);
  }

  // ---- Payment settings ----
  paymentSettings() {
    return this.http.get<PaymentSettings>(`${this.api}/payment-settings`);
  }
  updatePaymentSettings(data: Partial<PaymentSettings>) {
    return this.http.put<PaymentSettings>(`${this.api}/admin/payment-settings`, data);
  }

  // ---- Vendor self-management ----
  vendorProfile() {
    return this.http.get<VendorProfile>(`${this.api}/vendor/profile`);
  }
  updateVendorProfile(data: Partial<VendorProfile>) {
    return this.http.put<VendorProfile>(`${this.api}/vendor/profile`, data);
  }
  myServices() {
    return this.http.get<Service[]>(`${this.api}/vendor/services`);
  }
  createService(data: Partial<Service>) {
    return this.http.post<Service>(`${this.api}/vendor/services`, data);
  }
  updateService(id: number, data: Partial<Service>) {
    return this.http.put<Service>(`${this.api}/vendor/services/${id}`, data);
  }
  toggleService(id: number) {
    return this.http.patch<Service>(`${this.api}/vendor/services/${id}/toggle`, {});
  }
  deleteService(id: number) {
    return this.http.delete(`${this.api}/vendor/services/${id}`);
  }

  // ---- Messages ----
  messages(bookingId: number) {
    return this.http.get<any[]>(`${this.api}/bookings/${bookingId}/messages`);
  }
  sendMessage(bookingId: number, body: string) {
    return this.http.post<any>(`${this.api}/bookings/${bookingId}/messages`, { body });
  }

  // ---- Notifications ----
  notifications() {
    return this.http.get<{ items: AppNotification[]; unread: number }>(`${this.api}/notifications`);
  }
  markNotificationRead(id: number) {
    return this.http.patch(`${this.api}/notifications/${id}/read`, {});
  }
  markAllNotificationsRead() {
    return this.http.patch(`${this.api}/notifications/read-all`, {});
  }

  // ---- Options (configurable dropdown lists) ----
  options() {
    return this.http.get<Record<string, Option[]>>(`${this.api}/options`);
  }
  adminOptions() {
    return this.http.get<Record<string, Option[]>>(`${this.api}/admin/options`);
  }
  createOption(data: { group: string; label: string; value?: string }) {
    return this.http.post<Option>(`${this.api}/admin/options`, data);
  }
  updateOption(id: number, data: { label: string; sort_order?: number }) {
    return this.http.put<Option>(`${this.api}/admin/options/${id}`, data);
  }
  toggleOption(id: number) {
    return this.http.patch<Option>(`${this.api}/admin/options/${id}/toggle`, {});
  }
  deleteOption(id: number) {
    return this.http.delete(`${this.api}/admin/options/${id}`);
  }

  // ---- Admin ----
  adminUsers(params?: Record<string, string>) {
    return this.http.get<User[]>(`${this.api}/admin/users`, { params });
  }
  toggleUser(id: number) {
    return this.http.patch<User>(`${this.api}/admin/users/${id}/toggle`, {});
  }
  verifyVendor(id: number) {
    return this.http.patch<VendorProfile>(`${this.api}/admin/vendors/${id}/verify`, {});
  }
  adminReports() {
    return this.http.get<any>(`${this.api}/admin/reports`);
  }
}
