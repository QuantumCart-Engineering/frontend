import type { OrderBase } from '../models/order';

const clean = (value?: string | null): string =>
  typeof value === 'string' ? value.trim() : '';

export const buildDeliveryAddressLines = (
  order: Pick<
    OrderBase,
    | 'addressLine1'
    | 'addressLine2'
    | 'city'
    | 'state'
    | 'postalCode'
    | 'pinCode'
    | 'country'
    | 'deliveryAddress'
  >,
): string[] => {
  const addressLine1 = clean(order.addressLine1);
  const addressLine2 = clean(order.addressLine2);
  const city = clean(order.city);
  const state = clean(order.state);
  const postalCode = clean(order.postalCode) || clean(order.pinCode);
  const country = clean(order.country);

  const hasStructuredAddress =
    !!addressLine1 ||
    !!addressLine2 ||
    !!city ||
    !!state ||
    !!postalCode ||
    !!country;

  if (!hasStructuredAddress) {
    const legacyAddress = clean(order.deliveryAddress);
    return legacyAddress ? [legacyAddress] : [];
  }

  const lines: string[] = [];
  const seen = new Set<string>();

  const addLine = (value: string): void => {
    const key = value.toLocaleLowerCase();
    if (!value || seen.has(key)) {
      return;
    }
    seen.add(key);
    lines.push(value);
  };

  const countryKey = country.toLocaleLowerCase();

  if (addressLine1.toLocaleLowerCase() !== countryKey) {
    addLine(addressLine1);
  }
  if (addressLine2.toLocaleLowerCase() !== countryKey) {
    addLine(addressLine2);
  }

  const cityAndState = [city, state].filter(Boolean).join(', ');
  addLine([cityAndState, postalCode].filter(Boolean).join(' '));

  addLine(country);

  return lines;
};
