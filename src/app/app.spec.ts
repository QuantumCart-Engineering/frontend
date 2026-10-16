import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the site header brand', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-site-header')).toBeTruthy();
    expect(compiled.querySelector('.brand-wordmark')?.textContent).toContain('QuantumCart');

    const brandLink = compiled.querySelector('a.brand') as HTMLAnchorElement | null;
    expect(brandLink?.getAttribute('href')).toBe('/');

    const fullLogo = compiled.querySelector('img.brand-logo') as HTMLImageElement | null;
    expect(fullLogo?.getAttribute('src')).toBe('assets/images/logo.png');

    const iconLogo = compiled.querySelector('img.brand-logo-icon') as HTMLImageElement | null;
    expect(iconLogo?.getAttribute('src')).toBe('assets/images/logo-icon.png');
  });
});
