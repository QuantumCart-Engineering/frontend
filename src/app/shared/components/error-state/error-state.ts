import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="error-state surface fade-in" role="alert">
      <h2 class="title">{{ title }}</h2>
      @if (subtitle) {
        <p class="subtitle">{{ subtitle }}</p>
      }
      @if (showRetry) {
        <button class="btn ghost" type="button" (click)="retry.emit()">Try again</button>
      }
    </div>
  `,
  styles: [
    `
      .error-state {
        text-align: center;
        padding: var(--qc-space-12) var(--qc-space-6);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--qc-space-4);
        border: 1px solid var(--qc-error-border);
      }
      .title {
        font-size: 1.4rem;
      }
      .subtitle {
        color: var(--qc-text-muted);
        max-width: 48ch;
      }
    `,
  ],
})
export class ErrorState {
  @Input() title = 'Something went wrong';
  @Input() subtitle = 'We couldn’t load that data. Please try again.';
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
