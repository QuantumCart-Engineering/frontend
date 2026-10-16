import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Address } from '../../../core/models/customer';
import { AuthStore } from '../../../core/services/auth-store';
import { CustomerStore } from '../../../core/services/customer-store';
import { NotificationService } from '../../../core/services/notification.service';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Skeleton, EmptyState, ErrorState],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly customers = inject(CustomerStore);
  private readonly notify = inject(NotificationService);

  readonly user = this.auth.user;
  readonly profile = this.auth.profile;
  readonly addresses = this.customers.addresses;
  readonly loading = this.customers.loading;
  readonly error = this.customers.error;
  readonly saving = signal(false);
  readonly showForm = signal(false);

  readonly form = this.fb.group({
    addressType: ['HOME'],
    recipientName: ['', [Validators.required]],
    addressLine1: ['', [Validators.required]],
    addressLine2: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    country: ['India', [Validators.required]],
    phone: [''],
    isDefault: [false],
  });

  ngOnInit() {
    this.reload();
  }

  reload() {
    const id = this.user()?.id;
    if (!id) return;
    this.customers.load(id);
  }

  fullName(): string {
    const p = this.profile();
    const u = this.user();
    const first = p?.firstName ?? u?.firstName ?? '';
    const last = p?.lastName ?? u?.lastName ?? '';
    return `${first} ${last}`.trim() || '—';
  }

  email(): string {
    return this.profile()?.email ?? this.user()?.email ?? '—';
  }

  phone(): string {
    return this.profile()?.phone ?? this.user()?.phone ?? '—';
  }

  statusLabel(): string {
    return this.profile()?.status ?? '—';
  }

  toggleForm() {
    this.showForm.update((v) => !v);
  }

  async addAddress() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const v = this.form.value;
      await this.customers.addAddress({
        addressType: v.addressType as Address['addressType'],
        recipientName: v.recipientName!,
        addressLine1: v.addressLine1!,
        addressLine2: v.addressLine2 || null,
        city: v.city!,
        state: v.state!,
        postalCode: v.postalCode!,
        country: v.country!,
        phone: v.phone || null,
        isDefault: !!v.isDefault,
      });
      this.notify.showSuccess('Address saved');
      this.form.reset({ addressType: 'HOME', country: 'India', isDefault: false });
      this.showForm.set(false);
    } catch {
      // interceptor surfaces error
    } finally {
      this.saving.set(false);
    }
  }

  async makeDefault(a: Address) {
    try {
      await this.customers.updateAddress(a.id, { isDefault: true });
      this.notify.showSuccess('Default address updated');
    } catch {
      // interceptor surfaces error
    }
  }

  async removeAddress(a: Address) {
    try {
      await this.customers.deleteAddress(a.id);
      this.notify.showSuccess('Address removed');
    } catch {
      // interceptor surfaces error
    }
  }
}
