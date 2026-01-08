// Error codes for consistent error handling
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PRICE_CHANGED = 'PRICE_CHANGED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  VARIATION_UNAVAILABLE = 'VARIATION_UNAVAILABLE',
  PRODUCT_UNAVAILABLE = 'PRODUCT_UNAVAILABLE',
  
  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Cart errors
  CART_EMPTY = 'CART_EMPTY',
  CART_ITEM_REMOVED = 'CART_ITEM_REMOVED',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Normalized error interface
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

// Create a normalized error
export function createError(
  code: ErrorCode,
  message: string,
  options: {
    details?: NormalizedError['details'];
    source?: NormalizedError['source'];
  } = {}
): NormalizedError {
  return {
    code,
    message,
    details: options.details,
    timestamp: new Date().toISOString(),
    source: options.source || 'network',
  };
}

// WooCommerce error response interface
interface WooCommerceValidationError {
  field: string;
  product_id: number;
  [key: string]: unknown;
}

interface WooCommerceErrorResponse {
  error?: string;
  message?: string;
  validation_errors?: WooCommerceValidationError[];
}

// Normalize WooCommerce API errors
export function normalizeWooCommerceError(error: WooCommerceErrorResponse, source: NormalizedError['source'] = 'checkout'): NormalizedError {
  // Handle fetch/network errors
  if (!error || error.message?.includes('fetch')) {
    return createError(
      ErrorCode.NETWORK_ERROR,
      'Unable to connect to the server. Please check your internet connection.',
      { source }
    );
  }

  // Handle API response with structured errors
  if (error.validation_errors && Array.isArray(error.validation_errors)) {
    const stockErrors = error.validation_errors.filter(
      (err) => err.field === 'stock' || err.field === 'variation' || err.field === 'availability'
    );
    const outOfStockProductIds = stockErrors.map((err) => err.product_id);

    const details: NonNullable<NormalizedError['details']> = {
      validation_errors: error.validation_errors as Array<{
        field: string;
        product_id: number;
        product_name: string;
        message: string;
        expected?: string;
        actual?: string;
      }>,
      out_of_stock_product_ids: outOfStockProductIds,
    };

    return createError(
      ErrorCode.VALIDATION_ERROR,
      error.error || 'Product data has changed. Please review your cart.',
      { details, source }
    );
  }

  // Handle WooCommerce error messages
  if (error.message) {
    // Map common WooCommerce error messages to error codes
    const message = error.message.toLowerCase();
    
    if (message.includes('out of stock') || message.includes('insufficient stock')) {
      return createError(
        ErrorCode.OUT_OF_STOCK,
        error.message,
        { source }
      );
    }
    
    if (message.includes('price')) {
      return createError(
        ErrorCode.PRICE_CHANGED,
        error.message,
        { source }
      );
    }
    
    if (message.includes('not found') || message.includes('no longer available')) {
      return createError(
        ErrorCode.NOT_FOUND,
        error.message,
        { source }
      );
    }
    
    if (message.includes('stock')) {
      return createError(
        ErrorCode.INSUFFICIENT_STOCK,
        error.message,
        { source }
      );
    }

    return createError(ErrorCode.API_ERROR, error.message, { source });
  }

  // Default fallback
  return createError(
    ErrorCode.UNKNOWN_ERROR,
    'An unexpected error occurred. Please try again.',
    { source }
  );
}

// Parse error from response
export function parseApiError(response: Response, data: WooCommerceErrorResponse): NormalizedError {
  if (response.status === 400) {
    return createError(
      ErrorCode.VALIDATION_ERROR,
      data.error || 'Invalid request data.',
      { source: 'checkout' }
    );
  }
  
  if (response.status === 401 || response.status === 403) {
    return createError(
      ErrorCode.UNAUTHORIZED,
      'You are not authorized to perform this action.',
      { source: 'network' }
    );
  }
  
  if (response.status === 404) {
    return createError(
      ErrorCode.NOT_FOUND,
      data.error || 'The requested resource was not found.',
      { source: 'network' }
    );
  }
  
  if (response.status === 409) {
    return normalizeWooCommerceError(data, 'checkout');
  }
  
  if (response.status >= 500) {
    return createError(
      ErrorCode.SERVER_ERROR,
      'A server error occurred. Please try again later.',
      { source: 'network' }
    );
  }
  
  return normalizeWooCommerceError(data, 'checkout');
}

// User-friendly error messages
export function getUserFriendlyMessage(error: NormalizedError): string {
  switch (error.code) {
    case ErrorCode.OUT_OF_STOCK:
      return 'One or more items in your cart are out of stock and have been removed.';
    
    case ErrorCode.INSUFFICIENT_STOCK:
      return 'There is not enough stock for some items. Please update your cart.';
    
    case ErrorCode.PRICE_CHANGED:
      return 'The price of some items has changed. Please review your cart.';
    
    case ErrorCode.VARIATION_UNAVAILABLE:
      return 'A product variation is no longer available.';
    
    case ErrorCode.PRODUCT_UNAVAILABLE:
      return 'One or more products are no longer available.';
    
    case ErrorCode.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection.';
    
    case ErrorCode.SERVER_ERROR:
      return 'A server error occurred. Please try again later.';
    
    case ErrorCode.CART_EMPTY:
      return 'Your cart is empty.';
    
    default:
      return error.message;
  }
}
