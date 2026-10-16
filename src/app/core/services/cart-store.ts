import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartApi } from '../api/cart-api';
import { CatalogApi } from '../api/catalog-api';
import type { CartItemEnriched, CartWithItems } from '../models/cart';
import { toLineTotal } from '../utils/money';

interface GuestItem {
  productId: string;
  quantity: number;
  name?: string;
  sku?: string;
  unitPrice?: number;
}

const GUEST_CART_KEY = 'qc_guest_cart';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly cartApi = inject(CartApi);
  private readonly catalogApi = inject(CatalogApi);

  private readonly _cart = signal<CartWithItems | null>(null);
  private readonly _enriched = signal<CartItemEnriched[]>([]);
  private readonly _loading = signal(false);
  private readonly _guest = signal<GuestItem[]>(this.readGuest());

  readonly cart = this._cart.asReadonly();
  readonly itemsEnriched = this._enriched.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly guestItems = this._guest.asReadonly();
  readonly isEmpty = computed(() => {
    const serverCount = this._cart()?.items.length ?? 0;
    const guestCount = this._guest().reduce((s, i) => s + i.quantity, 0);
    return serverCount === 0 && guestCount === 0;
  });
  readonly count = computed(() => {
    const serverCount = this._cart()?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
    const guestCount = this._guest().reduce((s, i) => s + i.quantity, 0);
    return serverCount + guestCount;
  });

  private readGuest(): GuestItem[] {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? (JSON.parse(raw) as GuestItem[]) : [];
    } catch {
      return [];
    }
  }

  private writeGuest(items: GuestItem[]) {
    this._guest.set(items);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  }

  addGuest(
    productId: string,
    quantity: number,
    meta?: { name: string; sku?: string; unitPrice?: number },
  ) {
    const items = [...this._guest()];
    const i = items.findIndex((x) => x.productId === productId);
    if (i >= 0) {
      items[i] = { ...items[i], quantity: items[i].quantity + quantity, ...meta };
    } else {
      items.push({ productId, quantity, ...meta });
    }
    this.writeGuest(items);
  }

  removeGuest(productId: string) {
    this.writeGuest(this._guest().filter((x) => x.productId !== productId));
  }

  updateGuest(productId: string, quantity: number) {
    const items = this._guest().map((x) => (x.productId === productId ? { ...x, quantity } : x));
    this.writeGuest(items.filter((x) => x.quantity > 0));
  }

  clearGuest() {
    this.writeGuest([]);
  }

  async hydrate(): Promise<void> {
    if (this._loading()) return;
    this._loading.set(true);
    try {
      const cart = await firstValueFrom(this.cartApi.getCart());
      this._cart.set(cart);
      await this.enrichCart(cart);
    } finally {
      this._loading.set(false);
    }
  }

  private async enrichCart(cart: CartWithItems) {
    const ids = Array.from(new Set(cart.items.map((i) => i.product_id)));
    const products = new Map<string, { id: string; name: string; sku: string }>();
    await Promise.all(
      ids.map(async (id) => {
        try {
          const p = await firstValueFrom(this.catalogApi.getProduct(id));
          products.set(id, { id: p.id, name: p.name, sku: p.sku });
        } catch {
          // ignore enrichment failures
        }
      }),
    );
    const enriched: CartItemEnriched[] = cart.items.map((i) => ({
      ...i,
      product: products.get(i.product_id),
      lineTotal: toLineTotal(i.quantity, i.unit_price),
    }));
    this._enriched.set(enriched);
  }

  async addToServer(cartId: string, productId: string, quantity: number) {
    await firstValueFrom(this.cartApi.addItem(cartId, { productId, quantity }));
    await this.hydrate();
  }

  async updateServer(cartId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      await firstValueFrom(this.cartApi.removeItem(cartId, productId));
    } else {
      await firstValueFrom(this.cartApi.updateItem(cartId, productId, { quantity }));
    }
    await this.hydrate();
  }

  async removeServer(cartId: string, productId: string) {
    await firstValueFrom(this.cartApi.removeItem(cartId, productId));
    await this.hydrate();
  }

  async clearServer(cartId: string) {
    await firstValueFrom(this.cartApi.clearCart(cartId));
    await this.hydrate();
  }

  async checkout(cartId: string) {
    const res = await firstValueFrom(this.cartApi.checkout(cartId));
    this._cart.set(res);
    await this.enrichCart(res);
    return res;
  }

  async mergeGuestIntoServer(): Promise<void> {
    const guest = this._guest();
    if (guest.length === 0) {
      return;
    }
    try {
      const cart = await firstValueFrom(this.cartApi.getCart());
      this._cart.set(cart);
      await this.enrichCart(cart);
      const existing = new Set(cart.items.map((i) => i.product_id));
      for (const g of guest) {
        try {
          if (existing.has(g.productId)) {
            const cur = cart.items.find((i) => i.product_id === g.productId);
            const qty = (cur?.quantity ?? 0) + g.quantity;
            await firstValueFrom(this.cartApi.updateItem(cart.id, g.productId, { quantity: qty }));
          } else {
            await firstValueFrom(
              this.cartApi.addItem(cart.id, { productId: g.productId, quantity: g.quantity }),
            );
            existing.add(g.productId);
          }
        } catch {
          // skip individual failures
        }
      }
      await this.hydrate();
      this.clearGuest();
    } catch {
      // ignore if not logged in
    }
  }

  reset() {
    this._cart.set(null);
    this._enriched.set([]);
    this._loading.set(false);
  }
}
