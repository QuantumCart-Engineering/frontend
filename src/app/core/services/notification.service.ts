import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: Toast['type'] = 'info', duration = 4000) {
    const id = Date.now() + Math.random();
    const toast: Toast = { id, type, message };
    this._toasts.update((t) => [...t, toast]);
    setTimeout(() => {
      this._toasts.update((t) => t.filter((x) => x.id !== id));
    }, duration);
  }

  showSuccess(message: string) {
    this.show(message, 'success');
  }

  showError(message: string) {
    this.show(message, 'error', 6000);
  }

  dismiss(id: number) {
    this._toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
