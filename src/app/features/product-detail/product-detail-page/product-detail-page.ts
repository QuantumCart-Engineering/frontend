import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../../core/api/catalog-api';
import { ProductImage, ProductWithCategories } from '../../../core/models/product';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCurrency } from '../../../core/utils/money';
import { productPlaceholder, initials } from '../../../core/utils/placeholder';
import { productStatusLabel, productStatusTone, toneClass } from '../../../core/utils/status';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { API_BASE_URL } from '../../../core/config/app-config';
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
            <div class="product-gallery">
              <div
                class="main-image-container"
                [class.has-image]="!!currentImageUrl()"
                (touchstart)="onImageSwipeStart($event)"
                (touchend)="onImageSwipeEnd($event)"
              >
                @if (currentImageUrl()) {
                  <img
                    class="product-image"
                    [src]="currentImageUrl()"
                    [alt]="product()!.name"
                    loading="lazy"
                  />
                } @else {
                  <div class="visual-placeholder" [style.background]="placeholder()" aria-hidden="true">
                    <span class="monogram">{{ monogram() }}</span>
                  </div>
                }
                @if (images().length > 1) {
                  <button
                    class="nav prev"
                    type="button"
                    aria-label="Previous image"
                    (click)="prevImage()"
                  >‹</button>
                  <button
                    class="nav next"
                    type="button"
                    aria-label="Next image"
                    (click)="nextImage()"
                  >›</button>
                  <span class="counter">{{ activeImageIndex() + 1 }} / {{ images().length }}</span>
                }
              </div>

              @if (images().length > 1) {
                <div class="thumbnail-strip">
                  @for (img of images(); track img.id; let i = $index) {
                    <button
                      class="thumb"
                      type="button"
                      [class.active]="i === activeImageIndex()"
                      (click)="goToImage(i)"
                      [attr.aria-label]="'View image ' + (i + 1)"
                    >
                      <img [src]="apiBaseUrl + img.url" [alt]="product()!.name + ' image ' + (i + 1)" loading="lazy" />
                    </button>
                  }
                </div>
              }
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
      .monogram {
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-weight: 700;
        font-size: clamp(2.5rem, 8vw, 5rem);
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--qc-heading);
        opacity: 0.28;
      }
      .product-gallery {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-4);
        width: 100%;
      }
      .main-image-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: var(--qc-radius-xl);
        border: 1px solid var(--qc-border);
        overflow: hidden;
        box-shadow: var(--qc-shadow);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--qc-surface-solid);
      }
      .product-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .visual-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .main-image-container.has-image {
        padding: 0;
      }
      .nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0,0,0,0.5);
        color: #fff;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
        z-index: 2;
      }
      .nav.prev { left: 8px; }
      .nav.next { right: 8px; }
      .counter {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0,0,0,0.6);
        color: #fff;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        z-index: 2;
      }
      .thumbnail-strip {
        display: flex;
        gap: var(--qc-space-2);
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: var(--qc-space-1);
      }
      .thumb {
        width: 70px;
        height: 70px;
        border: 2px solid var(--qc-border);
        border-radius: var(--qc-radius-md);
        padding: 0;
        overflow: hidden;
        background: var(--qc-surface-solid);
        flex-shrink: 0;
        cursor: pointer;
      }
      .thumb.active {
        border-color: var(--qc-primary);
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: contain;
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

  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly images = computed<ProductImage[]>(() => {
    const p = this.product();
    const imgs = (p as any)?.images ?? [];
    return [...imgs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  });

  readonly activeImageIndex = signal(0);

  readonly currentImageUrl = computed(() => {
    const imgs = this.images();
    if (!imgs.length) {
      return null;
    }
    const idx = Math.min(Math.max(this.activeImageIndex(), 0), imgs.length - 1);
    const url = imgs[idx]?.url;
    if (!url) {
      return null;
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return `${this.apiBaseUrl}${url}`;
  });

  nextImage() {
    const imgs = this.images();
    if (imgs.length <= 1) return;
    this.activeImageIndex.update((i) => (i + 1) % imgs.length);
  }

  prevImage() {
    const imgs = this.images();
    if (imgs.length <= 1) return;
    this.activeImageIndex.update((i) => (i - 1 + imgs.length) % imgs.length);
  }

  goToImage(i: number) {
    const imgs = this.images();
    if (i < 0 || i >= imgs.length) return;
    this.activeImageIndex.set(i);
  }

  onImageSwipeStart(event: TouchEvent) {
    (event.currentTarget as HTMLElement).dataset['swipeX'] = String(event.touches[0].clientX);
  }

  onImageSwipeEnd(event: TouchEvent) {
    const el = event.currentTarget as HTMLElement;
    const startX = Number(el.dataset['swipeX'] || '0');
    const endX = event.changedTouches[0].clientX;
    const delta = endX - startX;
    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        this.nextImage();
      } else {
        this.prevImage();
      }
    }
    delete el.dataset['swipeX'];
  }

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
