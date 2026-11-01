import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { NotificationService } from './core/notification.service';
import { IconComponent } from './shared/icon.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ConfirmDialogComponent],
  template: `
    <div class="app-shell">
      <!-- Mobile top bar -->
      <header class="topbar">
        <button class="icon-btn" (click)="mobileOpen.set(true)" aria-label="Open menu">
          <app-icon name="menu" [size]="24"></app-icon>
        </button>
        <span class="nav-brand"><app-icon name="sparkles" [size]="20"></app-icon> EventPlan</span>
        @if (auth.isLoggedIn()) {
          <a routerLink="/notifications" class="icon-btn topbar-bell" style="margin-left:auto" aria-label="Notifications">
            <app-icon name="bell" [size]="22"></app-icon>
            @if (notif.unread() > 0) { <span class="nav-badge dot">{{ notif.unread() }}</span> }
          </a>
          <div class="avatar">{{ initials() }}</div>
        }
      </header>

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="mobileOpen()" [class.collapsed]="collapsed() && !isMobile()">
        <div class="sidebar-brand">
          <app-icon name="sparkles" [size]="22"></app-icon>
          <span class="brand-text">EventPlan</span>
          @if (!isMobile()) {
            <button class="icon-btn collapse-btn" (click)="toggleCollapse()" aria-label="Collapse sidebar">
              <app-icon [name]="collapsed() ? 'chevronRight' : 'chevronLeft'" [size]="18"></app-icon>
            </button>
          } @else {
            <button class="icon-btn collapse-btn" (click)="closeMobile()" aria-label="Close menu">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          }
        </div>

        <nav class="sidebar-nav">
          <a class="side-link" routerLink="/home" routerLinkActive="active" (click)="closeMobile()" title="Browse">
            <app-icon name="search" [size]="19"></app-icon><span>Browse services</span>
          </a>

          @if (auth.isLoggedIn()) {
            <a class="side-link" routerLink="/dashboard" routerLinkActive="active" (click)="closeMobile()" title="Dashboard">
              <app-icon name="dashboard" [size]="19"></app-icon><span>Dashboard</span>
            </a>

            @if (auth.role() === 'client') {
              <a class="side-link" routerLink="/events" routerLinkActive="active" (click)="closeMobile()" title="My Events">
                <app-icon name="calendar" [size]="19"></app-icon><span>My Events</span>
              </a>
            }
            @if (auth.role() === 'vendor') {
              <a class="side-link" routerLink="/vendor/services" routerLinkActive="active" (click)="closeMobile()" title="My Services">
                <app-icon name="store" [size]="19"></app-icon><span>My Services</span>
              </a>
            }
            <a class="side-link" routerLink="/my-bookings" routerLinkActive="active" (click)="closeMobile()" title="Bookings">
              <app-icon name="list" [size]="19"></app-icon><span>Bookings</span>
            </a>
            <a class="side-link" routerLink="/notifications" routerLinkActive="active" (click)="closeMobile()" title="Notifications">
              <app-icon name="bell" [size]="19"></app-icon><span>Notifications</span>
              @if (notif.unread() > 0) { <span class="nav-badge">{{ notif.unread() }}</span> }
            </a>

            @if (auth.role() === 'vendor') {
              <div class="side-section">Account</div>
              <a class="side-link" routerLink="/vendor/profile" routerLinkActive="active" (click)="closeMobile()" title="Profile">
                <app-icon name="user" [size]="19"></app-icon><span>Business Profile</span>
              </a>
            }
            @if (auth.role() === 'admin') {
              <div class="side-section">Administration</div>
              <a class="side-link" routerLink="/admin/users" routerLinkActive="active" (click)="closeMobile()" title="Users">
                <app-icon name="users" [size]="19"></app-icon><span>Users &amp; Vendors</span>
              </a>
              <a class="side-link" routerLink="/admin/payment-settings" routerLinkActive="active" (click)="closeMobile()" title="Payment settings">
                <app-icon name="card" [size]="19"></app-icon><span>Payment Settings</span>
              </a>
              <a class="side-link" routerLink="/admin/options" routerLinkActive="active" (click)="closeMobile()" title="Configuration">
                <app-icon name="settings" [size]="19"></app-icon><span>Configuration</span>
              </a>
            }
          }
        </nav>

        <!-- User / profile section -->
        <div class="sidebar-user">
          @if (auth.isLoggedIn()) {
            <div class="user-box">
              <div class="avatar">{{ initials() }}</div>
              <div class="user-meta">
                <div class="uname">{{ auth.user()?.name }}</div>
                <div class="urole">{{ auth.role() }}</div>
              </div>
            </div>
            <button class="btn btn-outline btn-sm btn-block mt-2" (click)="logout()" title="Logout">
              <app-icon name="logout" [size]="15"></app-icon><span class="logout-text">Logout</span>
            </button>
          } @else {
            <a routerLink="/login" class="btn btn-outline btn-block" (click)="closeMobile()"><span class="logout-text">Login</span></a>
            <a routerLink="/register" class="btn btn-block mt-2" (click)="closeMobile()"><span class="logout-text">Sign up</span></a>
          }
        </div>
      </aside>

      <!-- Mobile overlay -->
      <div class="sidebar-overlay" [class.show]="mobileOpen() && isMobile()" (click)="closeMobile()"></div>

      <!-- Main content -->
      <main class="app-main" [class.collapsed]="collapsed() && !isMobile()">
        <router-outlet />
      </main>
    </div>

    <app-confirm-dialog />
  `,
})
export class AppComponent {
  auth = inject(AuthService);
  notif = inject(NotificationService);
  private router = inject(Router);

  constructor() {
    // Start/stop live unread polling as the user logs in/out.
    effect(() => {
      if (this.auth.isLoggedIn()) this.notif.start();
      else this.notif.stop();
    });
  }

  isMobile = signal(typeof window !== 'undefined' && window.innerWidth < 900);
  mobileOpen = signal(false);
  collapsed = signal(localStorage.getItem('ep_sidebar_collapsed') === '1');

  initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    const parts = name.trim().split(/\s+/);
    const init = (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '');
    return init.toUpperCase() || 'U';
  });

  @HostListener('window:resize')
  onResize(): void {
    const mobile = window.innerWidth < 900;
    this.isMobile.set(mobile);
    if (!mobile) this.mobileOpen.set(false);
  }

  toggleCollapse(): void {
    this.collapsed.set(!this.collapsed());
    localStorage.setItem('ep_sidebar_collapsed', this.collapsed() ? '1' : '0');
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.closeMobile();
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}
