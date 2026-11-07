import { FormControl } from '@angular/forms';
import {
  indianMobileValidator,
  indianPincodeValidator,
  normalizeMobile,
  trimmedRequired,
} from './checkout-validation';

describe('checkout validation', () => {
  describe('normalizeMobile', () => {
    it('keeps a plain 10 digit number', () => {
      expect(normalizeMobile('9876543210')).toBe('9876543210');
    });

    it('strips spaces, hyphens and parentheses', () => {
      expect(normalizeMobile(' 98765-43210 ')).toBe('9876543210');
    });

    it('strips a +91 prefix', () => {
      expect(normalizeMobile('+91 98765 43210')).toBe('9876543210');
    });

    it('strips a leading 91 prefix', () => {
      expect(normalizeMobile('919876543210')).toBe('9876543210');
    });
  });

  describe('indianMobileValidator', () => {
    it('accepts valid Indian mobile numbers', () => {
      expect(indianMobileValidator(new FormControl('9876543210'))).toBeNull();
      expect(indianMobileValidator(new FormControl('+91 98765 43210'))).toBeNull();
    });

    it('rejects invalid Indian mobile numbers', () => {
      expect(indianMobileValidator(new FormControl('1234567890'))).toEqual({
        indianMobile: true,
      });
      expect(indianMobileValidator(new FormControl('98765'))).toEqual({
        indianMobile: true,
      });
      expect(indianMobileValidator(new FormControl('98765432101'))).toEqual({
        indianMobile: true,
      });
    });

    it('leaves empty values to the required validator', () => {
      expect(indianMobileValidator(new FormControl(''))).toBeNull();
      expect(indianMobileValidator(new FormControl('   '))).toBeNull();
    });
  });

  describe('indianPincodeValidator', () => {
    it('accepts a valid six digit Indian PIN code', () => {
      expect(indianPincodeValidator(new FormControl('560001'))).toBeNull();
      expect(indianPincodeValidator(new FormControl(' 110001 '))).toBeNull();
    });

    it('rejects PIN codes that are not exactly six valid digits', () => {
      expect(indianPincodeValidator(new FormControl('56000'))).toEqual({
        indianPincode: true,
      });
      expect(indianPincodeValidator(new FormControl('5600012'))).toEqual({
        indianPincode: true,
      });
      expect(indianPincodeValidator(new FormControl('060001'))).toEqual({
        indianPincode: true,
      });
      expect(indianPincodeValidator(new FormControl('56000A'))).toEqual({
        indianPincode: true,
      });
    });

    it('leaves empty values to the required validator', () => {
      expect(indianPincodeValidator(new FormControl(''))).toBeNull();
      expect(indianPincodeValidator(new FormControl('   '))).toBeNull();
    });
  });

  describe('trimmedRequired', () => {
    it('rejects blank values', () => {
      expect(trimmedRequired(new FormControl(''))).toEqual({ required: true });
      expect(trimmedRequired(new FormControl('   '))).toEqual({ required: true });
    });

    it('accepts non-blank values', () => {
      expect(trimmedRequired(new FormControl('Asha Rao'))).toBeNull();
    });
  });
});
