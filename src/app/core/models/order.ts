export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderBase {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListItem extends OrderBase {}

export interface Order extends OrderBase {
  items: OrderItem[];
}

export interface CreateOrderCART {
  source: 'CART';
  paymentMethod?: 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
}

export interface CreateOrderBUYNOW {
  source: 'BUY_NOW';
  productId: string;
  quantity: number;
  paymentMethod?: 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
}

export type CreateOrderRequest = CreateOrderCART | CreateOrderBUYNOW;

export interface OrderListResponse {
  success: true;
  data: OrderListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface OrderResponse {
  success: true;
  data: Order;
}
