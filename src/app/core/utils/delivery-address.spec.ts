import { buildDeliveryAddressLines } from './delivery-address';

describe('buildDeliveryAddressLines', () => {
  it('renders structured address fields in display order', () => {
    expect(
      buildDeliveryAddressLines({
        addressLine1: '12 MG Road',
        addressLine2: 'Near Trinity Circle',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      }),
    ).toEqual(['12 MG Road', 'Near Trinity Circle', 'Bengaluru, Karnataka 560001', 'India']);
  });

  it('omits blank optional address lines', () => {
    expect(
      buildDeliveryAddressLines({
        addressLine1: '12 MG Road',
        addressLine2: '   ',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      }),
    ).toEqual(['12 MG Road', 'Bengaluru, Karnataka 560001', 'India']);
  });

  it('does not duplicate the country when address line 1 repeats it', () => {
    expect(
      buildDeliveryAddressLines({
        addressLine1: 'India',
        addressLine2: null,
        city: 'Prayagraj',
        state: 'Uttar Pradesh',
        postalCode: '211006',
        country: 'India',
      }),
    ).toEqual(['Prayagraj, Uttar Pradesh 211006', 'India']);
  });

  it('deduplicates repeated structured lines', () => {
    expect(
      buildDeliveryAddressLines({
        addressLine1: '12 MG Road',
        addressLine2: '12 mg road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      }),
    ).toEqual(['12 MG Road', 'Bengaluru, Karnataka 560001', 'India']);
  });

  it('supports the legacy address only when no structured fields exist', () => {
    expect(
      buildDeliveryAddressLines({
        deliveryAddress: '12 MG Road, Bengaluru, Karnataka 560001, India',
      }),
    ).toEqual(['12 MG Road, Bengaluru, Karnataka 560001, India']);
  });

  it('prefers structured fields over the legacy composed address', () => {
    expect(
      buildDeliveryAddressLines({
        addressLine1: '12 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        deliveryAddress: 'Legacy duplicate address',
      }),
    ).toEqual(['12 MG Road', 'Bengaluru, Karnataka 560001', 'India']);
  });

  it('returns no lines when the address is empty', () => {
    expect(buildDeliveryAddressLines({})).toEqual([]);
  });
});
