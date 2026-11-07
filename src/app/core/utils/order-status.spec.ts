import {
  getCancellationProgress,
  getConfirmedOrderTimeline,
  getDeliveryStatusDisplay,
  getOrderStatusDisplay,
  getPaymentStatusDisplay,
  getPaymentTimelineTitle,
  getRefundStatusDisplay,
} from './order-status';

describe('order-status utils', () => {
  it('maps order statuses', () => {
    expect(getOrderStatusDisplay('PENDING_PAYMENT').label).toBe('Pending payment');
    expect(getOrderStatusDisplay('CONFIRMED').label).toBe('Order confirmed');
    expect(getOrderStatusDisplay('CANCELLED').label).toBe('Order cancelled');
  });

  it('maps payment statuses', () => {
    expect(getPaymentStatusDisplay('SUCCESS').label).toBe('Payment successful');
    expect(getPaymentStatusDisplay('FAILED').label).toBe('Payment failed');
    expect(getPaymentStatusDisplay('REFUND_PENDING').label).toBe('Refund pending');
    expect(getPaymentStatusDisplay('REFUNDED').label).toBe('Refunded');
  });

  it('maps refund statuses and never assumes completion from http', () => {
    expect(getRefundStatusDisplay('PENDING').label).toBe('Refund pending');
    expect(getRefundStatusDisplay('COMPLETED').label).toBe('Refund completed');
    expect(getRefundStatusDisplay('FAILED').label).toBe('Refund failed / action required');
    expect(getRefundStatusDisplay(null).label).toBe('No refund recorded');
  });

  it('maps delivery statuses', () => {
    expect(getDeliveryStatusDisplay('NOT_SHIPPED').label).toBe('Not shipped');
    expect(getDeliveryStatusDisplay('SHIPPED').label).toBe('Shipped');
    expect(getDeliveryStatusDisplay('DELIVERED').label).toBe('Delivered');
  });

  it('maps payment timeline titles', () => {
    expect(getPaymentTimelineTitle('SUCCESS')).toBe('confirmed');
    expect(getPaymentTimelineTitle('FAILED')).toBe('failed');
    expect(getPaymentTimelineTitle('REFUND_PENDING')).toBe('refunded');
    expect(getPaymentTimelineTitle('PENDING')).toBe('pending');
  });

  const timelineOrder = (deliveryStatus: 'NOT_SHIPPED' | 'SHIPPED' | 'DELIVERED') => ({
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    deliveryStatus,
    payment: {
      id: 1,
      orderId: 'order-1',
      amount: 100,
      currency: 'INR',
      status: 'SUCCESS',
      createdAt: '2026-01-01T10:01:00.000Z',
      updatedAt: '2026-01-01T10:01:00.000Z',
    },
  });

  it('shows valid pending delivery stages without a contradictory status row', () => {
    const steps = getConfirmedOrderTimeline(timelineOrder('NOT_SHIPPED'));

    expect(steps.map((step) => step.title)).toEqual([
      'Order placed',
      'Payment confirmed',
      'Order confirmed',
      'Shipped',
      'Delivered',
    ]);
    expect(steps.map((step) => step.done)).toEqual([true, true, true, false, false]);
    expect(steps.some((step) => step.title === 'Not shipped')).toBe(false);
    expect(steps.filter((step) => step.title === 'Delivered')).toHaveLength(1);
  });

  it('marks shipped orders as shipped with delivery still pending', () => {
    const steps = getConfirmedOrderTimeline(timelineOrder('SHIPPED'));

    expect(steps.find((step) => step.key === 'shipped')?.done).toBe(true);
    expect(steps.find((step) => step.key === 'delivered')?.done).toBe(false);
    expect(steps.find((step) => step.key === 'shipped')?.timestamp).toBeNull();
    expect(steps.find((step) => step.key === 'delivered')?.timestamp).toBeNull();
  });

  it('marks delivered orders as complete without duplicate delivery stages', () => {
    const steps = getConfirmedOrderTimeline(timelineOrder('DELIVERED'));

    expect(steps.map((step) => step.title)).toEqual([
      'Order placed',
      'Payment confirmed',
      'Order confirmed',
      'Shipped',
      'Delivered',
    ]);
    expect(steps.every((step) => step.done)).toBe(true);
    expect(steps.find((step) => step.key === 'delivered')?.timestamp).toBeNull();
  });

  it('derives cancellation/refund progress without inventing states', () => {
    expect(getCancellationProgress('CANCELLED', 'REFUNDED', { status: 'COMPLETED' } as any).detail).toBe('Refund completed');
    expect(getCancellationProgress('CANCELLED', 'REFUND_PENDING', { status: 'PENDING' } as any).detail).toBe('Refund pending');
    expect(getCancellationProgress('CANCELLED', 'SUCCESS', { status: 'FAILED' } as any).detail).toBe('Refund failed / action required');
    expect(getCancellationProgress('CONFIRMED', 'REFUND_PENDING', { status: 'PENDING' } as any).label).toBe('Cancellation processing');
    expect(getCancellationProgress('CONFIRMED', 'SUCCESS', null).label).toBe('Not cancelled');
  });
});
