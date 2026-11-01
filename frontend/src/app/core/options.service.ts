import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Option } from './models';

// Loads the admin-configurable dropdown lists (categories, event types, units,
// payment methods) once and caches them so every form stays in sync.
@Injectable({ providedIn: 'root' })
export class OptionsService {
  private api = inject(ApiService);
  private cache = signal<Record<string, Option[]>>({});

  constructor() {
    this.load();
  }

  load(): void {
    this.api.options().subscribe({
      next: (g) => this.cache.set(g ?? {}),
      error: () => {},
    });
  }

  // Active options for a group (reactive — reading in a template tracks the signal).
  group(name: string): Option[] {
    return this.cache()[name] ?? [];
  }
}
