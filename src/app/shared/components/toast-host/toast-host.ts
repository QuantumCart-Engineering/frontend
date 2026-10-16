import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.css',
})
export class ToastHost {
  private readonly notify = inject(NotificationService);
  readonly toasts = this.notify.toasts;

  dismiss(id: number) {
    this.notify.dismiss(id);
  }
}
