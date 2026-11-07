import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../../core/api/catalog-api';
import type { Customer } from '../../../core/models/customer';
import { Order } from '../../../core/models/order';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { CustomerStore } from '../../../core/services/customer-store';
import { NotificationService } from '../../../core/services/notification.service';
import { OrderStore } from '../../../core/services/order-store';
import { formatCurrency, toLineTotal } from '../../../core/utils/money';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import {
  indianMobileValidator,
  indianPincodeValidator,
  normalizeMobile,
  trimmedRequired,
} from './checkout-validation';

type PaymentMethod = 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';

interface BuyNowProduct {
  id: string;
  name: string;
  price: number;
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Skeleton, EmptyState, ErrorState],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  private readonly cart = inject(CartStore);
  private readonly customers = inject(CustomerStore);
  private readonly orders = inject(OrderStore);
  private readonly catalog = inject(CatalogApi);
  private readonly notify = inject(NotificationService);

  readonly isAuth = this.auth.isAuthenticated;
  readonly submitting = signal(false);
  readonly placed = signal<Order | null>(null);
  readonly buyNowProduct = signal<BuyNowProduct | null>(null);
  readonly buyNowLoading = signal(false);
  readonly loadError = signal(false);
  readonly submitError = signal<string | null>(null);
  private submitted = false;

  readonly methods: { value: PaymentMethod; label: string }[] = [
    { value: 'UPI', label: 'UPI' },
    { value: 'DEBIT_CARD', label: 'Debit card' },
    { value: 'CREDIT_CARD', label: 'Credit card' },
  ];

  readonly form = this.fb.group({
    receiverName: ['', [Validators.required, Validators.maxLength(150), trimmedRequired]],
    deliveryMobile: ['', [Validators.required, indianMobileValidator]],
    addressLine1: ['', [Validators.required, Validators.maxLength(255), trimmedRequired]],
    addressLine2: ['', [Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(100), trimmedRequired]],
    state: ['', [Validators.required, Validators.maxLength(100), trimmedRequired]],
    postalCode: ['', [Validators.required, indianPincodeValidator, trimmedRequired]],
    country: ['India', [Validators.required, Validators.maxLength(100), trimmedRequired]],
    paymentMethod: ['UPI' as PaymentMethod, [Validators.required]],
  });

  private readonly buyNowId = this.route.snapshot.queryParamMap.get('productId');

  readonly isBuyNow = computed(() => !!this.buyNowId);

  readonly buyNowQty = computed(
    () => Number(this.route.snapshot.queryParamMap.get('quantity')) || 1,
  );

  readonly loading = computed(() => this.cart.loading() || this.buyNowLoading());

  readonly cartLines = computed(() =>
    this.cart.itemsEnriched().map((i) => ({
      productId: i.product_id,
      name: i.product?.name ?? 'Product',
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
  );

  readonly cartTotal = computed(() => this.cartLines().reduce((s, l) => s + l.lineTotal, 0));

  readonly hasItems = computed(() =>
    this.isBuyNow() ? !!this.buyNowProduct() : this.cartLines().length > 0,
  );

  readonly safeReturnUrl = this.safeUrl(
    this.route.snapshot.queryParamMap.get('returnUrl') ?? '/checkout',
  );

  readonly totalText = computed(() =>
    this.isBuyNow()
      ? this.money(toLineTotal(this.buyNowQty(), this.buyNowProduct()?.price ?? 0))
      : this.money(this.cartTotal()),
  );

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loadError.set(false);
    if (!this.auth.isAuthenticated()) return;
    void this.prefillReceiverName();
    if (this.isBuyNow()) {
      this.loadBuyNowProduct(this.buyNowId!);
    } else {
      this.cart.hydrate().catch(() => this.loadError.set(true));
    }
  }

  private async prefillReceiverName() {
    const identityUserId = this.auth.user()?.id;
    if (!identityUserId) return;

    let customer: Customer | null;
    try {
      customer = await this.customers.loadProfile(identityUserId);
    } catch {
      return;
    }

    const name = this.receiverNameFor(customer);
    const control = this.form.controls.receiverName;
    if (!name || control.dirty || (control.value ?? '').trim()) return;
    control.setValue(name);
  }

  private receiverNameFor(customer: Customer | null): string {
    if (!customer) return '';
    const user = this.auth.user();
    const name =
      customer.firstName.trim() === 'Customer' && !customer.lastName?.trim() && user
        ? this.joinName(user.firstName, user.lastName)
        : this.joinName(customer.firstName, customer.lastName);
    return name.length <= 150 ? name : '';
  }

  private joinName(first?: string | null, last?: string | null): string {
    return [first, last]
      .map((part) => part?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
  }

  private async loadBuyNowProduct(productId: string) {
    this.buyNowLoading.set(true);
    try {
      const p = await firstValueFrom(this.catalog.getProduct(productId));
      this.buyNowProduct.set({ id: p.id, name: p.name, price: p.price });
    } catch {
      this.loadError.set(true);
    } finally {
      this.buyNowLoading.set(false);
    }
  }

  private safeUrl(url: string): string {
    return url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }

  money(value: number | null | undefined) {
    return formatCurrency(value ?? 0);
  }

  orderLabel(status: Order['status']) {
    return status === 'CONFIRMED'
      ? 'Confirmed'
      : status === 'CANCELLED'
        ? 'Cancelled'
        : 'Pending payment';
  }

  lineLabel() {
    const p = this.buyNowProduct();
    return p ? `${p.name} × ${this.buyNowQty()}` : '';
  }

  buyNowLineTotal() {
    const p = this.buyNowProduct();
    return this.money(p ? toLineTotal(this.buyNowQty(), p.price) : 0);
  }

  showError(
    field:
      | 'receiverName'
      | 'deliveryMobile'
      | 'addressLine1'
      | 'addressLine2'
      | 'city'
      | 'state'
      | 'postalCode'
      | 'country',
  ): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted);
  }

  async submit() {
    this.submitted = true;
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const {
      paymentMethod,
      receiverName,
      deliveryMobile,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = this.form.getRawValue();

    const delivery = {
      receiverName: (receiverName ?? '').trim(),
      deliveryMobile: normalizeMobile(deliveryMobile ?? ''),
      addressLine1: (addressLine1 ?? '').trim(),
      addressLine2: (addressLine2 ?? '').trim() || undefined,
      city: (city ?? '').trim(),
      state: (state ?? '').trim(),
      postalCode: (postalCode ?? '').trim(),
      country: (country ?? '').trim() || 'India',
    };

    try {
      let order: Order;
      if (this.isBuyNow() && this.buyNowProduct()) {
        order = await this.orders.createOrder({
          source: 'BUY_NOW',
          productId: this.buyNowProduct()!.id,
          quantity: this.buyNowQty(),
          paymentMethod: paymentMethod as PaymentMethod,
          ...delivery,
        });
      } else {
        order = await this.orders.createOrder({
          source: 'CART',
          paymentMethod: paymentMethod as PaymentMethod,
          ...delivery,
        });
        this.cart.hydrate().catch(() => undefined);
      }
      this.placed.set(order);
      this.notify.showSuccess('Order placed successfully');
    } catch (err: any) {
      this.submitError.set(
        err?.error?.error?.message ||
          err?.error?.message ||
          err?.message ||
          'We could not place your order. Please try again.',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
