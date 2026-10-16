import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrderApi } from '../api/order-api';
import type { CreateOrderRequest, Order, OrderListItem } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly api = inject(OrderApi);

  private readonly _orders = signal<OrderListItem[]>([]);
  private readonly _selected = signal<Order | null>(null);
  private readonly _loading = signal(false);

  readonly orders = this._orders.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadOrders(page = 1, pageSize = 20, append = false) {
    if (!append) {
      this._loading.set(true);
    }
    try {
      const res = await firstValueFrom(this.api.list(page, pageSize));
      this._orders.update((xs) => (append ? [...xs, ...res.data] : res.data));
      return res.pagination;
    } finally {
      this._loading.set(false);
    }
  }

  async createOrder(req: CreateOrderRequest) {
    return await firstValueFrom(this.api.create(req));
  }

  async getOrder(id: string) {
    const o = await firstValueFrom(this.api.getById(id));
    this._selected.set(o);
    return o;
  }

  reset() {
    this._orders.set([]);
    this._selected.set(null);
  }
}
