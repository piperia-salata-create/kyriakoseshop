// Centralized type exports for the application

// Product types
export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  images: ProductImage[];
  short_description: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity?: number | null;
  purchasable?: boolean;
}

export interface ProductImage {
  id: number;
  src: string;
  alt: string;
}

// Cart types
export interface CartItem extends Product {
  quantity: number;
}

export interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeOutOfStockItems: (productIds: number[]) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

// Checkout types
export interface CheckoutFormData {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface LineItem {
  product_id: number;
  quantity: number;
  price?: string;
  variation_id?: number;
}

export interface ValidationError {
  field: 'price' | 'stock' | 'variation' | 'availability';
  product_id: number;
  product_name: string;
  message: string;
  expected?: string;
  actual?: string;
}

export interface CheckoutErrorResponse {
  error: string;
  validation_errors: ValidationError[];
  out_of_stock_product_ids?: number[];
}

// Error types (from src/lib/errors.ts)
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PRICE_CHANGED = 'PRICE_CHANGED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  VARIATION_UNAVAILABLE = 'VARIATION_UNAVAILABLE',
  PRODUCT_UNAVAILABLE = 'PRODUCT_UNAVAILABLE',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CART_EMPTY = 'CART_EMPTY',
  CART_ITEM_REMOVED = 'CART_ITEM_REMOVED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface NormalizedError {
  code: ErrorCode;
  message: string;
  details?: {
    field?: string;
    product_id?: number;
    product_name?: string;
    expected?: string;
    actual?: string;
    validation_errors?: Array<{
      field: string;
      product_id: number;
      product_name: string;
      message: string;
      expected?: string;
      actual?: string;
    }>;
    out_of_stock_product_ids?: number[];
  };
  timestamp: string;
  source: 'checkout' | 'cart' | 'product' | 'network';
}
