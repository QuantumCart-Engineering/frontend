import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { CustomerStore } from '../../../core/services/customer-store';
import { NotificationService } from '../../../core/services/notification.service';
import { OrderStore } from '../../../core/services/order-store';
import { CatalogApi } from '../../../core/api/catalog-api';
import { CheckoutPage } from './checkout-page';

const activatedRouteStub = {
  snapshot: {
    queryParamMap: {
      get: (_key: string) => null,
    },
  },
};

const tick = () => new Promise<void>((resolve) => setTimeout(resolve));

const create = (
  orderStore: any,
  customerStore: any = { loadProfile: () => Promise.resolve(null) },
  user: any = { id: 'user-1' },
) => {
  TestBed.configureTestingModule({
    imports: [CheckoutPage],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: activatedRouteStub },
      { provide: AuthStore, useValue: { isAuthenticated: () => true, user: () => user } },
      {
        provide: CartStore,
        useValue: {
          loading: () => false,
          itemsEnriched: () => [],
          hydrate: () => Promise.resolve(),
        },
      },
      { provide: CustomerStore, useValue: customerStore },
      { provide: CatalogApi, useValue: {} },
      { provide: NotificationService, useValue: { showSuccess: () => undefined } },
      { provide: OrderStore, useValue: orderStore },
    ],
  });
  return TestBed.createComponent(CheckoutPage);
};

const fillValidForm = (component: CheckoutPage) => {
  component.form.setValue({
    receiverName: '  Asha Rao  ',
    deliveryMobile: '+91 98765 43210',
    addressLine1: '  12 MG Road  ',
    addressLine2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    paymentMethod: 'UPI',
  });
};

const createdOrder = {
  id: 'order-1',
  orderNumber: 'QC-1',
  userId: 'user-1',
  status: 'CONFIRMED',
  subtotal: 100,
  total: 100,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  items: [],
};

describe('CheckoutPage', () => {
  it('submits normalized delivery details with the order', async () => {
    const createOrder = vi.fn().mockResolvedValue(createdOrder);
    const fixture = create({ createOrder });
    const component = fixture.componentInstance;

    fillValidForm(component);
    await component.submit();

    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(createOrder).toHaveBeenCalledWith({
      source: 'CART',
      paymentMethod: 'UPI',
      receiverName: 'Asha Rao',
      deliveryMobile: '9876543210',
      addressLine1: '12 MG Road',
      addressLine2: undefined,
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    });
    expect(component.placed()).toEqual(createdOrder);
  });

  it('does not submit when a required delivery field is blank', async () => {
    const createOrder = vi.fn().mockResolvedValue(createdOrder);
    const fixture = create({ createOrder });
    const component = fixture.componentInstance;

    fillValidForm(component);
    component.form.controls.city.setValue('   ');
    await component.submit();

    expect(createOrder).not.toHaveBeenCalled();
    expect(component.submitting()).toBe(false);
  });

  it('does not submit when the PIN code is not six digits', async () => {
    const createOrder = vi.fn().mockResolvedValue(createdOrder);
    const fixture = create({ createOrder });
    const component = fixture.componentInstance;

    fillValidForm(component);
    component.form.controls.postalCode.setValue('56000');
    await component.submit();

    expect(createOrder).not.toHaveBeenCalled();
  });

  it('does not allow duplicate submissions while an order is in progress', async () => {
    let resolveOrder: (value: unknown) => void = () => undefined;
    const createOrder = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveOrder = resolve;
        }),
    );
    const fixture = create({ createOrder });
    const component = fixture.componentInstance;

    fillValidForm(component);
    const first = component.submit();
    const second = component.submit();
    resolveOrder(createdOrder);
    await Promise.all([first, second]);

    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  it('shows a useful error message when order creation fails', async () => {
    const createOrder = vi.fn().mockRejectedValue({
      error: { error: { message: 'Payment failed' } },
    });
    const fixture = create({ createOrder });
    const component = fixture.componentInstance;

    fillValidForm(component);
    await component.submit();

    expect(component.submitError()).toBe('Payment failed');
    expect(component.placed()).toBeNull();
    expect(component.submitting()).toBe(false);
  });

  it('prefills the receiver name from the saved customer profile', async () => {
    const loadProfile = vi.fn().mockResolvedValue({
      firstName: '  Asha ',
      lastName: ' Rao  ',
    });
    const fixture = create({ createOrder: vi.fn() }, { loadProfile });
    const component = fixture.componentInstance;

    component.reload();
    await tick();

    expect(loadProfile).toHaveBeenCalledWith('user-1');
    expect(component.form.controls.receiverName.value).toBe('Asha Rao');
  });

  it('leaves the receiver name empty when no saved profile exists', async () => {
    const loadProfile = vi.fn().mockResolvedValue(null);
    const fixture = create({ createOrder: vi.fn() }, { loadProfile });
    const component = fixture.componentInstance;

    component.reload();
    await tick();

    expect(component.form.controls.receiverName.value).toBe('');
  });

  it('leaves the receiver name empty when the saved name is blank', async () => {
    const loadProfile = vi.fn().mockResolvedValue({ firstName: '   ', lastName: null });
    const fixture = create({ createOrder: vi.fn() }, { loadProfile });
    const component = fixture.componentInstance;

    component.reload();
    await tick();

    expect(component.form.controls.receiverName.value).toBe('');
  });

  it('uses the account name for a legacy placeholder customer profile', async () => {
    const loadProfile = vi.fn().mockResolvedValue({ firstName: 'Customer', lastName: null });
    const fixture = create(
      { createOrder: vi.fn() },
      { loadProfile },
      {
        id: 'user-1',
        firstName: 'Akash',
        lastName: 'Test',
      },
    );
    const component = fixture.componentInstance;

    component.reload();
    await tick();

    expect(component.form.controls.receiverName.value).toBe('Akash Test');
  });

  it('does not overwrite a name entered while the profile is loading', async () => {
    let resolveProfile: (value: unknown) => void = () => undefined;
    const loadProfile = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve;
        }),
    );
    const fixture = create({ createOrder: vi.fn() }, { loadProfile });
    const component = fixture.componentInstance;

    component.reload();
    component.form.controls.receiverName.setValue('Manual Name');
    component.form.controls.receiverName.markAsDirty();
    resolveProfile({ firstName: 'Asha', lastName: 'Rao' });
    await tick();

    expect(component.form.controls.receiverName.value).toBe('Manual Name');
  });

  it('does not overwrite a manual edit after a later profile refresh', async () => {
    const loadProfile = vi
      .fn()
      .mockResolvedValueOnce({ firstName: 'Asha', lastName: 'Rao' })
      .mockResolvedValueOnce({ firstName: 'Updated', lastName: 'Name' });
    const fixture = create({ createOrder: vi.fn() }, { loadProfile });
    const component = fixture.componentInstance;

    component.reload();
    await tick();
    component.form.controls.receiverName.setValue('Manual Name');
    component.form.controls.receiverName.markAsDirty();
    component.reload();
    await tick();

    expect(component.form.controls.receiverName.value).toBe('Manual Name');
  });

  it('allows manual entry when loading the customer profile fails', async () => {
    const createOrder = vi.fn().mockResolvedValue(createdOrder);
    const loadProfile = vi.fn().mockRejectedValue(new Error('profile unavailable'));
    const fixture = create({ createOrder }, { loadProfile });
    const component = fixture.componentInstance;

    component.reload();
    await tick();
    expect(component.form.controls.receiverName.value).toBe('');

    fillValidForm(component);
    await component.submit();

    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ receiverName: 'Asha Rao' }));
  });

  it('submits an edited receiver name instead of the saved name', async () => {
    const createOrder = vi.fn().mockResolvedValue(createdOrder);
    const loadProfile = vi.fn().mockResolvedValue({ firstName: 'Asha', lastName: 'Rao' });
    const fixture = create({ createOrder }, { loadProfile });
    const component = fixture.componentInstance;

    component.reload();
    await tick();
    fillValidForm(component);
    component.form.controls.receiverName.setValue('Guest User');
    await component.submit();

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ receiverName: 'Guest User' }),
    );
  });
});
