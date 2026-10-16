import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="empty surface fade-in" role="status">
      <div class="empty-icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="var(--qc-primary-border)" stroke-width="2" />
          <path
            d="M14 16L26 24M26 16L14 24"
            stroke="var(--qc-violet)"
            stroke-width="2"
            stroke-linecap="round"
            opacity="0.7"
          />
        </svg>
      </div>
      <h2 class="empty-title">{{ title }}</h2>
      @if (subtitle) {
        <p class="empty-subtitle">{{ subtitle }}</p>
      }
      @if (cta && ctaLink) {
        <a class="btn" [routerLink]="ctaLink">{{ cta }}</a>
      }
    </div>
  `,
  styles: [
    `
      .empty {
        text-align: center;
        padding: var(--qc-space-16) var(--qc-space-6);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--qc-space-4);
      }
      .empty-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 4rem;
        height: 4rem;
        border-radius: 999px;
        border: 1px solid var(--qc-border);
        background: radial-gradient(200px 100% at 50% 0%, var(--qc-primary-soft), transparent);
      }
      .empty-title {
        font-size: 1.4rem;
      }
      .empty-subtitle {
        color: var(--qc-text-muted);
        max-width: 44ch;
      }
    `,
  ],
})
export class EmptyState {
  @Input() title = 'Nothing here yet';
  @Input() subtitle = '';
  @Input() cta = '';
  @Input() ctaLink = '';
}
