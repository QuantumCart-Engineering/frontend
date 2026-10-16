export const formatCurrency = (amount: number, currency = 'INR'): string => {
  if (!Number.isFinite(amount)) {
    return currency === 'INR' ? '₹0.00' : `0.00 ${currency}`;
  }

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const toLineTotal = (qty: number, unitPrice: number): number => {
  if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) {
    return 0;
  }
  return Math.round(qty * unitPrice * 100) / 100;
};
