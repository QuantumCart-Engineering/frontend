import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config/app-config';
import { AuthStore } from '../services/auth-store';
import { NotificationService } from '../services/notification.service';
import { authInterceptor } from './auth.interceptor';

const ACCESS_KEY = 'qc_access_token';

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let router: { url: string; navigate: ReturnType<typeof vi.fn> };
  let notify: { showError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    router = { url: '/orders', navigate: vi.fn() };
    notify = { showError: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test' },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notify },
      ],
    });

    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('clears a stale session and redirects when a 401 cannot be refreshed', () => {
    localStorage.setItem(ACCESS_KEY, 'expired-token');
    const store = TestBed.inject(AuthStore);

    client.get('http://test/api/v1/orders').subscribe({ error: () => undefined });
    http
      .expectOne('http://test/api/v1/orders')
      .flush({ success: false }, { status: 401, statusText: 'Unauthorized' });

    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(notify.showError).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/orders' },
    });
  });

  it('does not treat a failed login as an expired session', () => {
    localStorage.setItem(ACCESS_KEY, 'existing-token');
    const store = TestBed.inject(AuthStore);

    client.post('http://test/api/v1/auth/login', {}).subscribe({ error: () => undefined });
    http
      .expectOne('http://test/api/v1/auth/login')
      .flush({ success: false }, { status: 401, statusText: 'Unauthorized' });

    expect(store.isAuthenticated()).toBe(true);
    expect(notify.showError).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
