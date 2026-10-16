import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/services/auth-store';
import { CartStore } from '../../../core/services/cart-store';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth">
      <div class="auth-card wide surface-strong fade-in">
        <span class="tag">Get started</span>
        <h1 class="auth-title">Create your account</h1>
        <p class="auth-subtitle">Join QuantumCart to shop, track orders and save addresses.</p>

        <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-row">
            <div class="field">
              <label class="field-label" for="firstName">First name</label>
              <input
                id="firstName"
                class="input"
                type="text"
                formControlName="firstName"
                autocomplete="given-name"
                [attr.aria-invalid]="invalid('firstName')"
                [attr.aria-describedby]="invalid('firstName') ? 'firstName-error' : null"
              />
              @if (invalid('firstName')) {
                <p class="error-text" id="firstName-error" role="alert">First name is required.</p>
              }
            </div>
            <div class="field">
              <label class="field-label" for="lastName">Last name</label>
              <input
                id="lastName"
                class="input"
                type="text"
                formControlName="lastName"
                autocomplete="family-name"
                [attr.aria-invalid]="invalid('lastName')"
                [attr.aria-describedby]="invalid('lastName') ? 'lastName-error' : null"
              />
              @if (invalid('lastName')) {
                <p class="error-text" id="lastName-error" role="alert">Last name is required.</p>
              }
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="email">Email</label>
            <input
              id="email"
              class="input"
              type="email"
              formControlName="email"
              autocomplete="email"
              placeholder="you@example.com"
              [attr.aria-invalid]="invalid('email')"
              [attr.aria-describedby]="invalid('email') ? 'email-error' : null"
            />
            @if (invalid('email')) {
              <p class="error-text" id="email-error" role="alert">Enter a valid email address.</p>
            }
          </div>

          <div class="field">
            <label class="field-label" for="phone">Phone</label>
            <input
              id="phone"
              class="input"
              type="tel"
              formControlName="phone"
              autocomplete="tel"
              placeholder="+91 98765 43210"
              [attr.aria-invalid]="invalid('phone')"
              [attr.aria-describedby]="invalid('phone') ? 'phone-error' : null"
            />
            @if (invalid('phone')) {
              <p class="error-text" id="phone-error" role="alert">Phone number is required.</p>
            }
          </div>

          <div class="field">
            <label class="field-label" for="password">Password</label>
            <input
              id="password"
              class="input"
              type="password"
              formControlName="password"
              autocomplete="new-password"
              [attr.aria-invalid]="invalid('password')"
              [attr.aria-describedby]="invalid('password') ? 'password-error' : 'password-hint'"
            />
            @if (invalid('password')) {
              <p class="error-text" id="password-error" role="alert">Use at least 8 characters.</p>
            } @else {
              <p class="field-hint" id="password-hint">At least 8 characters.</p>
            }
          </div>

          <button class="btn submit" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="switch">
          Already have an account?
          <a routerLink="/login" [queryParams]="{ returnUrl: safeReturnUrl }">Sign in</a>
        </p>
      </div>
    </main>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly cart = inject(CartStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly safeReturnUrl = this.safeUrl(this.route.snapshot.queryParamMap.get('returnUrl') ?? '/');

  invalid(name: 'firstName' | 'lastName' | 'email' | 'phone' | 'password'): boolean {
    const c = this.form.controls[name];
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
      await this.auth.register({
        firstName: this.form.value.firstName!,
        lastName: this.form.value.lastName!,
        email: this.form.value.email!,
        phone: this.form.value.phone!,
        password: this.form.value.password!,
      });
      await this.cart.mergeGuestIntoServer();
      this.notify.showSuccess('Account created — welcome to QuantumCart');
      await this.router.navigateByUrl(this.safeReturnUrl);
    } catch {
      // interceptor surfaces error
    } finally {
      this.loading.set(false);
    }
  }
}
