import { AbstractControl, ValidationErrors } from '@angular/forms';

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export const normalizeMobile = (value: string): string => {
  const trimmed = value.trim();
  const cleaned = trimmed.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) {
    return cleaned.slice(3);
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.slice(2);
  }
  return cleaned;
};

export const indianMobileValidator = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return INDIAN_MOBILE_REGEX.test(normalizeMobile(value))
    ? null
    : { indianMobile: true };
};

export const indianPincodeValidator = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return INDIAN_PINCODE_REGEX.test(value.trim()) ? null : { indianPincode: true };
};

export const trimmedRequired = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string' || value.trim() === '') {
    return { required: true };
  }
  return null;
};
