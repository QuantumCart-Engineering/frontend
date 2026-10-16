import { initials, productPlaceholder } from './placeholder';

describe('placeholder utils', () => {
  it('falls back to a gradient for an empty seed', () => {
    expect(productPlaceholder('')).toContain('linear-gradient');
  });

  it('is deterministic for the same seed', () => {
    expect(productPlaceholder('SKU-123')).toBe(productPlaceholder('SKU-123'));
  });

  it('derives two-letter initials from a full name', () => {
    expect(initials('Quantum Cart')).toBe('QC');
  });

  it('handles single-word and empty names', () => {
    expect(initials('Neo')).toBe('NE');
    expect(initials('')).toBe('QC');
  });
});
