import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { CatalogApi } from '../../../core/api/catalog-api';
import { Category, Product, ProductsQuery } from '../../../core/models/product';
import { HomePage } from './home-page';

const makeProduct = (id: string, name: string): Product => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  description: 'A demo product',
  price: 1999,
  sku: `QC-${id.toUpperCase()}`,
  stock_quantity: 10,
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
});

const makeCategory = (name: string, slug: string): Category => ({
  id: `cat-${slug}`,
  name,
  slug,
  description: null,
  parentId: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const categories: Category[] = [
  makeCategory('Mobiles', 'mobiles'),
  makeCategory('Laptops', 'laptops'),
  makeCategory('Audio', 'audio'),
  makeCategory('Wearables', 'wearables'),
];

const products: Product[] = [makeProduct('1', 'Aurora X5'), makeProduct('2', 'Quantum Book Air')];

interface Mock {
  listProducts: (query?: ProductsQuery) => Observable<{
    data: Product[];
    nextCursor: string | null;
    limit: number;
    hasMore: boolean;
  }>;
  listCategories: () => Observable<Category[]>;
  getProduct: (id: string) => Observable<Product & { categoryIds: string[] }>;
}

const successMock = (): Mock => ({
  listProducts: () => of({ data: products, nextCursor: null, limit: 8, hasMore: false }),
  listCategories: () => of(categories),
  getProduct: (id) => of({ ...products[0], id, categoryIds: [] }),
});

const create = (api: Mock) => {
  TestBed.configureTestingModule({
    imports: [HomePage],
    providers: [provideRouter([]), provideHttpClient(), { provide: CatalogApi, useValue: api }],
  });
  return TestBed.createComponent(HomePage);
};

describe('HomePage', () => {
  it('renders departments, promo banners and featured products from the API', async () => {
    const fixture = create(successMock());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.department').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.promo').length).toBe(2);
    expect(el.querySelectorAll('app-product-card').length).toBeGreaterThan(0);
    expect(el.querySelector('.spotlight-name')?.textContent).toContain('Aurora X5');
  });

  it('shows the error state (and not product cards) when the product request fails', async () => {
    const api = successMock();
    api.listProducts = () =>
      throwError(() => new Error('Failed to fetch')) as unknown as ReturnType<Mock['listProducts']>;

    const fixture = create(api);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-error-state')).toBeTruthy();
    expect(el.querySelectorAll('app-product-card').length).toBe(0);
  });

  it('recovers when retried after a transient failure', async () => {
    let fail = true;
    const api = successMock();
    api.listProducts = () =>
      fail
        ? (throwError(() => new Error('Failed to fetch')) as unknown as ReturnType<
            Mock['listProducts']
          >)
        : of({ data: products, nextCursor: null, limit: 8, hasMore: false });

    const fixture = create(api);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-error-state')).toBeTruthy();

    fail = false;
    fixture.componentInstance.loadProducts();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('app-error-state')).toBeFalsy();
    expect(el.querySelectorAll('app-product-card').length).toBeGreaterThan(0);
  });
});
