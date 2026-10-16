import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div class="brand-block">
          <a class="brand" routerLink="/">
            <img class="footer-logo" src="assets/images/logo.png" alt="QuantumCart" />
          </a>
          <p class="copy">
            Everyday electronics — mobiles, laptops, audio, wearables and smart home — with a
            simple, dependable shopping experience.
          </p>
        </div>

        <nav class="footer-col" aria-label="Shop">
          <h3 class="footer-heading">Shop</h3>
          <a routerLink="/products">All products</a>
          <a routerLink="/products" [queryParams]="{ search: 'laptops' }">Laptops</a>
          <a routerLink="/products" [queryParams]="{ search: 'audio' }">Audio</a>
          <a routerLink="/products" [queryParams]="{ search: 'wearables' }">Wearables</a>
        </nav>

        <nav class="footer-col" aria-label="Your account">
          <h3 class="footer-heading">Account</h3>
          <a routerLink="/account">Your profile</a>
          <a routerLink="/orders">Orders</a>
          <a routerLink="/cart">Cart</a>
          <a routerLink="/login">Sign in</a>
        </nav>

        <nav class="footer-col" aria-label="Support">
          <h3 class="footer-heading">Help</h3>
          <a routerLink="/products">Browse catalogue</a>
          <a routerLink="/orders">Track an order</a>
          <a routerLink="/account">Manage addresses</a>
        </nav>
      </div>

      <div class="container footer-meta">
        <p class="fine-print">© {{ year }} QuantumCart. All rights reserved.</p>
        <p class="fine-print">Built for everyday electronics shopping.</p>
      </div>
    </footer>
  `,
  styles: [
    `
      .site-footer {
        background: #0f172a;
        color: #cbd5e1;
      }
      .footer-inner {
        padding: var(--qc-space-16) 0 var(--qc-space-10);
        display: grid;
        gap: var(--qc-space-10);
        grid-template-columns: minmax(240px, 1.6fr) repeat(3, minmax(140px, 1fr));
      }
      @media (max-width: 860px) {
        .footer-inner {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 520px) {
        .footer-inner {
          grid-template-columns: 1fr;
        }
      }
      .brand-block {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-4);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        align-self: flex-start;
        padding: var(--qc-space-3) var(--qc-space-4);
        border-radius: var(--qc-radius-md);
        background: #ffffff;
      }
      .footer-logo {
        display: block;
        height: 2rem;
        width: auto;
        object-fit: contain;
      }
      .copy {
        color: #94a3b8;
        max-width: 38ch;
        font-size: 0.95rem;
      }
      .footer-col {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-3);
        font-size: 0.95rem;
      }
      .footer-heading {
        color: #ffffff;
        font-size: 0.85rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: var(--qc-space-1, 0.25rem);
      }
      .footer-col a {
        color: #94a3b8;
        transition: color var(--qc-duration) var(--qc-ease);
      }
      .footer-col a:hover {
        color: #ffffff;
      }
      .footer-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--qc-space-3);
        padding: var(--qc-space-6) 0;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
      }
      .fine-print {
        color: #94a3b8;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class SiteFooter {
  readonly year = new Date().getFullYear();
}
