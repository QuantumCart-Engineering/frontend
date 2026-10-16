import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type {
  AddCartItemRequest,
  AddCartItemResponse,
  CartWithItems,
  CheckoutCartResponse,
  ClearCartResponse,
  GetCartResponse,
  RemoveCartItemResponse,
  UpdateCartItemRequest,
  UpdateCartItemResponse,
} from '../models/cart';

@Injectable({ providedIn: 'root' })
export class CartApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getCart(): Observable<CartWithItems> {
    return this.http
      .get<GetCartResponse>(`${this.baseUrl}/api/v1/cart/`)
      .pipe(map((res) => res.data));
  }

  addItem(cartId: string, payload: AddCartItemRequest): Observable<AddCartItemResponse['data']> {
    return this.http
      .post<AddCartItemResponse>(`${this.baseUrl}/api/v1/cart/${cartId}/items`, payload)
      .pipe(map((res) => res.data));
  }

  updateItem(
    cartId: string,
    productId: string,
    payload: UpdateCartItemRequest,
  ): Observable<UpdateCartItemResponse['data']> {
    return this.http
      .put<UpdateCartItemResponse>(
        `${this.baseUrl}/api/v1/cart/${cartId}/items/${productId}`,
        payload,
      )
      .pipe(map((res) => res.data));
  }

  removeItem(cartId: string, productId: string): Observable<void> {
    return this.http
      .delete<RemoveCartItemResponse>(`${this.baseUrl}/api/v1/cart/${cartId}/items/${productId}`)
      .pipe(map(() => undefined));
  }

  clearCart(cartId: string): Observable<void> {
    return this.http
      .delete<ClearCartResponse>(`${this.baseUrl}/api/v1/cart/${cartId}/items`)
      .pipe(map(() => undefined));
  }

  checkout(cartId: string): Observable<CartWithItems> {
    return this.http
      .patch<CheckoutCartResponse>(`${this.baseUrl}/api/v1/cart/${cartId}/checkout`, {})
      .pipe(map((res) => res.data));
  }
}
