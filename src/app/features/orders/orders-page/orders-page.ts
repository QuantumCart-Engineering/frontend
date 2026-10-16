import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../../core/models/order';
import { AuthStore } from '../../../core/services/auth-store';
import { OrderStore } from '../../../core/services/order-store';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCurrency } from '../../../core/utils/money';
import { orderStatusLabel, orderStatusTone, toneClass } from '../../../core/utils/status';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [DatePipe, RouterLink, Skeleton, EmptyState, ErrorState],
  template: `
    <main class="page">
      <div class="container">
        <header class="page-header">
          <span class="eyebrow">Orders</span>
          <h1 class="page-title">Your orders</h1>
          <p class="page-subtitle">Track and review everything you’ve purchased.</p>
        </header>

        @if (!isAuth()) {
          <div class="gate surface">
            <h2>Sign in to view orders</h2>
            <p class="page-subtitle">Your order history is tied to your account.</p>
            <a class="btn btn-inline" routerLink="/login" [queryParams]="{ returnUrl: '/orders' }"
              >Sign in</a
            >
          </div>
        } @else if (loading() && orders().length === 0) {
          <div class="orders" aria-busy="true">
            <app-skeleton height="88px"></app-skeleton>
            <app-skeleton height="88px"></app-skeleton>
            <app-skeleton height="88px"></app-skeleton>
          </div>
        } @else if (error()) {
          <app-error-state
            title="Couldn’t load your orders"
            subtitle="Please try again."
            (retry)="refresh()"
          ></app-error-state>
        } @else if (orders().length > 0) {
          <div class="layout">
            <div class="orders">
              @for (o of orders(); track o.id) {
                <button
                  class="order surface"
                  type="button"
                  [class.active]="selectedId() === o.id"
                  [attr.aria-pressed]="selectedId() === o.id"
                  (click)="select(o.id)"
                >
                  <div class="order-head">
                    <span class="order-number">{{ o.orderNumber }}</span>
                    <span [class]="statusClass(o.status)">{{ statusLabel(o.status) }}</span>
                  </div>
                  <div class="order-meta">
                    <span>{{ o.createdAt | date: 'medium' }}</span>
                    <span class="order-total">{{ money(o.total) }}</span>
                  </div>
                </button>
              }

              @if (hasMore()) {
                <button
                  class="btn ghost btn-inline"
                  type="button"
                  [disabled]="loadingMore()"
                  (click)="loadMore()"
                >
                  {{ loadingMore() ? 'Loading…' : 'Load more orders' }}
                </button>
              }
            </div>

            <aside class="detail surface-strong">
              @if (selected(); as order) {
                <h2 class="detail-title">Order {{ order.orderNumber }}</h2>
                <p class="muted">Placed {{ order.createdAt | date: 'medium' }}</p>
                <div class="items">
                  @for (it of order.items; track it.id) {
                    <div class="item">
                      <div>
                        <p class="item-name">{{ it.productName }}</p>
                        <p class="item-sku">SKU: {{ it.sku }} · Qty {{ it.quantity }}</p>
                      </div>
                      <span>{{ money(it.lineTotal) }}</span>
                    </div>
                  }
                </div>
                <div class="totals">
                  <div class="row">
                    <span>Subtotal</span><span>{{ money(order.subtotal) }}</span>
                  </div>
                  <div class="row total">
                    <span>Total</span><span>{{ money(order.total) }}</span>
                  </div>
                </div>
              } @else {
                <p class="muted">Select an order to view its details.</p>
              }
            </aside>
          </div>
        } @else {
          <app-empty-state
            title="No orders yet"
            subtitle="When you place an order it will appear here."
            cta="Start shopping"
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
        grid-template-columns: minmax(0, 1fr) minmax(300px, 1.2fr);
        align-items: start;
      }
      @media (max-width: 860px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
      .orders {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-4);
      }
      .order {
        text-align: left;
        padding: var(--qc-space-6);
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-3);
        color: var(--qc-text);
        transition: border-color var(--qc-duration) var(--qc-ease);
      }
      .order:hover,
      .order.active {
        border-color: var(--qc-border-strong);
      }
      .order-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--qc-space-4);
      }
      .order-number {
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-weight: 600;
      }
      .order-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--qc-text-muted);
        font-size: 0.95rem;
      }
      .order-total {
        font-weight: 600;
        color: var(--qc-text);
      }
      .detail {
        padding: var(--qc-space-8);
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-4);
        position: sticky;
        top: 6rem;
      }
      @media (max-width: 860px) {
        .detail {
          position: static;
        }
      }
      .detail-title {
        font-size: 1.4rem;
      }
      .muted {
        color: var(--qc-text-muted);
      }
      .items {
        display: flex;
        flex-direction: column;
      }
      .item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--qc-space-4);
        padding: var(--qc-space-3) 0;
        border-bottom: 1px solid var(--qc-border-subtle);
      }
      .item-name {
        font-weight: 600;
      }
      .item-sku {
        color: var(--qc-text-faint);
        font-size: 0.9rem;
      }
      .totals {
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-2);
        margin-top: var(--qc-space-2);
      }
      .row {
        display: flex;
        justify-content: space-between;
      }
      .row.total {
        padding-top: var(--qc-space-3);
        border-top: 1px solid var(--qc-border-subtle);
        font-size: 1.2rem;
        font-weight: 700;
      }
      .gate {
        padding: var(--qc-space-12);
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: var(--qc-space-5);
        align-items: center;
      }
    `,
  ],
})
export class OrdersPage implements OnInit {
  private readonly store = inject(OrderStore);
  private readonly auth = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  readonly isAuth = this.auth.isAuthenticated;
  readonly orders = this.store.orders;
  readonly loading = this.store.loading;
  readonly selected = this.store.selected;
  readonly selectedId = computed(() => this.selected()?.id ?? null);
  readonly error = signal(false);
  readonly loadingMore = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly hasMore = computed(() => this.page() < this.totalPages());

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.refresh();
    }
  }

  statusLabel(status: Order['status']) {
    return orderStatusLabel(status);
  }

  statusClass(status: Order['status']) {
    return toneClass(orderStatusTone(status));
  }

  money(value: number) {
    return formatCurrency(value);
  }

  async refresh() {
    this.error.set(false);
    try {
      const pagination = await this.store.loadOrders(1);
      this.page.set(pagination.page);
      this.totalPages.set(pagination.totalPages);
      const first = this.orders()[0];
      if (first) await this.select(first.id);
    } catch {
      this.error.set(true);
    }
  }

  async loadMore() {
    if (!this.hasMore() || this.loadingMore()) return;
    this.loadingMore.set(true);
    try {
      const next = this.page() + 1;
      const pagination = await this.store.loadOrders(next, 20, true);
      this.page.set(pagination.page);
      this.totalPages.set(pagination.totalPages);
    } catch {
      this.notify.showError('Could not load more orders');
    } finally {
      this.loadingMore.set(false);
    }
  }

  async select(orderId: string) {
    try {
      await this.store.getOrder(orderId);
    } catch {
      this.notify.showError('Could not load order details');
    }
  }
}
