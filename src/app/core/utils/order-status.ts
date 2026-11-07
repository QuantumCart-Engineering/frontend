import {
  DeliveryStatus,
  Order,
  OrderRefund,
  OrderStatus,
  PaymentStatus,
  RefundStatus,
} from '../models/order';

export interface OrderTimelineStep {
  key: 'order-placed' | 'payment' | 'order-confirmed' | 'shipped' | 'delivered';
  title: string;
  timestamp?: string | Date | null;
  done: boolean;
}

export type OrderLifecycleState =
  | { key: 'order'; label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; detail?: string }
  | { key: 'payment'; label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; detail?: string }
  | { key: 'cancellation'; label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; detail?: string }
  | { key: 'refund'; label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; detail?: string }
  | { key: 'delivery'; label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; detail?: string };

export const getOrderStatusDisplay = (status: OrderStatus): { label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' } => {
  if (status === 'CONFIRMED') return { label: 'Order confirmed', tone: 'success' };
  if (status === 'CANCELLED') return { label: 'Order cancelled', tone: 'neutral' };
  if (status === 'PENDING_PAYMENT') return { label: 'Pending payment', tone: 'warning' };
  return { label: status, tone: 'info' };
};

export const getPaymentStatusDisplay = (status?: PaymentStatus | null): { label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' } => {
  if (!status) return { label: 'Unknown', tone: 'neutral' };
  if (status === 'SUCCESS') return { label: 'Payment successful', tone: 'success' };
  if (status === 'FAILED') return { label: 'Payment failed', tone: 'danger' };
  if (status === 'REFUND_PENDING') return { label: 'Refund pending', tone: 'warning' };
  if (status === 'REFUNDED') return { label: 'Refunded', tone: 'success' };
  if (status === 'PENDING' || status === 'PROCESSING') return { label: 'Payment pending', tone: 'warning' };
  return { label: String(status).replace(/_/g, ' ').toLowerCase(), tone: 'info' };
};

export const getPaymentTimelineTitle = (status?: PaymentStatus | null): string => {
  if (status === 'SUCCESS') return 'confirmed';
  if (status === 'FAILED') return 'failed';
  if (status === 'REFUND_PENDING' || status === 'REFUNDED') return 'refunded';
  if (status === 'PENDING' || status === 'PROCESSING') return 'pending';
  return 'updated';
};

export const getConfirmedOrderTimeline = (
  order: Pick<Order, 'createdAt' | 'updatedAt' | 'deliveryStatus' | 'payment'>,
): OrderTimelineStep[] => {
  const deliveryStatus = order.deliveryStatus ?? 'NOT_SHIPPED';
  const paymentStatus = order.payment?.status;
  const steps: OrderTimelineStep[] = [
    {
      key: 'order-placed',
      title: 'Order placed',
      timestamp: order.createdAt,
      done: true,
    },
  ];

  if (
    paymentStatus === 'SUCCESS' ||
    paymentStatus === 'REFUNDED' ||
    paymentStatus === 'REFUND_PENDING'
  ) {
    steps.push({
      key: 'payment',
      title: `Payment ${getPaymentTimelineTitle(paymentStatus)}`,
      timestamp: order.payment?.updatedAt || order.updatedAt,
      done: true,
    });
  }

  steps.push({
    key: 'order-confirmed',
    title: 'Order confirmed',
    timestamp: order.updatedAt,
    done: true,
  });

  steps.push({
    key: 'shipped',
    title: 'Shipped',
    timestamp: null,
    done: deliveryStatus === 'SHIPPED' || deliveryStatus === 'DELIVERED',
  });

  steps.push({
    key: 'delivered',
    title: 'Delivered',
    timestamp: null,
    done: deliveryStatus === 'DELIVERED',
  });

  return steps;
};

export const getDeliveryStatusDisplay = (status?: DeliveryStatus | null): { label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' } => {
  if (!status) return { label: 'Not shipped', tone: 'neutral' };
  if (status === 'DELIVERED') return { label: 'Delivered', tone: 'success' };
  if (status === 'SHIPPED') return { label: 'Shipped', tone: 'info' };
  if (status === 'NOT_SHIPPED') return { label: 'Not shipped', tone: 'neutral' };
  return { label: String(status).replace(/_/g, ' ').toLowerCase(), tone: 'info' };
};

export const getRefundStatusDisplay = (status?: RefundStatus | null): { label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' } => {
  if (!status) return { label: 'No refund recorded', tone: 'neutral' };
  if (status === 'COMPLETED') return { label: 'Refund completed', tone: 'success' };
  if (status === 'FAILED') return { label: 'Refund failed / action required', tone: 'danger' };
  if (status === 'PENDING') return { label: 'Refund pending', tone: 'warning' };
  return { label: String(status).replace(/_/g, ' ').toLowerCase(), tone: 'info' };
};

export const getCancellationProgress = (
  orderStatus: OrderStatus,
  paymentStatus?: PaymentStatus | null,
  refund?: OrderRefund | null
): { label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; detail?: string } => {
  if (orderStatus === 'CANCELLED') {
    if (refund?.status === 'FAILED') {
      return { label: 'Order cancelled', tone: 'neutral', detail: 'Refund failed / action required' };
    }
    if (refund?.status === 'PENDING' || paymentStatus === 'REFUND_PENDING') {
      return { label: 'Order cancelled', tone: 'neutral', detail: 'Refund pending' };
    }
    if (refund?.status === 'COMPLETED' || paymentStatus === 'REFUNDED') {
      return { label: 'Order cancelled', tone: 'neutral', detail: 'Refund completed' };
    }
    return { label: 'Order cancelled', tone: 'neutral' };
  }
  if (orderStatus === 'CONFIRMED') {
    if (refund?.status === 'PENDING' || paymentStatus === 'REFUND_PENDING') {
      return { label: 'Cancellation processing', tone: 'warning', detail: 'Refund in progress' };
    }
    if (refund?.status === 'FAILED') {
      return { label: 'Cancellation processing / refund failed', tone: 'danger', detail: 'Refund failed / action required' };
    }
    return { label: 'Not cancelled', tone: 'neutral' };
  }
  if (orderStatus === 'PENDING_PAYMENT') {
    return { label: 'Not cancelled', tone: 'neutral' };
  }
  return { label: 'Not cancelled', tone: 'neutral' };
};
