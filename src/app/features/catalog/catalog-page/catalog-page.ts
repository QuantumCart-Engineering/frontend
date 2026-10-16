import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../../core/api/catalog-api';
import { Category, Product } from '../../../core/models/product';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ReactiveFormsModule, ProductCard, Skeleton, EmptyState, ErrorState],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.css',
})
export class CatalogPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly loadMoreError = signal(false);
  readonly categoriesFailed = signal(false);
  readonly hasMore = signal(false);
  readonly cursor = signal<string | null>(null);
  readonly sort = signal<SortKey>('default');
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  readonly sortOptions: { value: SortKey; label: string }[] = [
    { value: 'default', label: 'Featured' },
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
    { value: 'name-asc', label: 'Name: A–Z' },
    { value: 'name-desc', label: 'Name: Z–A' },
  ];

  readonly sortedProducts = computed(() => {
    const list = [...this.products()];
    switch (this.sort()) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return list;
    }
  });

  readonly filters = this.fb.group({
    search: ['', [Validators.minLength(1)]],
    categoryId: [''],
    limit: [24],
  });

  ngOnInit() {
    this.route.queryParams.subscribe((p) => {
      this.filters.patchValue(
        {
          search: (p['search'] as string) || '',
          categoryId: (p['categoryId'] as string) || '',
          limit: Number(p['limit']) || 24,
        },
        { emitEvent: false },
      );
      this.reset();
      this.load();
    });
    this.loadCategories();
  }

  async loadCategories() {
    this.categoriesFailed.set(false);
    try {
      this.categories.set(await firstValueFrom(this.api.listCategories()));
    } catch {
      this.categoriesFailed.set(true);
    }
  }

  private reset() {
    this.products.set([]);
    this.cursor.set(null);
    this.hasMore.set(false);
    this.error.set(false);
    this.loadMoreError.set(false);
  }

  private query() {
    const v = this.filters.value;
    return {
      search: v.search?.trim() || undefined,
      categoryId: v.categoryId || undefined,
      limit: Number(v.limit) || 24,
    };
  }

  async load() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const res = await firstValueFrom(this.api.listProducts(this.query()));
      this.products.set(res.data);
      this.cursor.set(res.nextCursor);
      this.hasMore.set(res.hasMore);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore() {
    if (!this.hasMore() || this.loadingMore() || !this.cursor()) return;
    this.loadingMore.set(true);
    this.loadMoreError.set(false);
    try {
      const res = await firstValueFrom(
        this.api.listProducts({ ...this.query(), cursor: this.cursor() }),
      );
      this.products.update((xs) => [...xs, ...res.data]);
      this.cursor.set(res.nextCursor);
      this.hasMore.set(res.hasMore);
    } catch {
      this.loadMoreError.set(true);
    } finally {
      this.loadingMore.set(false);
    }
  }

  applyFilters() {
    const v = this.filters.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: v.search?.trim() || null,
        categoryId: v.categoryId || null,
        limit: Number(v.limit) || null,
      },
    });
  }

  clearFilters() {
    this.filters.reset({ search: '', categoryId: '', limit: 24 });
    this.sort.set('default');
    this.applyFilters();
  }

  onSortChange(value: string) {
    this.sort.set(value as SortKey);
  }
}
