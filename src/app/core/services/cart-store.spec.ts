import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import { CartStore } from './cart-store';

describe('CartStore (guest)', () => {
  let store: CartStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test' },
      ],
    });
    store = TestBed.inject(CartStore);
  });

  it('starts empty', () => {
    expect(store.isEmpty()).toBe(true);
    expect(store.count()).toBe(0);
  });

  it('adds guest items, merges duplicates and totals quantity', () => {
    store.addGuest('p1', 1, { name: 'Drive', sku: 'QD-1', unitPrice: 10 });
    store.addGuest('p1', 2);
    store.addGuest('p2', 3, { name: 'Chip' });

    expect(store.guestItems().length).toBe(2);
    expect(store.count()).toBe(6);
    expect(store.isEmpty()).toBe(false);
  });

  it('updates and removes guest items', () => {
    store.addGuest('p1', 4, { name: 'Drive' });
    store.updateGuest('p1', 2);
    expect(store.count()).toBe(2);

    store.updateGuest('p1', 0);
    expect(store.guestItems().length).toBe(0);
  });

  it('persists guest items to localStorage', () => {
    store.addGuest('p1', 2, { name: 'Drive' });
    const raw = localStorage.getItem('qc_guest_cart');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)[0].productId).toBe('p1');
  });
});
