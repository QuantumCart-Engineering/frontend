import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../services/auth-store';
import { NotificationService } from '../services/notification.service';

const AUTH_ENDPOINT = /\/api\/v1\/auth\/(login|register|refresh|logout)/;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const notify = inject(NotificationService);

  const token = store.accessToken();
  const authorized = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authorized).pipe(
    catchError((err: unknown) => {
      const isAuthEndpoint = AUTH_ENDPOINT.test(req.url);
      const canRefresh =
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !isAuthEndpoint &&
        !!store.refreshToken();

      if (!canRefresh) {
        return throwError(() => err);
      }

      return from(store.refresh()).pipe(
        switchMap((newToken) => {
          if (!newToken) {
            notify.showError('Your session expired. Please sign in again.');
            if (!router.url.startsWith('/login')) {
              router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
            }
            return throwError(() => err);
          }
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        }),
      );
    }),
  );
};
