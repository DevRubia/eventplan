import { Injectable, signal } from '@angular/core';

export type ConfirmTone = 'default' | 'danger' | 'success';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  icon?: string;
}

interface ConfirmState extends Required<ConfirmOptions> {}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  state = signal<ConfirmState | null>(null);
  private resolver?: (value: boolean) => void;

  // Returns a promise that resolves true (confirmed) or false (cancelled/dismissed).
  ask(opts: ConfirmOptions): Promise<boolean> {
    this.state.set({
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      tone: 'default',
      icon: 'info',
      ...opts,
    });
    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  respond(confirmed: boolean): void {
    this.state.set(null);
    this.resolver?.(confirmed);
    this.resolver = undefined;
  }
}
