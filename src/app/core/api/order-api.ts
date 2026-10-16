import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type {
  CreateOrderRequest,
  Order,
  OrderListItem,
  OrderListResponse,
  OrderResponse,
} from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  create(payload: CreateOrderRequest): Observable<Order> {
    return this.http
      .post<OrderResponse>(`${this.baseUrl}/api/v1/orders`, payload)
      .pipe(map((res) => res.data));
  }

  list(
    page = 1,
    pageSize = 20,
  ): Observable<{ data: OrderListItem[]; pagination: OrderListResponse['pagination'] }> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    return this.http.get<OrderListResponse>(`${this.baseUrl}/api/v1/orders`, { params }).pipe(
      map((res) => ({
        data: res.data,
        pagination: res.pagination,
      })),
    );
  }

  getById(orderId: string): Observable<Order> {
    return this.http
      .get<OrderResponse>(`${this.baseUrl}/api/v1/orders/${orderId}`)
      .pipe(map((res) => res.data));
  }
}
