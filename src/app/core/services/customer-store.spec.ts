import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import type { Address, Customer } from '../models/customer';
import { CustomerStore } from './customer-store';

const customer: Customer = {
  id: 'c1',
  identityUserId: 'u1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const address: Address = {
  id: 'a1',
  customerId: 'c1',
  addressType: 'HOME',
  recipientName: 'Ada',
  addressLine1: '1 Lab St',
  addressLine2: null,
  city: 'London',
  state: 'ENG',
  postalCode: '12345',
  country: 'UK',
  phone: null,
  isDefault: false,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const tick = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('CustomerStore', () => {
  let store: CustomerStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test' },
      ],
    });
    store = TestBed.inject(CustomerStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads an existing customer and their addresses', async () => {
    const promise = store.load('u1');

    http
      .expectOne('http://test/api/v1/customers/by-identity/u1')
      .flush({ success: true, data: customer });
    await tick();
    http
      .expectOne('http://test/api/v1/customers/c1/addresses')
      .flush({ success: true, data: [address] });

    await promise;
    expect(store.customer()?.id).toBe('c1');
    expect(store.addresses().length).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('creates a customer when none exists yet', async () => {
    const promise = store.load('u1');

    http
      .expectOne('http://test/api/v1/customers/by-identity/u1')
      .flush({ success: false, message: 'not found' }, { status: 404, statusText: 'Not Found' });
    await tick();
    http.expectOne('http://test/api/v1/customers').flush({ success: true, data: customer });
    await tick();
    http.expectOne('http://test/api/v1/customers/c1/addresses').flush({ success: true, data: [] });

    await promise;
    expect(store.customer()?.id).toBe('c1');
    expect(store.addresses()).toEqual([]);
  });

  it('records an error when loading fails unexpectedly', async () => {
    const promise = store.load('u1');
    http
      .expectOne('http://test/api/v1/customers/by-identity/u1')
      .flush({ success: false, message: 'boom' }, { status: 500, statusText: 'Server Error' });

    await promise;
    expect(store.error()).toBeTruthy();
    expect(store.loading()).toBe(false);
  });

  it('tracks the default address after adding one', async () => {
    await loadExisting();
    const addPromise = store.addAddress({
      recipientName: 'Ada',
      addressLine1: '2 Lab St',
      city: 'London',
      state: 'ENG',
      postalCode: '999',
      isDefault: true,
    });

    http
      .expectOne('http://test/api/v1/customers/c1/addresses')
      .flush({ success: true, data: { ...address, id: 'a2', isDefault: true } });

    await addPromise;
    const defaults = store.addresses().filter((a) => a.isDefault);
    expect(defaults.length).toBe(1);
    expect(defaults[0].id).toBe('a2');
  });

  async function loadExisting() {
    const promise = store.load('u1');
    http
      .expectOne('http://test/api/v1/customers/by-identity/u1')
      .flush({ success: true, data: customer });
    await tick();
    http
      .expectOne('http://test/api/v1/customers/c1/addresses')
      .flush({ success: true, data: [address] });
    await promise;
  }
});
