import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <div class="container inner fade-in">
        <span class="code">404</span>
        <h1 class="title">This dimension doesn’t exist</h1>
        <p class="subtitle">The page you’re looking for may have moved or never existed.</p>
        <div class="actions">
          <a class="btn" routerLink="/">Return home</a>
          <a class="btn ghost" routerLink="/products">Browse catalog</a>
        </div>
      </div>
    </main>
  `,
  styles: [
    `
      .not-found {
        padding: var(--qc-space-16) var(--qc-space-4);
        min-height: 60vh;
        display: flex;
        align-items: center;
      }
      .inner {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--qc-space-4);
      }
      .code {
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-size: clamp(4rem, 12vw, 8rem);
        font-weight: 700;
        line-height: 1;
        background: linear-gradient(90deg, var(--qc-primary), var(--qc-violet));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .title {
        font-size: clamp(1.75rem, 4vw, 2.5rem);
      }
      .subtitle {
        color: var(--qc-text-muted);
        max-width: 44ch;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--qc-space-4);
        justify-content: center;
      }
    `,
  ],
})
export class NotFoundPage {}
