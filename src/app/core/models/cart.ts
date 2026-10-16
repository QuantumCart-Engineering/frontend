export interface CartRecord {
  id: string;
  user_id: string;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED';
  created_at: string;
  updated_at: string;
}

export interface CartItemRecord {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface CartWithItems {
  id: string;
  user_id: string;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED';
  created_at: string;
  updated_at: string;
  items: CartItemRecord[];
}

export interface GetCartResponse {
  success: true;
  data: CartWithItems;
}

export interface GetCartByIdResponse {
  success: true;
  data: CartWithItems;
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
}

export interface AddCartItemResponse {
  success: true;
  message: string;
  data: CartItemRecord;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface UpdateCartItemResponse {
  success: true;
  message: string;
  data: CartItemRecord;
}

export interface RemoveCartItemResponse {
  success: true;
  message: string;
}

export interface ClearCartResponse {
  success: true;
  message: string;
}

export interface CheckoutCartResponse {
  success: true;
  data: CartWithItems;
}

export interface CartItemEnriched extends CartItemRecord {
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  lineTotal: number;
}

export interface CartEnriched {
  cart: CartWithItems;
  items: CartItemEnriched[];
}
