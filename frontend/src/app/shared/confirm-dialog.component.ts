import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../core/confirm.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (confirm.state(); as s) {
      <div class="modal-overlay" (click)="confirm.respond(false)">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-icon" [class]="s.tone">
            <app-icon [name]="s.icon" [size]="24"></app-icon>
          </div>
          <h3 class="modal-title">{{ s.title }}</h3>
          <p class="modal-message">{{ s.message }}</p>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="confirm.respond(false)">{{ s.cancelText }}</button>
            <button class="btn" [class.btn-bad]="s.tone === 'danger'" [class.btn-ok]="s.tone === 'success'"
              (click)="confirm.respond(true)">{{ s.confirmText }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  confirm = inject(ConfirmService);
}
