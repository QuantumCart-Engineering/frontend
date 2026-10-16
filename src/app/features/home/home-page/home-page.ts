import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../../core/api/catalog-api';
import { Category, Product } from '../../../core/models/product';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { formatCurrency } from '../../../core/utils/money';
import { productPlaceholder, initials } from '../../../core/utils/placeholder';

interface PromoBanner {
  category: Category;
  eyebrow: string;
  title: string;
  text: string;
  tone: 'lavender' | 'cyan';
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, ProductCard, Skeleton, EmptyState, ErrorState],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
  private readonly api = inject(CatalogApi);

  private readonly preferredDepartments = [
    'mobiles',
    'laptops',
    'audio',
    'accessories',
    'wearables',
    'cameras',
    'gaming',
    'smart-home',
  ];

  readonly products = signal<Product[]>([]);
  readonly collection = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly categoriesLoading = signal(false);
  readonly categoriesError = signal(false);
  readonly collectionLoading = signal(false);
  readonly skeletons = [1, 2, 3, 4];

  readonly heroProduct = computed(() => this.products()[0] ?? null);

  readonly departmentBySlug = computed<Map<string, Category>>(() => {
    const all = this.categories().filter((c) => c.status === 'ACTIVE');
    return new Map(all.map((c) => [c.slug, c]));
  });

  readonly departments = computed<Category[]>(() => {
    const all = this.categories().filter((c) => c.status === 'ACTIVE');
    const bySlug = new Map(all.map((c) => [c.slug, c]));
    const preferred = this.preferredDepartments
      .map((slug) => bySlug.get(slug))
      .filter((c): c is Category => !!c);
    return (preferred.length >= 4 ? preferred : all).slice(0, 8);
  });

  readonly promoBanners = computed<PromoBanner[]>(() => {
    const bySlug = this.departmentBySlug();
    const defs: Omit<PromoBanner, 'category'>[] = [
      {
        eyebrow: 'Computing',
        title: 'Laptops for work and play',
        text: 'Ultrabooks, creator notebooks and everyday machines.',
        tone: 'lavender',
      },
      {
        eyebrow: 'Audio',
        title: 'Sound that surrounds you',
        text: 'Headphones, earbuds and speakers with rich, clear audio.',
        tone: 'cyan',
      },
    ];
    return defs
      .map((def) => {
        const category = bySlug.get(def.tone === 'lavender' ? 'laptops' : 'audio');
        return category ? { ...def, category } : null;
      })
      .filter((b): b is PromoBanner => !!b);
  });

  readonly collectionCategory = computed<Category | null>(
    () => this.departmentBySlug().get('mobiles') ?? null,
  );

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  async loadProducts() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const res = await firstValueFrom(this.api.listProducts({ limit: 8 }));
      this.products.set(res.data);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories() {
    this.categoriesLoading.set(true);
    this.categoriesError.set(false);
    try {
      this.categories.set(await firstValueFrom(this.api.listCategories()));
      const mobiles = this.collectionCategory();
      if (mobiles) {
        this.loadCollection(mobiles.id);
      }
    } catch {
      this.categoriesError.set(true);
    } finally {
      this.categoriesLoading.set(false);
    }
  }

  async loadCollection(categoryId: string) {
    this.collectionLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.listProducts({ categoryId, limit: 4 }));
      this.collection.set(res.data);
    } catch {
      this.collection.set([]);
    } finally {
      this.collectionLoading.set(false);
    }
  }

  money(value: number) {
    return formatCurrency(value);
  }

  placeholderFor(product: Product) {
    return productPlaceholder(product.sku || product.id);
  }

  monogram(product: Product) {
    return initials(product.name);
  }
}
