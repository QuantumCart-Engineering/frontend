import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './shared/components/site-header/site-header';
import { SiteFooter } from './shared/components/site-footer/site-footer';
import { ToastHost } from './shared/components/toast-host/toast-host';
import { AuthStore } from './core/services/auth-store';
import { CartStore } from './core/services/cart-store';

@Component({
  imports: [RouterOutlet, SiteHeader, SiteFooter, ToastHost],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly cart = inject(CartStore);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.cart.mergeGuestIntoServer();
      this.auth.loadProfile().catch(() => undefined);
    }
  }
}
