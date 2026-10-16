import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../../core/api/catalog-api';
import { ProductWithCategories } from '../../../core/models/product';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCurrency } from '../../../core/utils/money';
import { productPlaceholder, initials } from '../../../core/utils/placeholder';
import { productStatusLabel, productStatusTone, toneClass } from '../../../core/utils/status';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { ErrorState } from '../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [RouterLink, Skeleton, ErrorState],
  template: `
    <main class="page">
      <div class="container">
        <a class="back" routerLink="/products">← Back to products</a>

        @if (loading()) {
          <div class="detail-grid" aria-busy="true">
            <app-skeleton height="440px"></app-skeleton>
            <div class="info">
              <app-skeleton height="34px"></app-skeleton>
              <app-skeleton height="18px"></app-skeleton>
              <app-skeleton height="18px"></app-skeleton>
              <app-skeleton height="52px"></app-skeleton>
            </div>
          </div>
        } @else if (notFound()) {
          <app-error-state
            title="Product not found"
            subtitle="This product may have been removed or is no longer available."
            [showRetry]="false"
          ></app-error-state>
        } @else if (error() || !product()) {
          <app-error-state
            title="Couldn’t load this product"
            subtitle="Please check your connection and try again."
            (retry)="load()"
          ></app-error-state>
        } @else {
          <div class="detail-grid fade-in">
            <div class="visual" [style.background]="placeholder()" aria-hidden="true">
              <span class="monogram">{{ monogram() }}</span>
            </div>

            <div class="info">
              <div class="meta">
                <span class="tag">SKU: {{ product()!.sku }}</span>
                <span [class]="statusClass()">{{ statusLabel() }}</span>
              </div>

              <h1 class="title">{{ product()!.name }}</h1>
              <p class="description">
                {{ product()!.description || 'No description has been provided for this product.' }}
              </p>

              <p class="price">{{ price() }}</p>

              <p class="stock" [class.out]="!inStock()">
                @if (inStock()) {
                  In stock — {{ product()!.stock_quantity }} available
                } @else {
                  Currently out of stock
                }
              </p>

              <div class="purchase">
                <label class="field-label" for="qty">Quantity</label>
                <input
                  id="qty"
                  class="input qty"
                  type="number"
                  min="1"
                  [max]="maxQty()"
                  [value]="quantity()"
                  [disabled]="!inStock()"
                  (input)="onQty($event)"
                />
              </div>

              <div class="actions">
                <button
                  class="btn btn-inline"
                  type="button"
                  [disabled]="adding() || !inStock()"
                  (click)="addToCart()"
                >
                  {{ adding() ? 'Adding…' : 'Add to cart' }}
                </button>
                <button
                  class="btn ghost btn-inline"
                  type="button"
                  [disabled]="!inStock()"
                  (click)="buyNow()"
                >
                  Buy now
                </button>
              </div>

              <section class="specs">
                <h2 class="specs-title">Specifications</h2>
                <dl>
                  <div>
                    <dt>SKU</dt>
                    <dd>{{ product()!.sku }}</dd>
                  </div>
                  <div>
                    <dt>Availability</dt>
                    <dd>{{ inStock() ? product()!.stock_quantity + ' units' : 'Out of stock' }}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{{ statusLabel() }}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        }
      </div>
    </main>
  `,
  styles: [
    `
      .back {
        display: inline-block;
        margin-bottom: var(--qc-space-8);
        color: var(--qc-primary);
        font-weight: 600;
      }
      .back:hover {
        color: var(--qc-primary-700);
      }
      .detail-grid {
        display: grid;
        gap: var(--qc-space-10);
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
        align-items: start;
      }
      .visual {
        aspect-ratio: 1;
        border-radius: var(--qc-radius-xl);
        border: 1px solid var(--qc-border);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-shadow: var(--qc-shadow);
        position: sticky;
        top: 6rem;
      }
      @media (max-width: 880px) {
        .visual {
          position: static;
        }
      }
      .monogram {
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-weight: 700;
        font-size: clamp(2.5rem, 8vw, 5rem);
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--qc-heading);
        opacity: 0.28;
      }
      .info {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-5);
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--qc-space-3);
      }
      .title {
        font-size: clamp(2rem, 4vw, 3rem);
        letter-spacing: -0.02em;
      }
      .description {
        color: var(--qc-text-muted);
      }
      .price {
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        color: var(--qc-heading);
      }
      .stock {
        color: var(--qc-success);
      }
      .stock.out {
        color: var(--qc-warning);
      }
      .purchase {
        max-width: 10rem;
      }
      .qty {
        text-align: center;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--qc-space-4);
      }
      .specs {
        margin-top: var(--qc-space-4);
        border-top: 1px solid var(--qc-border-subtle);
        padding-top: var(--qc-space-6);
      }
      .specs-title {
        font-size: 1.2rem;
        margin-bottom: var(--qc-space-4);
      }
      .specs dl {
        display: flex;
        flex-direction: column;
      }
      .specs dl > div {
        display: flex;
        justify-content: space-between;
        gap: var(--qc-space-4);
        padding: var(--qc-space-3) 0;
        border-bottom: 1px solid var(--qc-border-subtle);
      }
      .specs dt {
        color: var(--qc-text-muted);
      }
      .specs dd {
        text-align: right;
      }
    `,
  ],
})
export class ProductDetailPage implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  private readonly cart = inject(CartStore);
  private readonly notify = inject(NotificationService);

  readonly product = signal<ProductWithCategories | null>(null);
  readonly loading = signal(false);
  readonly adding = signal(false);
  readonly notFound = signal(false);
  readonly error = signal(false);
  readonly quantity = signal(1);

  readonly inStock = computed(() => (this.product()?.stock_quantity ?? 0) > 0);
  readonly maxQty = computed(() => Math.max(1, this.product()?.stock_quantity ?? 1));
  readonly price = computed(() => {
    const p = this.product();
    return p ? formatCurrency(p.price) : '';
  });
  readonly placeholder = computed(() => {
    const p = this.product();
    return p ? productPlaceholder(p.sku || p.id) : '';
  });
  readonly monogram = computed(() => {
    const p = this.product();
    return p ? initials(p.name) : 'QC';
  });
  readonly statusLabel = computed(() => {
    const p = this.product();
    return p ? productStatusLabel(p.status) : '';
  });
  readonly statusClass = computed(() => {
    const p = this.product();
    return p ? toneClass(productStatusTone(p.status)) : 'badge';
  });

  ngOnInit() {
    this.load();
  }

  async load() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      return;
    }
    this.loading.set(true);
    this.error.set(false);
    this.notFound.set(false);
    try {
      const p = await firstValueFrom(this.api.getProduct(id));
      this.product.set(p);
      this.quantity.set(p.stock_quantity > 0 ? 1 : 0);
    } catch (e: unknown) {
      if ((e as { status?: number })?.status === 404) {
        this.notFound.set(true);
      } else {
        this.error.set(true);
      }
    } finally {
      this.loading.set(false);
    }
  }

  onQty(event: Event) {
    const raw = Number((event.target as HTMLInputElement).value) || 1;
    this.quantity.set(Math.min(this.maxQty(), Math.max(1, raw)));
  }

  async addToCart() {
    const p = this.product();
    if (!p || !this.inStock()) return;
    this.adding.set(true);
    try {
      const qty = this.quantity();
      if (this.auth.isAuthenticated()) {
        await this.cart.hydrate();
        const c = this.cart.cart();
        if (!c) {
          this.notify.showError('Could not reach your cart. Please try again.');
          return;
        }
        await this.cart.addToServer(c.id, p.id, qty);
      } else {
        this.cart.addGuest(p.id, qty, { name: p.name, sku: p.sku, unitPrice: p.price });
      }
      this.notify.showSuccess(`${p.name} added to cart`);
    } catch {
      // error interceptor surfaces the message
    } finally {
      this.adding.set(false);
    }
  }

  async buyNow() {
    const p = this.product();
    if (!p || !this.inStock()) return;
    await this.router.navigate(['/checkout'], {
      queryParams: { productId: p.id, quantity: this.quantity() },
    });
  }
}
