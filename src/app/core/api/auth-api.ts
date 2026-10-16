import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type {
  LoginRequest,
  LoginResponse,
  LoginResponseData,
  LogoutRequest,
  LogoutResponse,
  MeResponse,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from '../models/auth';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  login(payload: LoginRequest): Observable<LoginResponseData> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/api/v1/auth/login`, payload)
      .pipe(map((res) => res.data));
  }

  register(payload: RegisterRequest): Observable<RegisterResponse['data']> {
    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/api/v1/auth/register`, payload)
      .pipe(map((res) => res.data));
  }

  me(): Observable<MeResponse['data']> {
    return this.http.get<MeResponse>(`${this.baseUrl}/api/v1/auth/me`).pipe(map((res) => res.data));
  }

  refresh(payload: RefreshRequest): Observable<RefreshResponse['data']> {
    return this.http
      .post<RefreshResponse>(`${this.baseUrl}/api/v1/auth/refresh`, payload)
      .pipe(map((res) => res.data));
  }

  logout(payload: LogoutRequest): Observable<void> {
    return this.http
      .post<LogoutResponse>(`${this.baseUrl}/api/v1/auth/logout`, payload)
      .pipe(map(() => undefined));
  }
}
