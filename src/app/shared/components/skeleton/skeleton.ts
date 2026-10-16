import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: '',
  styles: [
    `
      :host {
        display: block;
        height: var(--skeleton-h, 1rem);
        border-radius: var(--skeleton-r, var(--qc-radius-sm));
      }
    `,
  ],
})
export class Skeleton {
  @Input() @HostBinding('style.--skeleton-h') height = '1rem';
  @Input() @HostBinding('style.--skeleton-r') radius = 'var(--qc-radius-sm)';
  @HostBinding('class') class = 'skeleton';
  @HostBinding('attr.aria-hidden') readonly ariaHidden = 'true';
}
