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

// =====================================================
// ORDER LIFECYCLE
// =====================================================
//
// ORDER STATUS FLOW:
//
// ┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌───────────┐
// │ PENDING │────>│   PAID  │────>│  FULFILLED  │────>│ COMPLETED │
// └─────────┘     └─────────┘     └─────────────┘     └───────────┘
//      │               │                                    ▲
//      │               │                                    │
//      │               v                                    │
//      │         ┌──────────┐                              │
//      │         │  FAILED  │──────────────────────────────┘
//      │         └──────────┘               (if payment fails)
//      │
//      │
//      v
// ┌────────────┐     ┌──────────┐
// │ CANCELLED  │────>│ REFUNDED │
// └────────────┘     └──────────┘
//      │
//      │ (customer or admin cancels before payment)
//      v
// ┌──────────┐
// │ REFUNDED │
// └──────────┘
//
// VALID STATUS TRANSITIONS:
//
// PENDING  -> PAID      (payment received)
// PENDING  -> FAILED     (payment processing failed)
// PENDING  -> CANCELLED  (order cancelled before payment)
//
// PAID     -> FULFILLED (items shipped/sent)
// PAID     -> REFUNDED  (full refund issued)
// PAID     -> CANCELLED (cancelled after payment but before fulfillment)
//
// FULFILLED-> COMPLETED (all items delivered, no further action needed)
// FULFILLED-> REFUNDED  (partial or full refund after fulfillment)
//
// FAILED   -> CANCELLED (cleanup after failed payment)
//
// CANCELLED-> REFUNDED  (refund issued for cancelled order)
//
// INVALID TRANSITIONS (will be rejected):
//
// PENDING  -> FULFILLED (must be PAID first)
// PENDING  -> COMPLETED (must go through full lifecycle)
// PAID     -> PENDING   (cannot revert payment)
// FAILED   -> PAID      (cannot re-use failed order)
// REFUNDED -> PAID      (cannot re-charge refunded order)
// CANCELLED-> FULFILLED (cannot fulfill cancelled order)
//
// FINAL STATES (order cannot be modified further):
// - COMPLETED
// - REFUNDED
// =====================================================

export enum OrderStatus {
  PENDING = 'pending',      // Order created, awaiting payment
  PAID = 'paid',           // Payment received
  FAILED = 'failed',       // Payment processing failed
  CANCELLED = 'cancelled', // Order cancelled
  REFUNDED = 'refunded',   // Refund issued
  FULFILLED = 'fulfilled', // Items shipped/fulfilled
  COMPLETED = 'completed', // Order fully completed
}

// Valid transitions from each status
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAID]: [
    OrderStatus.FULFILLED,
    OrderStatus.REFUNDED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.FAILED]: [
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CANCELLED]: [
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.REFUNDED]: [], // Final state - no further transitions
  [OrderStatus.FULFILLED]: [
    OrderStatus.COMPLETED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.COMPLETED]: [], // Final state - no further transitions
};

// Check if a status transition is valid
export function isValidStatusTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  return VALID_TRANSITIONS[fromStatus].includes(toStatus);
}

// Get reason for invalid transition (for error messages)
export function getInvalidTransitionReason(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): string {
  const validTargets = VALID_TRANSITIONS[fromStatus];
  
  if (validTargets.length === 0) {
    return `Cannot transition from ${fromStatus} - this is a final state`;
  }
  
  return `Invalid transition from ${fromStatus} to ${toStatus}. Valid transitions: ${validTargets.join(', ') || 'none'}`;
}

// =====================================================
// ORDER STATUS HISTORY
// =====================================================
//
// Order status changes are tracked for audit purposes.
// Each entry includes:
// - timestamp: When the change occurred (ISO 8601)
// - fromStatus: Previous status
// - toStatus: New status
// - reason: Human-readable explanation
// - actor: Who made the change (system, customer, admin)
//
// History is stored as metadata on the WooCommerce order:
// _order_status_history = [
//   { timestamp, fromStatus, toStatus, reason, actor },
//   ...
// ]
//
// This approach:
// - Is backward compatible with existing queries
// - Doesn't require a new database table
// - Can be extended with additional fields as needed
// - Provides full audit trail for customer support
// =====================================================

export type OrderStatusHistoryEntry = {
  timestamp: string;      // ISO 8601 UTC timestamp
  fromStatus: OrderStatus | null;  // null for initial creation
  toStatus: OrderStatus;
  reason: string;         // Human-readable explanation
  actor: 'system' | 'customer' | 'admin' | 'payment_gateway';
};

// Create initial status history entry for order creation
export function createInitialStatusHistory(
  orderId: number,
  actor: 'system' | 'customer' | 'admin' = 'customer'
): OrderStatusHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    fromStatus: null,
    toStatus: OrderStatus.PENDING,
    reason: `Order ${orderId} created - awaiting payment`,
    actor,
  };
}

// Create status transition history entry
export function createStatusTransitionEntry(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  reason: string,
  actor: 'system' | 'customer' | 'admin' | 'payment_gateway' = 'system'
): OrderStatusHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    fromStatus,
    toStatus,
    reason,
    actor,
  };
}

// Format order history for WooCommerce metadata
// Note: WooCommerce expects metadata values as strings
export function serializeStatusHistory(
  history: OrderStatusHistoryEntry[]
): string {
  return JSON.stringify(history);
}

// Parse order history from WooCommerce metadata
export function deserializeStatusHistory(
  json: string | null | undefined
): OrderStatusHistoryEntry[] {
  if (!json) return [];
  
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    console.error('Failed to parse order status history:', json);
    return [];
  }
}

// =====================================================
// ORDER PRICE SNAPSHOT
// =====================================================
//
// Immutable snapshot of prices at time of order creation.
// Stored in WooCommerce metadata to ensure orders remain
// accurate even if product prices change in the future.
// =====================================================

export interface PriceSnapshotItem {
  product_id: number;
  variation_id?: number;
  name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  tax_class: string;
  tax_status: string;
}

export interface PriceSnapshot {
  version: string;
  created_at: string;
  request_id: string;
  items: PriceSnapshotItem[];
  subtotal: string;
  total_tax: string;
  total: string;
  currency: string;
  prices_include_tax: boolean;
}

// Parse price snapshot from WooCommerce metadata
export function deserializePriceSnapshot(
  json: string | null | undefined
): PriceSnapshot | null {
  if (!json) return null;
  
  try {
    const parsed = JSON.parse(json);
    if (parsed.version && parsed.items && Array.isArray(parsed.items)) {
      return parsed as PriceSnapshot;
    }
    return null;
  } catch {
    console.error('Failed to parse price snapshot:', json);
    return null;
  }
}

// Validate price snapshot matches current prices (for display purposes)
export function validatePriceSnapshot(
  snapshot: PriceSnapshot,
  currentProducts: Map<number, { price: string; name: string }>
): { valid: boolean; mismatches: Array<{ product_id: number; snapshot_price: string; current_price: string }> } {
  const mismatches: Array<{ product_id: number; snapshot_price: string; current_price: string }> = [];
  
  for (const item of snapshot.items) {
    const current = currentProducts.get(item.product_id);
    if (current && current.price !== item.unit_price) {
      mismatches.push({
        product_id: item.product_id,
        snapshot_price: item.unit_price,
        current_price: current.price,
      });
    }
  }
  
  return {
    valid: mismatches.length === 0,
    mismatches,
  };
}

// Get human-readable status description
export function getStatusDescription(status: OrderStatus): string {
  const descriptions: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Awaiting payment',
    [OrderStatus.PAID]: 'Payment received',
    [OrderStatus.FAILED]: 'Payment failed',
    [OrderStatus.CANCELLED]: 'Order cancelled',
    [OrderStatus.REFUNDED]: 'Refund issued',
    [OrderStatus.FULFILLED]: 'Items shipped',
    [OrderStatus.COMPLETED]: 'Order completed',
  };
  
  return descriptions[status] || 'Unknown status';
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
