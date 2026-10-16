import { Component, inject, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCurrency } from '../../../core/utils/money';
import { productPlaceholder, initials } from '../../../core/utils/placeholder';
import { productStatusLabel, productStatusTone, toneClass } from '../../../core/utils/status';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="product-card surface">
      <a
        class="image-link"
        [routerLink]="['/products', product.id]"
        [attr.aria-label]="'View details for ' + product.name"
      >
        <div class="image" [style.background]="placeholder">
          <span class="monogram" aria-hidden="true">{{ monogram }}</span>
          <span class="status-wrap">
            <span [class]="statusClass">{{ statusLabel }}</span>
          </span>
        </div>
      </a>

      <div class="content">
        <a class="title-link" [routerLink]="['/products', product.id]">
          <h3 class="title">{{ product.name }}</h3>
        </a>

        <p class="availability" [class.out]="!inStock">
          <span class="dot" aria-hidden="true"></span>
          {{ inStock ? 'In stock' : 'Out of stock' }}
        </p>

        <p class="price">{{ price }}</p>

        <div class="actions">
          <button
            class="btn add"
            type="button"
            [disabled]="adding() || !inStock"
            (click)="addToCart()"
          >
            {{ adding() ? 'Adding…' : 'Add to cart' }}
          </button>
          <a class="details" [routerLink]="['/products', product.id]">Details</a>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .product-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        transition:
          transform var(--qc-duration) var(--qc-ease),
          border-color var(--qc-duration) var(--qc-ease),
          box-shadow var(--qc-duration) var(--qc-ease);
      }
      .product-card:hover,
      .product-card:focus-within {
        transform: translateY(-4px);
        border-color: var(--qc-primary-border);
        box-shadow: var(--qc-shadow-hover);
      }
      .image-link {
        display: block;
        border-radius: var(--qc-radius-lg) var(--qc-radius-lg) 0 0;
      }
      .image-link:focus-visible {
        outline: 2px solid var(--qc-primary);
        outline-offset: 2px;
      }
      .image {
        position: relative;
        aspect-ratio: 4 / 3;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-bottom: 1px solid var(--qc-border-subtle);
      }
      .monogram {
        position: relative;
        z-index: 1;
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-weight: 700;
        font-size: 2.1rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--qc-heading);
        opacity: 0.32;
        transition: transform var(--qc-duration-slow) var(--qc-ease);
      }
      .product-card:hover .monogram {
        transform: scale(1.06);
      }
      .status-wrap {
        position: absolute;
        top: var(--qc-space-4);
        left: var(--qc-space-4);
        z-index: 2;
      }
      .status-wrap .badge {
        background: var(--qc-surface-solid);
        box-shadow: var(--qc-shadow);
      }
      .content {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-2);
        padding: var(--qc-space-6);
        flex: 1;
      }
      .title-link {
        border-radius: var(--qc-radius-xs);
      }
      .title-link:focus-visible {
        outline: 2px solid var(--qc-primary);
        outline-offset: 2px;
      }
      .title {
        font-size: 1.1rem;
        font-weight: 600;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 2.7em;
        transition: color var(--qc-duration) var(--qc-ease);
      }
      .title-link:hover .title {
        color: var(--qc-primary);
      }
      .availability {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: var(--qc-success);
        font-weight: 500;
      }
      .availability.out {
        color: var(--qc-warning);
      }
      .availability .dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 999px;
        background: currentColor;
      }
      .price {
        margin-top: auto;
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-weight: 700;
        font-size: 1.35rem;
        color: var(--qc-heading);
      }
      .actions {
        display: flex;
        align-items: center;
        gap: var(--qc-space-4);
        margin-top: var(--qc-space-3);
      }
      .add {
        flex: 1 1 auto;
        padding: 0.6rem 1.1rem;
      }
      .details {
        color: var(--qc-primary);
        font-weight: 600;
        font-size: 0.9rem;
        white-space: nowrap;
      }
      .details:hover {
        color: var(--qc-primary-700);
        text-decoration: underline;
      }
    `,
  ],
})
export class ProductCard {
  @Input({ required: true }) product!: Product;

  private readonly auth = inject(AuthStore);
  private readonly cart = inject(CartStore);
  private readonly notify = inject(NotificationService);

  readonly adding = signal(false);

  get price() {
    return formatCurrency(this.product.price);
  }
  get placeholder() {
    return productPlaceholder(this.product.sku || this.product.id);
  }
  get monogram() {
    return initials(this.product.name);
  }
  get statusLabel() {
    return productStatusLabel(this.product.status);
  }
  get statusClass() {
    return toneClass(productStatusTone(this.product.status));
  }
  get inStock() {
    return this.product.status === 'ACTIVE' && this.product.stock_quantity > 0;
  }

  async addToCart() {
    const p = this.product;
    if (!this.inStock || this.adding()) return;
    this.adding.set(true);
    try {
      if (this.auth.isAuthenticated()) {
        await this.cart.hydrate();
        const c = this.cart.cart();
        if (!c) {
          this.notify.showError('Could not reach your cart. Please try again.');
          return;
        }
        await this.cart.addToServer(c.id, p.id, 1);
      } else {
        this.cart.addGuest(p.id, 1, { name: p.name, sku: p.sku, unitPrice: p.price });
      }
      this.notify.showSuccess(`${p.name} added to cart`);
    } catch {
      // error interceptor surfaces the message
    } finally {
      this.adding.set(false);
    }
  }
}
