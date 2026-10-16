import type { ProductStatus } from '../models/product';
import type { OrderStatus } from '../models/order';

export type Tone = 'success' | 'warning' | 'error' | 'primary' | 'neutral';

const PRODUCT_LABELS: Record<ProductStatus, string> = {
  ACTIVE: 'Available',
  INACTIVE: 'Unavailable',
  OUT_OF_STOCK: 'Out of stock',
  ARCHIVED: 'Archived',
};

const PRODUCT_TONES: Record<ProductStatus, Tone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  OUT_OF_STOCK: 'warning',
  ARCHIVED: 'neutral',
};

const ORDER_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pending payment',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
};

const ORDER_TONES: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'error',
};

export const productStatusLabel = (status: ProductStatus): string =>
  PRODUCT_LABELS[status] ?? status;
export const productStatusTone = (status: ProductStatus): Tone =>
  PRODUCT_TONES[status] ?? 'neutral';

export const orderStatusLabel = (status: OrderStatus): string => ORDER_LABELS[status] ?? status;
export const orderStatusTone = (status: OrderStatus): Tone => ORDER_TONES[status] ?? 'neutral';

export const toneClass = (tone: Tone): string =>
  tone === 'neutral' ? 'badge' : `badge badge-${tone}`;
