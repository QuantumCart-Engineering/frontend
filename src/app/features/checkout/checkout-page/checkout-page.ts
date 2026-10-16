import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../../core/api/catalog-api';
import { Order } from '../../../core/models/order';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { NotificationService } from '../../../core/services/notification.service';
import { OrderStore } from '../../../core/services/order-store';
import { formatCurrency, toLineTotal } from '../../../core/utils/money';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';

type PaymentMethod = 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';

interface BuyNowProduct {
  id: string;
  name: string;
  price: number;
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Skeleton, EmptyState, ErrorState],
  template: `
    <main class="page">
      <div class="container">
        <header class="page-header">
          <span class="eyebrow">Checkout</span>
          <h1 class="page-title">Complete your order</h1>
        </header>

        @if (!isAuth()) {
          <div class="signin-gate surface">
            <h2>Please sign in</h2>
            <p class="page-subtitle">You need an account to place an order and access it later.</p>
            <div class="gate-actions">
              <a
                class="btn btn-inline"
                routerLink="/login"
                [queryParams]="{ returnUrl: safeReturnUrl }"
                >Sign in</a
              >
              <a class="btn ghost btn-inline" routerLink="/register">Create account</a>
            </div>
          </div>
        } @else if (placed(); as order) {
          <div class="confirmation surface-strong fade-in" role="status">
            <span class="badge badge-success">Order placed</span>
            <h2>Thank you for your order</h2>
            <p class="page-subtitle">Your order number is</p>
            <p class="order-number">{{ order.orderNumber }}</p>
            <p class="page-subtitle">
              Status: {{ orderLabel(order.status) }} · Total: {{ money(order.total) }}
            </p>
            <div class="gate-actions">
              <a class="btn btn-inline" routerLink="/orders">View orders</a>
              <a class="btn ghost btn-inline" routerLink="/products">Continue shopping</a>
            </div>
          </div>
        } @else if (loading()) {
          <div class="summary" aria-busy="true">
            <app-skeleton height="96px"></app-skeleton>
            <app-skeleton height="96px"></app-skeleton>
          </div>
        } @else if (loadError()) {
          <app-error-state
            title="Couldn’t prepare checkout"
            subtitle="Please try again."
            (retry)="reload()"
          ></app-error-state>
        } @else if (hasItems()) {
          <div class="layout">
            <form class="form surface" [formGroup]="form" (ngSubmit)="submit()">
              <fieldset class="fieldset">
                <legend class="section-title">Payment method</legend>
                <p class="page-subtitle payment-note">
                  This is a demo environment — no real payment will be processed.
                </p>
                <div class="payment-options">
                  @for (m of methods; track m.value) {
                    <label class="payment-option">
                      <input type="radio" formControlName="paymentMethod" [value]="m.value" />
                      <span>{{ m.label }}</span>
                    </label>
                  }
                </div>
              </fieldset>

              @if (isBuyNow()) {
                <p class="buy-now-note">
                  Buy now: <strong>{{ lineLabel() }}</strong>
                </p>
              }

              <button class="btn" type="submit" [disabled]="form.invalid || submitting()">
                {{ submitting() ? 'Placing order…' : 'Place order' }}
              </button>
            </form>

            <aside class="summary surface-strong">
              <h2 class="summary-title">Order summary</h2>
              @if (isBuyNow()) {
                <div class="summary-row">
                  <span>{{ buyNowProduct()?.name }} × {{ buyNowQty() }}</span>
                  <span>{{ buyNowLineTotal() }}</span>
                </div>
              } @else {
                @for (l of cartLines(); track l.productId) {
                  <div class="summary-row">
                    <span>{{ l.name }} × {{ l.quantity }}</span>
                    <span>{{ money(l.lineTotal) }}</span>
                  </div>
                }
              }
              <div class="summary-row total">
                <span>Total</span>
                <span>{{ totalText() }}</span>
              </div>
            </aside>
          </div>
        } @else {
          <app-empty-state
            title="Nothing to check out"
            subtitle="Add items to your cart first."
            cta="Shop products"
            ctaLink="/products"
          ></app-empty-state>
        }
      </div>
    </main>
  `,
  styles: [
    `
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
      .form {
        padding: var(--qc-space-8);
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-6);
      }
      .fieldset {
        border: 0;
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-4);
      }
      .payment-note {
        font-size: 0.9rem;
      }
      .payment-options {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-3);
      }
      .payment-option {
        display: flex;
        align-items: center;
        gap: var(--qc-space-3);
        padding: var(--qc-space-4);
        border: 1px solid var(--qc-border);
        border-radius: var(--qc-radius-sm);
        background: var(--qc-panel);
        cursor: pointer;
        transition: border-color var(--qc-duration) var(--qc-ease);
      }
      .payment-option:has(input:checked) {
        border-color: var(--qc-primary);
        box-shadow: 0 0 0 4px var(--qc-primary-soft);
      }
      .payment-option input {
        accent-color: var(--qc-primary);
      }
      .buy-now-note {
        color: var(--qc-text-muted);
      }
      .signin-gate {
        padding: var(--qc-space-12);
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-4);
        align-items: center;
      }
      .gate-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--qc-space-4);
        justify-content: center;
        margin-top: var(--qc-space-4);
      }
      .confirmation {
        padding: var(--qc-space-12);
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-3);
        align-items: center;
      }
      .order-number {
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--qc-primary);
      }
      .confirmation .badge {
        margin-bottom: var(--qc-space-2);
      }
    `,
  ],
})
export class CheckoutPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  private readonly cart = inject(CartStore);
  private readonly orders = inject(OrderStore);
  private readonly catalog = inject(CatalogApi);
  private readonly notify = inject(NotificationService);

  readonly isAuth = this.auth.isAuthenticated;
  readonly submitting = signal(false);
  readonly placed = signal<Order | null>(null);
  readonly buyNowProduct = signal<BuyNowProduct | null>(null);
  readonly buyNowLoading = signal(false);
  readonly loadError = signal(false);

  readonly methods: { value: PaymentMethod; label: string }[] = [
    { value: 'UPI', label: 'UPI' },
    { value: 'DEBIT_CARD', label: 'Debit card' },
    { value: 'CREDIT_CARD', label: 'Credit card' },
  ];

  readonly form = this.fb.group({
    paymentMethod: ['UPI' as PaymentMethod, [Validators.required]],
  });

  private readonly buyNowId = this.route.snapshot.queryParamMap.get('productId');

  readonly isBuyNow = computed(() => !!this.buyNowId);

  readonly buyNowQty = computed(
    () => Number(this.route.snapshot.queryParamMap.get('quantity')) || 1,
  );

  readonly loading = computed(() => this.cart.loading() || this.buyNowLoading());

  readonly cartLines = computed(() =>
    this.cart.itemsEnriched().map((i) => ({
      productId: i.product_id,
      name: i.product?.name ?? 'Product',
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
  );

  readonly cartTotal = computed(() => this.cartLines().reduce((s, l) => s + l.lineTotal, 0));

  readonly hasItems = computed(() =>
    this.isBuyNow() ? !!this.buyNowProduct() : this.cartLines().length > 0,
  );

  readonly safeReturnUrl = this.safeUrl(
    this.route.snapshot.queryParamMap.get('returnUrl') ?? '/checkout',
  );

  readonly totalText = computed(() =>
    this.isBuyNow()
      ? this.money(toLineTotal(this.buyNowQty(), this.buyNowProduct()?.price ?? 0))
      : this.money(this.cartTotal()),
  );

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loadError.set(false);
    if (!this.auth.isAuthenticated()) return;
    if (this.isBuyNow()) {
      this.loadBuyNowProduct(this.buyNowId!);
    } else {
      this.cart.hydrate().catch(() => this.loadError.set(true));
    }
  }

  private async loadBuyNowProduct(productId: string) {
    this.buyNowLoading.set(true);
    try {
      const p = await firstValueFrom(this.catalog.getProduct(productId));
      this.buyNowProduct.set({ id: p.id, name: p.name, price: p.price });
    } catch {
      this.loadError.set(true);
    } finally {
      this.buyNowLoading.set(false);
    }
  }

  private safeUrl(url: string): string {
    return url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }

  money(value: number | null | undefined) {
    return formatCurrency(value ?? 0);
  }

  orderLabel(status: Order['status']) {
    return status === 'CONFIRMED'
      ? 'Confirmed'
      : status === 'CANCELLED'
        ? 'Cancelled'
        : 'Pending payment';
  }

  lineLabel() {
    const p = this.buyNowProduct();
    return p ? `${p.name} × ${this.buyNowQty()}` : '';
  }

  buyNowLineTotal() {
    const p = this.buyNowProduct();
    return this.money(p ? toLineTotal(this.buyNowQty(), p.price) : 0);
  }

  async submit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const paymentMethod = this.form.value.paymentMethod as PaymentMethod;
    try {
      let order: Order;
      if (this.isBuyNow() && this.buyNowProduct()) {
        order = await this.orders.createOrder({
          source: 'BUY_NOW',
          productId: this.buyNowProduct()!.id,
          quantity: this.buyNowQty(),
          paymentMethod,
        });
      } else {
        order = await this.orders.createOrder({ source: 'CART', paymentMethod });
        this.cart.hydrate().catch(() => undefined);
      }
      this.placed.set(order);
      this.notify.showSuccess('Order placed successfully');
    } catch {
      // interceptor surfaces error
    } finally {
      this.submitting.set(false);
    }
  }
}
