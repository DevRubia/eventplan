import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);
  unread = signal(0);
  private timer?: any;

  // Begin polling the unread count (called when a user is logged in).
  start(): void {
    this.refresh();
    this.stop();
    this.timer = setInterval(() => this.refresh(), 20000); // every 20s
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  refresh(): void {
    if (!localStorage.getItem('ep_token')) {
      this.unread.set(0);
      return;
    }
    this.api.notifications().subscribe({
      next: (r) => this.unread.set(r.unread),
      error: () => {},
    });
  }
}
