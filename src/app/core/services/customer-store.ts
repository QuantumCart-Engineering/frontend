import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CustomerApi } from '../api/customer-api';
import type {
  Address,
  CreateAddressRequest,
  Customer,
  UpdateAddressRequest,
  UpdateCustomerRequest,
} from '../models/customer';

@Injectable({ providedIn: 'root' })
export class CustomerStore {
  private readonly api = inject(CustomerApi);

  private readonly _customer = signal<Customer | null>(null);
  private readonly _addresses = signal<Address[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly customer = this._customer.asReadonly();
  readonly addresses = this._addresses.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(identityUserId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._customer.set(await this.ensureCustomer(identityUserId));
      this._addresses.set(await firstValueFrom(this.api.listAddresses(this._customer()!.id)));
    } catch {
      this._error.set('We could not load your profile. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  private async ensureCustomer(identityUserId: string): Promise<Customer> {
    try {
      return await firstValueFrom(this.api.getByIdentity(identityUserId));
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status === 404) {
        return await firstValueFrom(this.api.create({ firstName: 'Customer' }));
      }
      throw e;
    }
  }

  async updateCustomer(patch: UpdateCustomerRequest): Promise<void> {
    const c = this._customer();
    if (!c) return;
    this._customer.set(await firstValueFrom(this.api.update(c.id, patch)));
  }

  async addAddress(req: CreateAddressRequest): Promise<void> {
    const c = this._customer();
    if (!c) return;
    const a = await firstValueFrom(this.api.createAddress(c.id, req));
    this._addresses.update((xs) => [a, ...xs]);
    if (a.isDefault) {
      this._addresses.update((xs) => xs.map((x) => ({ ...x, isDefault: x.id === a.id })));
    }
  }

  async updateAddress(addressId: string, req: UpdateAddressRequest): Promise<void> {
    const c = this._customer();
    if (!c) return;
    const a = await firstValueFrom(this.api.updateAddress(c.id, addressId, req));
    this._addresses.update((xs) => xs.map((x) => (x.id === a.id ? a : x)));
    if (a.isDefault) {
      this._addresses.update((xs) => xs.map((x) => ({ ...x, isDefault: x.id === a.id })));
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    const c = this._customer();
    if (!c) return;
    await firstValueFrom(this.api.deleteAddress(c.id, addressId));
    this._addresses.update((xs) => xs.filter((x) => x.id !== addressId));
  }

  reset(): void {
    this._customer.set(null);
    this._addresses.set([]);
    this._error.set(null);
  }
}
