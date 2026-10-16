import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCurrency, toLineTotal } from '../../../core/utils/money';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';

interface LineView {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
}

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, EmptyState, ErrorState, Skeleton],
  template: `
    <main class="page">
      <div class="container">
        <header class="page-header">
          <span class="eyebrow">Cart</span>
          <h1 class="page-title">Your cart</h1>
          <p class="page-subtitle">Review your items before proceeding to checkout.</p>
        </header>

        @if (!isAuth()) {
          <p class="guest-note" role="status">
            You’re checking out as a guest.
            <a class="link" routerLink="/login" [queryParams]="{ returnUrl: '/cart' }">Sign in</a>
            to save your cart across devices.
          </p>
        }

        @if (loading() && lines().length === 0) {
          <div class="lines" aria-busy="true">
            <app-skeleton height="120px"></app-skeleton>
            <app-skeleton height="120px"></app-skeleton>
          </div>
        } @else if (error()) {
          <app-error-state
            title="Couldn’t load your cart"
            subtitle="Please try again in a moment."
            (retry)="reload()"
          ></app-error-state>
        } @else if (lines().length > 0) {
          <div class="layout">
            <div class="lines">
              @for (item of lines(); track item.productId) {
                <article class="line surface">
                  <div class="line-main">
                    <h2 class="line-title">{{ item.name }}</h2>
                    @if (item.sku) {
                      <span class="line-sku">SKU: {{ item.sku }}</span>
                    }
                    <span class="line-price">{{ unitPriceText(item) }}</span>
                  </div>

                  <div
                    class="qty-controls"
                    role="group"
                    [attr.aria-label]="'Quantity for ' + item.name"
                  >
                    <button
                      class="icon-btn"
                      type="button"
                      (click)="changeQty(item, item.quantity - 1)"
                      [attr.aria-label]="'Decrease quantity of ' + item.name"
                      [disabled]="item.quantity <= 1"
                    >
                      −
                    </button>
                    <span class="qty-value" aria-live="polite">{{ item.quantity }}</span>
                    <button
                      class="icon-btn"
                      type="button"
                      (click)="changeQty(item, item.quantity + 1)"
                      [attr.aria-label]="'Increase quantity of ' + item.name"
                    >
                      +
                    </button>
                  </div>

                  <div class="line-total">
                    <span>{{ lineTotalText(item) }}</span>
                    <button
                      class="link danger"
                      type="button"
                      (click)="remove(item)"
                      [attr.aria-label]="'Remove ' + item.name + ' from cart'"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              }

              <button class="btn ghost btn-inline clear" type="button" (click)="clearAll()">
                Clear cart
              </button>
            </div>

            <aside class="summary surface-strong">
              <h2 class="summary-title">Order summary</h2>
              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ subtotalText() }}</span>
              </div>
              <div class="summary-row muted">
                <span>Taxes &amp; shipping</span>
                <span>Calculated at payment</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>{{ subtotalText() }}</span>
              </div>
              <button class="btn" type="button" (click)="checkout()">Proceed to checkout</button>
              <a class="continue" routerLink="/products">Continue shopping</a>
            </aside>
          </div>
        } @else {
          <app-empty-state
            title="Your cart is empty"
            subtitle="Browse the catalog and add products to get started."
            cta="Shop products"
            ctaLink="/products"
          ></app-empty-state>
        }
      </div>
    </main>
  `,
  styles: [
    `
      .guest-note {
        color: var(--qc-text-muted);
        margin-bottom: var(--qc-space-6);
      }
      .layout {
        display: grid;
        gap: var(--qc-space-8);
        grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
        align-items: start;
      }
      @media (max-width: 860px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
      .lines {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-4);
      }
      .line {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: var(--qc-space-6);
        align-items: center;
        padding: var(--qc-space-6);
      }
      @media (max-width: 640px) {
        .line {
          grid-template-columns: 1fr;
          gap: var(--qc-space-4);
        }
        .line-total {
          align-items: flex-start;
        }
      }
      .line-main {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-2);
      }
      .line-title {
        font-size: 1.15rem;
      }
      .line-sku,
      .line-price {
        color: var(--qc-text-muted);
        font-size: 0.95rem;
      }
      .qty-controls {
        display: inline-flex;
        align-items: center;
        gap: var(--qc-space-3);
        border: 1px solid var(--qc-border);
        border-radius: 999px;
        padding: 0.25rem;
      }
      .qty-value {
        min-width: 2ch;
        text-align: center;
      }
      .line-total {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--qc-space-2);
        font-weight: 600;
      }
      .clear {
        align-self: flex-start;
      }
      .continue {
        text-align: center;
        color: var(--qc-text-muted);
        font-size: 0.95rem;
      }
    `,
  ],
})
export class CartPage implements OnInit {
  private readonly cart = inject(CartStore);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly isAuth = this.auth.isAuthenticated;
  readonly loading = this.cart.loading;
  readonly error = signal(false);

  readonly lines = computed<LineView[]>(() => {
    if (this.auth.isAuthenticated()) {
      return this.cart.itemsEnriched().map((i) => ({
        productId: i.product_id,
        name: i.product?.name ?? 'Product',
        sku: i.product?.sku,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        lineTotal: i.lineTotal,
      }));
    }
    return this.cart.guestItems().map((g) => ({
      productId: g.productId,
      name: g.name ?? 'Product',
      sku: g.sku,
      quantity: g.quantity,
      unitPrice: g.unitPrice ?? null,
      lineTotal: g.unitPrice != null ? toLineTotal(g.quantity, g.unitPrice) : null,
    }));
  });

  readonly subtotal = computed(() => this.lines().reduce((sum, l) => sum + (l.lineTotal ?? 0), 0));
  readonly subtotalText = computed(() => formatCurrency(this.subtotal()));

  ngOnInit() {
    this.reload();
  }

  reload() {
    if (!this.auth.isAuthenticated()) return;
    this.error.set(false);
    this.cart.hydrate().catch(() => this.error.set(true));
  }

  unitPriceText(item: LineView) {
    return item.unitPrice == null ? '—' : formatCurrency(item.unitPrice);
  }

  lineTotalText(item: LineView) {
    return item.lineTotal == null ? '—' : formatCurrency(item.lineTotal);
  }

  async changeQty(item: LineView, quantity: number) {
    if (quantity < 1) return;
    try {
      if (this.auth.isAuthenticated()) {
        const c = this.cart.cart();
        if (!c) return;
        await this.cart.updateServer(c.id, item.productId, quantity);
      } else {
        this.cart.updateGuest(item.productId, quantity);
      }
    } catch {
      // interceptor surfaces error
    }
  }

  async remove(item: LineView) {
    try {
      if (this.auth.isAuthenticated()) {
        const c = this.cart.cart();
        if (!c) return;
        await this.cart.removeServer(c.id, item.productId);
      } else {
        this.cart.removeGuest(item.productId);
      }
      this.notify.showSuccess(`${item.name} removed`);
    } catch {
      // interceptor surfaces error
    }
  }

  async clearAll() {
    try {
      if (this.auth.isAuthenticated()) {
        const c = this.cart.cart();
        if (!c) return;
        await this.cart.clearServer(c.id);
      } else {
        this.cart.clearGuest();
      }
    } catch {
      // interceptor surfaces error
    }
  }

  async checkout() {
    await this.router.navigate(['/checkout']);
  }
}
