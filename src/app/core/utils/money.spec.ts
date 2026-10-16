import { formatCurrency, toLineTotal } from './money';

describe('money utils', () => {
  it('formats INR amounts with the rupee symbol and two decimals', () => {
    const formatted = formatCurrency(1234.5);
    expect(formatted).toContain('1,234.50');
    expect(formatted).toContain('₹');
  });

  it('returns a safe value for non-finite amounts', () => {
    expect(formatCurrency(Number.NaN)).toBe('₹0.00');
  });

  it('computes line totals with rounding', () => {
    expect(toLineTotal(3, 19.99)).toBeCloseTo(59.97, 2);
  });

  it('returns zero for invalid line total inputs', () => {
    expect(toLineTotal(Number.NaN, 10)).toBe(0);
  });
});
