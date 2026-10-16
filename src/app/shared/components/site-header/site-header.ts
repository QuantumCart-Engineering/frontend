import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  private readonly auth = inject(AuthStore);
  private readonly cart = inject(CartStore);
  private readonly router = inject(Router);

  readonly isAuth = this.auth.isAuthenticated;
  readonly count = this.cart.count;
  readonly mobileOpen = signal(false);
  readonly query = signal('');

  toggleMobile() {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }

  onSearchInput(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  async submitSearch(event: Event) {
    event.preventDefault();
    const term = this.query().trim();
    this.closeMobile();
    await this.router.navigate(['/products'], {
      queryParams: term ? { search: term } : {},
    });
  }

  async logout() {
    this.auth.logout();
    this.cart.reset();
    this.closeMobile();
    await this.router.navigate(['/']);
  }
}
