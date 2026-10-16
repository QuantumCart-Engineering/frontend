import { Routes } from '@angular/router';
import { HomePage } from './features/home/home-page/home-page';

export const routes: Routes = [
  { path: '', component: HomePage, pathMatch: 'full', title: 'QuantumCart — Shop electronics' },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/catalog/catalog-page/catalog-page').then((m) => m.CatalogPage),
    title: 'Catalog — QuantumCart',
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/product-detail/product-detail-page/product-detail-page').then(
        (m) => m.ProductDetailPage,
      ),
    title: 'Product — QuantumCart',
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart-page/cart-page').then((m) => m.CartPage),
    title: 'Cart — QuantumCart',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout-page/checkout-page').then((m) => m.CheckoutPage),
    title: 'Checkout — QuantumCart',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
    title: 'Sign in — QuantumCart',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register-page/register-page').then((m) => m.RegisterPage),
    title: 'Create account — QuantumCart',
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page').then((m) => m.ProfilePage),
    title: 'Account — QuantumCart',
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/orders-page/orders-page').then((m) => m.OrdersPage),
    title: 'Orders — QuantumCart',
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./features/not-found/not-found-page/not-found-page').then((m) => m.NotFoundPage),
    title: 'Not found — QuantumCart',
  },
  { path: '**', redirectTo: 'not-found' },
];
