import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth">
      <div class="auth-card surface-strong fade-in">
        <span class="tag">Welcome back</span>
        <h1 class="auth-title">Sign in to QuantumCart</h1>
        <p class="auth-subtitle">Access your cart, orders and saved addresses.</p>

        <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label class="field-label" for="email">Email</label>
            <input
              id="email"
              class="input"
              type="email"
              formControlName="email"
              autocomplete="email"
              placeholder="you@example.com"
              [attr.aria-invalid]="emailInvalid()"
              [attr.aria-describedby]="emailInvalid() ? 'email-error' : null"
            />
            @if (emailInvalid()) {
              <p class="error-text" id="email-error" role="alert">Enter a valid email address.</p>
            }
          </div>

          <div class="field">
            <label class="field-label" for="password">Password</label>
            <input
              id="password"
              class="input"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              placeholder="••••••••"
              [attr.aria-invalid]="passwordInvalid()"
              [attr.aria-describedby]="passwordInvalid() ? 'password-error' : null"
            />
            @if (passwordInvalid()) {
              <p class="error-text" id="password-error" role="alert">Password is required.</p>
            }
          </div>

          <button class="btn submit" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="switch">
          New here?
          <a routerLink="/register" [queryParams]="{ returnUrl: safeReturnUrl }"
            >Create an account</a
          >
        </p>
      </div>
    </main>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly cart = inject(CartStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly safeReturnUrl = this.safeUrl(this.route.snapshot.queryParamMap.get('returnUrl') ?? '/');

  emailInvalid(): boolean {
    const c = this.form.controls.email;
    return c.touched && c.invalid;
  }

  passwordInvalid(): boolean {
    const c = this.form.controls.password;
    return c.touched && c.invalid;
  }

  private safeUrl(url: string): string {
    return url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.login({
        email: this.form.value.email!,
        password: this.form.value.password!,
      });
      await this.cart.mergeGuestIntoServer();
      this.notify.showSuccess('Signed in successfully');
      await this.router.navigateByUrl(this.safeReturnUrl);
    } catch {
      // interceptor surfaces error
    } finally {
      this.loading.set(false);
    }
  }
}
