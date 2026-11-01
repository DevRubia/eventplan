import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },

  // Public
  { path: 'home', loadComponent: () => import('./pages/home.component').then((m) => m.HomeComponent) },
  { path: 'services/:id', loadComponent: () => import('./pages/service-detail.component').then((m) => m.ServiceDetailComponent) },
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register.component').then((m) => m.RegisterComponent) },

  // Authenticated
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent) },
  { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./pages/notifications.component').then((m) => m.NotificationsComponent) },

  // Client
  { path: 'events', canActivate: [roleGuard], data: { roles: ['client', 'admin'] }, loadComponent: () => import('./pages/events.component').then((m) => m.EventsComponent) },
  { path: 'events/:id', canActivate: [roleGuard], data: { roles: ['client', 'admin'] }, loadComponent: () => import('./pages/event-detail.component').then((m) => m.EventDetailComponent) },
  { path: 'my-bookings', canActivate: [authGuard], loadComponent: () => import('./pages/bookings.component').then((m) => m.BookingsComponent) },

  // Vendor
  { path: 'vendor/services', canActivate: [roleGuard], data: { roles: ['vendor'] }, loadComponent: () => import('./pages/vendor-services.component').then((m) => m.VendorServicesComponent) },
  { path: 'vendor/profile', canActivate: [roleGuard], data: { roles: ['vendor'] }, loadComponent: () => import('./pages/vendor-profile.component').then((m) => m.VendorProfileComponent) },

  // Admin
  { path: 'admin/users', canActivate: [roleGuard], data: { roles: ['admin'] }, loadComponent: () => import('./pages/admin-users.component').then((m) => m.AdminUsersComponent) },
  { path: 'admin/payment-settings', canActivate: [roleGuard], data: { roles: ['admin'] }, loadComponent: () => import('./pages/payment-settings.component').then((m) => m.PaymentSettingsComponent) },
  { path: 'admin/options', canActivate: [roleGuard], data: { roles: ['admin'] }, loadComponent: () => import('./pages/system-options.component').then((m) => m.SystemOptionsComponent) },

  { path: '**', redirectTo: 'home' },
];
