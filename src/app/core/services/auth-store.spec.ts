import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import { AuthStore } from './auth-store';

describe('AuthStore', () => {
  let store: AuthStore;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test' },
      ],
    });
    store = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts unauthenticated', () => {
    expect(store.isAuthenticated()).toBe(false);
  });

  it('logs in, persists tokens and exposes the user', async () => {
    const promise = store.login({ email: 'a@b.com', password: 'secret' });

    const req = http.expectOne('http://test/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'ok',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u1', email: 'a@b.com', phone: '123', firstName: 'Ada', lastName: 'Lovelace' },
      },
    });

    await promise;
    expect(store.isAuthenticated()).toBe(true);
    expect(store.accessToken()).toBe('access-token');
    expect(store.user()?.firstName).toBe('Ada');
    expect(localStorage.getItem('qc_access_token')).toBe('access-token');
  });

  it('clears session on logout', async () => {
    const loginPromise = store.login({ email: 'a@b.com', password: 'secret' });
    http.expectOne('http://test/api/v1/auth/login').flush({
      success: true,
      message: 'ok',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u1', email: 'a@b.com', phone: '123', firstName: 'Ada', lastName: 'Lovelace' },
      },
    });
    await loginPromise;

    store.logout();
    http.expectOne('http://test/api/v1/auth/logout').flush({ success: true, message: 'bye' });

    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(localStorage.getItem('qc_access_token')).toBeNull();
  });
});
