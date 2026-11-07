import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../../core/models/order';
import { AuthStore } from '../../../core/services/auth-store';
import { OrderStore } from '../../../core/services/order-store';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCurrency } from '../../../core/utils/money';
import { orderStatusLabel, orderStatusTone, toneClass } from '../../../core/utils/status';
import {
  getCancellationProgress,
  getConfirmedOrderTimeline,
  getDeliveryStatusDisplay,
  getOrderStatusDisplay,
  getPaymentStatusDisplay,
  getPaymentTimelineTitle,
  getRefundStatusDisplay,
  type OrderTimelineStep,
} from '../../../core/utils/order-status';
import { buildDeliveryAddressLines } from '../../../core/utils/delivery-address';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [DatePipe, RouterLink, Skeleton, EmptyState, ErrorState],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
})
export class OrdersPage implements OnInit {
  private readonly orderStore = inject(OrderStore);
  private readonly auth = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  readonly orders = this.orderStore.orders;
  readonly loading = this.orderStore.loading;
  readonly selected = this.orderStore.selected;
  readonly selectedId = computed(() => this.selected()?.id ?? null);
  readonly loadingMore = signal(false);
  readonly loadingDetails = signal(false);
  readonly error = signal<string | null>(null);
  readonly pagination = signal({ page: 1, totalPages: 1 });
  readonly canceling = signal(false);
  readonly cancelError = signal<string | null>(null);
  readonly hasMore = computed(() => this.pagination().page < this.pagination().totalPages);
  readonly isAuth = computed(() => this.auth.isAuthenticated());

  ngOnInit(): void {
    if (this.isAuth()) {
      this.refresh();
    }
  }

  async refresh(): Promise<void> {
    this.error.set(null);
    try {
      const pagination = await this.orderStore.loadOrders(1, PAGE_SIZE, false);
      this.pagination.set({ page: pagination.page, totalPages: pagination.totalPages });
    } catch {
      this.error.set('Failed to load orders');
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }
    this.loadingMore.set(true);
    try {
      const nextPage = this.pagination().page + 1;
      const pagination = await this.orderStore.loadOrders(nextPage, PAGE_SIZE, true);
      this.pagination.set({ page: pagination.page, totalPages: pagination.totalPages });
    } catch {
      this.error.set('Failed to load more orders');
    } finally {
      this.loadingMore.set(false);
    }
  }

  async select(id: string): Promise<void> {
    this.cancelError.set(null);
    try {
      await this.orderStore.getOrder(id);
    } catch {
      this.error.set('Failed to load order details');
    }
  }

  async reloadDetails(id: string): Promise<void> {
    this.loadingDetails.set(true);
    this.cancelError.set(null);
    try {
      await this.orderStore.getOrder(id);
      await this.orderStore.loadOrders(this.pagination().page, PAGE_SIZE, false).catch(() => undefined);
    } catch {
      this.error.set('Failed to refresh order details');
    } finally {
      this.loadingDetails.set(false);
    }
  }

  canCancel(order: Order): boolean {
    if (order.status === 'CANCELLED') {
      return false;
    }
    const deliveryStatus = order.deliveryStatus ?? 'NOT_SHIPPED';
    if (deliveryStatus !== 'NOT_SHIPPED') {
      return false;
    }
    return order.status === 'PENDING_PAYMENT' || order.status === 'CONFIRMED';
  }

  deliveryLabel(order: Order): string {
    return getDeliveryStatusDisplay(order.deliveryStatus).label;
  }

  orderStatusDisplayLabel(status: Order['status']): string {
    return getOrderStatusDisplay(status).label;
  }

  orderStatusToneClass(status: Order['status']): string {
    return toneClass(orderStatusTone(status));
  }

  paymentDisplayLabel(order: Order): string {
    return getPaymentStatusDisplay(order.payment?.status).label;
  }

  paymentToneClass(order: Order): string {
    return toneClass(getPaymentStatusDisplay(order.payment?.status).tone);
  }

  paymentTimelineTitle(order: Order): string {
    return getPaymentTimelineTitle(order.payment?.status);
  }

  confirmedTimeline(order: Order): OrderTimelineStep[] {
    return getConfirmedOrderTimeline(order);
  }

  deliveryAddressLines(order: Order): string[] {
    return buildDeliveryAddressLines(order);
  }

  cancellationDisplayLabel(order: Order): string {
    return getCancellationProgress(order.status, order.payment?.status, order.refund).label;
  }

  cancellationToneClass(order: Order): string {
    return toneClass(getCancellationProgress(order.status, order.payment?.status, order.refund).tone);
  }

  cancellationDetail(order: Order): string | undefined {
    return getCancellationProgress(order.status, order.payment?.status, order.refund).detail;
  }

  refundDisplayLabel(order: Order): string {
    return getRefundStatusDisplay(order.refund?.status).label;
  }

  refundToneClass(order: Order): string {
    return toneClass(getRefundStatusDisplay(order.refund?.status).tone);
  }

  refundTimelineTitle(order: Order): string {
    const status = order.refund?.status;
    if (status === 'COMPLETED') return 'completed';
    if (status === 'FAILED') return 'failed';
    if (status === 'PENDING') return 'pending';
    if (order.payment?.status === 'REFUND_PENDING') return 'pending';
    if (order.payment?.status === 'REFUNDED') return 'completed';
    return 'updated';
  }

  async cancel(order: Order): Promise<void> {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    this.canceling.set(true);
    this.cancelError.set(null);
    try {
      await this.orderStore.cancelOrder(order.id);
      this.notify.showSuccess('Order cancellation processed.');
      await this.refresh();
      await this.orderStore.getOrder(order.id);
    } catch (err: any) {
      this.cancelError.set(
        err?.error?.error?.message || err?.message || 'Failed to cancel order',
      );
    } finally {
      this.canceling.set(false);
    }
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  statusLabel(status: Order['status']): string {
    return orderStatusLabel(status);
  }

  statusClass(status: Order['status']): string {
    return toneClass(orderStatusTone(status));
  }
}
