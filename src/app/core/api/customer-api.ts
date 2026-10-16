import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import { SILENT_ERROR } from '../interceptors/http-context';
import type {
  Address,
  AddressListResponse,
  AddressResponse,
  CreateAddressRequest,
  CreateCustomerRequest,
  Customer,
  CustomerResponse,
  UpdateAddressRequest,
  UpdateCustomerRequest,
} from '../models/customer';

@Injectable({ providedIn: 'root' })
export class CustomerApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getByIdentity(identityUserId: string): Observable<Customer> {
    return this.http
      .get<CustomerResponse>(`${this.baseUrl}/api/v1/customers/by-identity/${identityUserId}`, {
        context: new HttpContext().set(SILENT_ERROR, true),
      })
      .pipe(map((res) => res.data));
  }

  getById(customerId: string): Observable<Customer> {
    return this.http
      .get<CustomerResponse>(`${this.baseUrl}/api/v1/customers/${customerId}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreateCustomerRequest): Observable<Customer> {
    return this.http
      .post<CustomerResponse>(`${this.baseUrl}/api/v1/customers`, payload)
      .pipe(map((res) => res.data));
  }

  update(customerId: string, payload: UpdateCustomerRequest): Observable<Customer> {
    return this.http
      .patch<CustomerResponse>(`${this.baseUrl}/api/v1/customers/${customerId}`, payload)
      .pipe(map((res) => res.data));
  }

  listAddresses(customerId: string): Observable<Address[]> {
    return this.http
      .get<AddressListResponse>(`${this.baseUrl}/api/v1/customers/${customerId}/addresses`)
      .pipe(map((res) => res.data));
  }

  createAddress(customerId: string, payload: CreateAddressRequest): Observable<Address> {
    return this.http
      .post<AddressResponse>(`${this.baseUrl}/api/v1/customers/${customerId}/addresses`, payload)
      .pipe(map((res) => res.data));
  }

  updateAddress(
    customerId: string,
    addressId: string,
    payload: UpdateAddressRequest,
  ): Observable<Address> {
    return this.http
      .patch<AddressResponse>(
        `${this.baseUrl}/api/v1/customers/${customerId}/addresses/${addressId}`,
        payload,
      )
      .pipe(map((res) => res.data));
  }

  deleteAddress(customerId: string, addressId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/api/v1/customers/${customerId}/addresses/${addressId}`)
      .pipe(map(() => undefined));
  }
}
