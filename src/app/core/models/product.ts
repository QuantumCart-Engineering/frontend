import type { PaginationCursor } from './api';

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sku: string;
  stock_quantity: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategories extends Product {
  categoryIds: string[];
  images?: ProductImage[];
}
export interface ProductImage {
  id: string;
  productId: string;
  fileName: string;
  originalName: string | null;
  mimeType: string;
  fileSize: number;
  altText: string | null;
  position: number;
  url: string;
  createdAt: string;
}


export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  success: true;
  data: Product[];
  pagination: PaginationCursor;
}

export interface ProductDetailResponse {
  success: true;
  message?: string;
  data: ProductWithCategories;
}

export interface CategoryListResponse {
  success: true;
  message?: string;
  data: Category[];
}

export interface ProductsQuery {
  cursor?: string | null;
  limit?: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CategoryQuery {
  limit?: number;
  offset?: number;
}
