import { HttpContextToken } from '@angular/common/http';

export const SILENT_ERROR = new HttpContextToken<boolean>(() => false);
