import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

const ACCESS_KEY = 'qc_access_token';
const USER_KEY = 'qc_user';

const seedSession = () => {
  localStorage.setItem(ACCESS_KEY, 'token');
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: 'u1', email: 'customer@example.com', firstName: 'Ada', lastName: 'Lovelace' }),
  );
};

describe('customer route guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
  });

  afterEach(() => localStorage.clear());

  const run = (guard: CanActivateFn, url = '/account') =>
    TestBed.runInInjectionContext(() => guard({} as never, { url } as never));

  it('authGuard allows an authenticated customer', () => {
    seedSession();
    expect(run(authGuard)).toBe(true);
  });

  it('authGuard redirects unauthenticated visitors to login with a return URL', () => {
    const result = run(authGuard, '/orders') as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/login?returnUrl=%2Forders');
  });

  it('guestGuard keeps an authenticated customer away from auth pages', () => {
    seedSession();
    const result = run(guestGuard, '/login') as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/account');
  });

  it('guestGuard lets visitors reach auth pages', () => {
    expect(run(guestGuard, '/login')).toBe(true);
  });
});
