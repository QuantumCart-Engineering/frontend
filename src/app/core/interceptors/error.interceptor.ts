import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { extractErrorMessage } from '../utils/errors';
import { SILENT_ERROR } from './http-context';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: unknown) => {
      const status = err instanceof HttpErrorResponse ? err.status : 0;
      const silent = req.context.get(SILENT_ERROR);

      if (!silent && status !== 401 && status !== 404) {
        const body = err instanceof HttpErrorResponse ? err.error : undefined;
        notify.showError(extractErrorMessage(body ?? err));
      }

      return throwError(() => err);
    }),
  );
};
