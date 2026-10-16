import {
  orderStatusLabel,
  orderStatusTone,
  productStatusLabel,
  productStatusTone,
  toneClass,
} from './status';

describe('status utils', () => {
  it('maps product statuses to human labels', () => {
    expect(productStatusLabel('ACTIVE')).toBe('Available');
    expect(productStatusLabel('INACTIVE')).toBe('Unavailable');
    expect(productStatusLabel('OUT_OF_STOCK')).toBe('Out of stock');
    expect(productStatusLabel('ARCHIVED')).toBe('Archived');
  });

  it('maps order statuses to human labels', () => {
    expect(orderStatusLabel('PENDING_PAYMENT')).toBe('Pending payment');
    expect(orderStatusLabel('CONFIRMED')).toBe('Confirmed');
    expect(orderStatusLabel('CANCELLED')).toBe('Cancelled');
  });

  it('assigns tones to statuses', () => {
    expect(productStatusTone('ACTIVE')).toBe('success');
    expect(productStatusTone('OUT_OF_STOCK')).toBe('warning');
    expect(orderStatusTone('CANCELLED')).toBe('error');
    expect(orderStatusTone('CONFIRMED')).toBe('success');
  });

  it('builds badge classes, collapsing neutral to the base badge', () => {
    expect(toneClass('neutral')).toBe('badge');
    expect(toneClass('success')).toBe('badge badge-success');
    expect(toneClass('error')).toBe('badge badge-error');
  });
});
