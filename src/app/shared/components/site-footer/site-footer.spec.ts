import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteFooter } from './site-footer';

@Component({ template: '', standalone: true })
class BlankPage {}

const ACCESS_KEY = 'qc_access_token';
const USER_KEY = 'qc_user';

const seedSession = () => {
  localStorage.setItem(ACCESS_KEY, 'token');
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: 'u1', email: 'customer@example.com', firstName: 'Ada', lastName: 'Lovelace' }),
  );
};

describe('SiteFooter', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SiteFooter],
      providers: [provideRouter([{ path: '', component: BlankPage }]), provideHttpClient()],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('shows sign-in and account creation to visitors without protected links', async () => {
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/login"]')).toBeTruthy();
    expect(element.querySelector('a[href="/register"]')).toBeTruthy();
    expect(element.querySelector('a[href="/account"]')).toBeNull();
    expect(element.querySelector('a[href="/orders"]')).toBeNull();
    expect(element.querySelector('.footer-link')).toBeNull();
  });

  it('shows account, orders and logout to signed-in customers', async () => {
    seedSession();
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/account"]')).toBeTruthy();
    expect(element.querySelector('a[href="/orders"]')).toBeTruthy();
    expect(element.querySelector('.footer-link')?.textContent).toContain('Logout');
    expect(element.querySelector('a[href="/login"]')).toBeNull();
    expect(element.querySelector('a[href="/register"]')).toBeNull();
  });

  it('renders the stored session correctly on the first change detection', () => {
    seedSession();
    const fixture = TestBed.createComponent(SiteFooter);

    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/login"]')).toBeNull();
    expect(element.querySelector('a[href="/account"]')).toBeTruthy();
    expect(element.querySelector('a[href="/orders"]')).toBeTruthy();
  });

  it('clears the session and updates the footer immediately when logging out', async () => {
    seedSession();
    const fixture = TestBed.createComponent(SiteFooter);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('.footer-link') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(element.querySelector('a[href="/login"]')).toBeTruthy();
    expect(element.querySelector('a[href="/account"]')).toBeNull();

    await fixture.whenStable();
  });
});
