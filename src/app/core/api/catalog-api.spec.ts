import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import { Product } from '../models/product';
import { CatalogApi } from './catalog-api';

const product: Product = {
  id: 'p1',
  name: 'Quantum Drive',
  slug: 'quantum-drive',
  description: 'A drive',
  price: 249.99,
  sku: 'QD-001',
  stock_quantity: 10,
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('CatalogApi', () => {
  let api: CatalogApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test' },
      ],
    });
    api = TestBed.inject(CatalogApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends query params and unwraps cursor pagination', async () => {
    const promise = firstValueFrom(
      api.listProducts({ limit: 10, search: 'drive', categoryId: 'c1' }),
    );

    const req = http.expectOne((r) => r.url === 'http://test/api/v1/products');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('search')).toBe('drive');
    expect(req.request.params.get('categoryId')).toBe('c1');

    req.flush({
      success: true,
      data: [product],
      pagination: { limit: 10, hasMore: true, nextCursor: 'cursor-2' },
    });

    const res = await promise;
    expect(res.data.length).toBe(1);
    expect(res.hasMore).toBe(true);
    expect(res.nextCursor).toBe('cursor-2');
  });

  it('unwraps a product detail payload', async () => {
    const promise = firstValueFrom(api.getProduct('p1'));
    const req = http.expectOne('http://test/api/v1/products/p1');
    req.flush({ success: true, data: { ...product, categoryIds: ['c1'] } });

    const res = await promise;
    expect(res.id).toBe('p1');
    expect(res.categoryIds).toEqual(['c1']);
  });

  it('unwraps the category list payload', async () => {
    const promise = firstValueFrom(api.listCategories());
    const req = http.expectOne('http://test/api/v1/categories');
    req.flush({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'c1',
          name: 'Processors',
          slug: 'processors',
          description: null,
          parentId: null,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const res = await promise;
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('Processors');
  });
});
