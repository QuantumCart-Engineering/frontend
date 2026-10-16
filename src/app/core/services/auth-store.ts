import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../api/auth-api';
import type { AuthUser, AuthUserProfile, LoginRequest, RegisterRequest } from '../models/auth';

const ACCESS_TOKEN_KEY = 'qc_access_token';
const REFRESH_TOKEN_KEY = 'qc_refresh_token';
const USER_KEY = 'qc_user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);

  private readonly _accessToken = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly _refreshToken = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  private readonly _user = signal<AuthUser | null>(this.readUser());
  private readonly _profile = signal<AuthUserProfile | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private persistTokens(access: string | null, refresh: string | null) {
    if (access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    this._accessToken.set(access);
    this._refreshToken.set(refresh);
  }

  async login(payload: LoginRequest): Promise<void> {
    const data = await firstValueFrom(this.api.login(payload));
    this.persistTokens(data.accessToken, data.refreshToken);
    this._user.set(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  async register(payload: RegisterRequest): Promise<void> {
    await firstValueFrom(this.api.register(payload));
    await this.login({ email: payload.email, password: payload.password });
  }

  async refresh(): Promise<string | null> {
    const refresh = this._refreshToken();
    if (!refresh) {
      this.logout();
      return null;
    }
    try {
      const data = await firstValueFrom(this.api.refresh({ refreshToken: refresh }));
      this.persistTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      this.logout();
      return null;
    }
  }

  async loadProfile(): Promise<AuthUserProfile | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    try {
      const profile = await firstValueFrom(this.api.me());
      this._profile.set(profile);
      return profile;
    } catch {
      this._profile.set(null);
      return null;
    }
  }

  logout(): void {
    const refresh = this._refreshToken();
    if (refresh) {
      firstValueFrom(this.api.logout({ refreshToken: refresh })).catch(() => undefined);
    }
    this.persistTokens(null, null);
    this._user.set(null);
    this._profile.set(null);
    localStorage.removeItem(USER_KEY);
  }
}
