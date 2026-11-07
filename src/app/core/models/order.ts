export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
export type DeliveryStatus = 'NOT_SHIPPED' | 'SHIPPED' | 'DELIVERED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED' | string;
export type RefundStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | string;

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderPayment {
  id: number;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  status: PaymentStatus;
  provider?: string;
  providerPaymentId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface OrderRefund {
  id: string;
  paymentId: number;
  orderId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason?: string | null;
  providerRefundId?: string | null;
  idempotencyKey?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface OrderBase {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  receiverName?: string | null;
  deliveryMobile?: string | null;
  deliveryAddress?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  pinCode?: string | null;
  country?: string | null;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListItem extends OrderBase {
  items?: OrderItem[];
}

export interface Order extends OrderBase {
  items: OrderItem[];
  payment?: OrderPayment | null;
  refund?: OrderRefund | null;
}

export interface DeliveryDetails {
  receiverName: string;
  deliveryMobile: string;
  deliveryAddress?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderCART extends DeliveryDetails {
  source: 'CART';
  paymentMethod?: 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
}

export interface CreateOrderBUYNOW extends DeliveryDetails {
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
