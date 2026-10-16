export interface Customer {
  id: string;
  identityUserId: string;
  firstName: string;
  lastName: string | null;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  customerId: string;
  addressType: 'HOME' | 'WORK' | 'OTHER';
  recipientName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  status: 'ACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName?: string;
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string | null;
}

export interface UpdateCustomerStatusRequest {
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

export interface CreateAddressRequest {
  addressType?: 'HOME' | 'WORK' | 'OTHER';
  recipientName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string | null;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  addressType?: 'HOME' | 'WORK' | 'OTHER';
  recipientName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string | null;
  isDefault?: boolean;
}

export interface CustomerResponse {
  success: true;
  data: Customer;
}

export interface CustomerListResponse {
  success: true;
  data: Customer[];
}

export interface AddressListResponse {
  success: true;
  data: Address[];
}

export interface AddressResponse {
  success: true;
  data: Address;
}
