import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import type { OrderListItem } from '../models/order';
import { OrderStore } from './order-store';

const order = (id: string): OrderListItem => ({
  id,
  orderNumber: `QC-${id}`,
  userId: 'u1',
  status: 'CONFIRMED',
  subtotal: 100,
  total: 100,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('OrderStore', () => {
  let store: OrderStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test' },
      ],
    });
    store = TestBed.inject(OrderStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('replaces orders on the first page', async () => {
    const promise = store.loadOrders(1);
    const req = http.expectOne((r) => r.url === 'http://test/api/v1/orders');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({
      success: true,
      data: [order('a')],
      pagination: { page: 1, pageSize: 20, totalItems: 2, totalPages: 2 },
    });

    const pagination = await promise;
    expect(pagination.totalPages).toBe(2);
    expect(store.orders().map((o) => o.id)).toEqual(['a']);
  });

  it('appends orders when requested', async () => {
    const first = store.loadOrders(1, 20, true);
    http
      .expectOne((r) => r.url === 'http://test/api/v1/orders')
      .flush({
        success: true,
        data: [order('a')],
        pagination: { page: 1, pageSize: 20, totalItems: 2, totalPages: 2 },
      });
    await first;

    const second = store.loadOrders(2, 20, true);
    http
      .expectOne((r) => r.url === 'http://test/api/v1/orders')
      .flush({
        success: true,
        data: [order('b')],
        pagination: { page: 2, pageSize: 20, totalItems: 2, totalPages: 2 },
      });
    await second;

    expect(store.orders().map((o) => o.id)).toEqual(['a', 'b']);
  });

  it('resets orders and selection', async () => {
    const promise = store.getOrder('a');
    http.expectOne('http://test/api/v1/orders/a').flush({
      success: true,
      data: { ...order('a'), items: [] },
    });
    await promise;
    expect(store.selected()?.id).toBe('a');

    store.reset();
    expect(store.orders()).toEqual([]);
    expect(store.selected()).toBeNull();
  });
});
