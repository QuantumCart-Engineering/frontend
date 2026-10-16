import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type {
  CategoryListResponse,
  Product,
  ProductDetailResponse,
  ProductListResponse,
  ProductWithCategories,
  ProductsQuery,
} from '../models/product';

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listProducts(
    query: ProductsQuery = {},
  ): Observable<{ data: Product[]; nextCursor: string | null; limit: number; hasMore: boolean }> {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }
    if (query.limit !== undefined && query.limit !== null) {
      params = params.set('limit', String(query.limit));
    }
    if (query.categoryId) {
      params = params.set('categoryId', query.categoryId);
    }
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.minPrice !== undefined && query.minPrice !== null) {
      params = params.set('minPrice', String(query.minPrice));
    }
    if (query.maxPrice !== undefined && query.maxPrice !== null) {
      params = params.set('maxPrice', String(query.maxPrice));
    }

    return this.http.get<ProductListResponse>(`${this.baseUrl}/api/v1/products`, { params }).pipe(
      map((res) => ({
        data: res.data,
        nextCursor: res.pagination.nextCursor,
        limit: res.pagination.limit,
        hasMore: res.pagination.hasMore,
      })),
    );
  }

  getProduct(id: string): Observable<ProductWithCategories> {
    return this.http
      .get<ProductDetailResponse>(`${this.baseUrl}/api/v1/products/${id}`)
      .pipe(map((res) => res.data));
  }

  listCategories(): Observable<CategoryListResponse['data']> {
    return this.http
      .get<CategoryListResponse>(`${this.baseUrl}/api/v1/categories`)
      .pipe(map((res) => res.data));
  }
}
