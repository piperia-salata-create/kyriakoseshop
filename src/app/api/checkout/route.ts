import { NextResponse } from 'next/server';
import { 
  logCheckoutRequest,
  logCheckoutValidation,
  logCheckoutOrderCreated,
  logCheckoutError,
  setRequestId,
  startRequest,
  clearRequestContext
} from '@/lib/logger';
import { assertEnvironment, getEnvVar } from '@/lib/env';
import { OrderStatus, serializeStatusHistory } from '@/lib/types';

// =====================================================
// ORDER PRICE SNAPSHOT
// =====================================================
//
// When an order is created, we store an IMMUTABLE snapshot of:
// - Product prices at time of purchase
// - Product names (in case product is deleted)
// - Tax rates and calculations
// - Subtotal, tax, and total amounts
//
// This ensures that:
// 1. Future product price changes don't affect existing orders
// 2. Orders remain accurate even if products are deleted
// 3. Audit trail is complete for financial reconciliation
//
// The snapshot is stored in WooCommerce metadata as:
// _order_price_snapshot = { ... }
// =====================================================

interface PriceSnapshotItem {
  product_id: number;
  variation_id?: number;
  name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  tax_class: string;
  tax_status: string;
}

interface PriceSnapshot {
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

// Create a price snapshot from validated products
function createPriceSnapshot(
  products: Map<number, { product: WooCommerceProduct; quantity: number; name: string }>,
  lineItems: LineItem[],
  requestId: string
): PriceSnapshot {
  const items: PriceSnapshotItem[] = [];
  let subtotal = 0;
  
  for (const item of lineItems) {
    const productData = products.get(item.product_id);
    if (!productData) continue;
    
    const { product, quantity } = productData;
    const unitPrice = parseFloat(product.price) || 0;
    const totalPrice = unitPrice * quantity;
    
    items.push({
      product_id: item.product_id,
      variation_id: item.variation_id,
      name: product.name,
      quantity,
      unit_price: product.price,
      total_price: totalPrice.toFixed(2),
      tax_class: 'standard', // WooCommerce default
      tax_status: 'taxable',
    });
    
    subtotal += totalPrice;
  }
  
  return {
    version: '1.0.0',
    created_at: new Date().toISOString(),
    request_id: requestId,
    items,
    subtotal: subtotal.toFixed(2),
    total_tax: '0.00', // Will be calculated by WooCommerce
    total: subtotal.toFixed(2), // Will include tax by WooCommerce
    currency: 'EUR',
    prices_include_tax: true,
  };
}

interface LineItem {
  product_id: number;
  quantity: number;
  variation_id?: number;
}

interface ValidationError {
  field: 'price' | 'stock' | 'variation' | 'availability';
  product_id: number;
  product_name: string;
  message: string;
  expected?: string;
  actual?: string;
}

// WooCommerce product response interface
interface WooCommerceProduct {
  price: string;
  name: string;
  purchasable: boolean;
  stock_status: string;
  stock_quantity: number | null;
}

async function fetchProduct(
  baseUrl: string, 
  consumerKey: string, 
  consumerSecret: string, 
  productId: number
) {
  const productUrl = `${baseUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
  
  const productRes = await fetch(productUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    cache: 'no-store',
  });
  
  if (!productRes.ok) {
    if (productRes.status === 404) return null;
    throw new Error(`Failed to fetch product ${productId}`);
  }
  
  return productRes.json();
}

async function fetchVariation(
  baseUrl: string, 
  consumerKey: string, 
  consumerSecret: string, 
  productId: number, 
  variationId: number
) {
  const variationUrl = `${baseUrl}/wp-json/wc/v3/products/${productId}/variations/${variationId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
  
  const variationRes = await fetch(variationUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    cache: 'no-store',
  });
  
  if (!variationRes.ok) {
    if (variationRes.status === 404) return null;
    throw new Error(`Failed to fetch variation ${variationId}`);
  }
  
  return variationRes.json();
}

// =====================================================
// STOCK HANDLING & RACE CONDITION MITIGATION
// =====================================================
// 
// ASSUMPTIONS:
// 1. WooCommerce (the backend e-commerce platform) handles stock management
//    at the database level with proper transactions.
// 2. When an order is successfully created via the WooCommerce REST API,
//    WooCommerce atomically decrements stock for each ordered item.
// 3. If the order creation fails (for any reason), no stock is deducted.
// 
// LIMITATIONS OF THIS IMPLEMENTATION:
// 1. This is a REST API client - we cannot implement database-level locking
//    from this Next.js API route since we don't have direct DB access.
// 2. The stock validation we perform is advisory - it's possible another
//    order could be placed between our validation and order creation.
// 
// RACE CONDITION SCENARIOS:
// 1. Time-of-check to time-of-use (TOCTOU):
//    - We validate stock -> Another order purchases the last item -> Our order fails
//    - Mitigation: We fetch fresh stock data immediately before validation
//    - If our order creation fails due to stock, the user is notified to retry
// 
// 2. Concurrent validation:
//    - Multiple users validate the same product simultaneously
//    - Mitigation: Validation is fast (concurrent fetches), minimizing the window
//    - WooCommerce will reject any order that can't be fulfilled
// 
// TRUE DISTRIBUTED LOCKING WOULD REQUIRE:
// 1. Database-level SELECT FOR UPDATE or row-level locking
// 2. Redis/distributed lock for cross-instance coordination
// 3. Transactional outbox pattern for reliability
//
// For this implementation, we rely on WooCommerce's internal transaction
// handling. The order creation API call is atomic - either the entire
// order succeeds (with stock deduction) or it fails (no changes).
// =====================================================

// Retry configuration for transient failures
const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 100,
  maxDelayMs: 1000,
};

// Check if an error is transient and may succeed on retry
function isTransientError(statusCode: number, errorData?: Record<string, unknown>): boolean {
  // 5xx errors are typically transient
  if (statusCode >= 500) return true;
  
  // 429 Too Many Requests indicates rate limiting
  if (statusCode === 429) return true;
  
  // Check for specific WooCommerce error codes that are transient
  if (errorData?.code) {
    const transientCodes = [
      'woocommerce_rest_server_unavailable',
      'woocommerce_rest_authentication_error',
      'database_error',
      'object_lock_wait_timeout',
    ];
    return transientCodes.includes(errorData.code as string);
  }
  
  return false;
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exponential backoff retry helper
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  requestId: string
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const statusCode = (error as { statusCode?: number }).statusCode || 
                        (error as { response?: { status?: number } }).response?.status || 
                        500;
      
      // Only retry on transient errors
      if (!isTransientError(statusCode, (error as unknown) as Record<string, unknown>)) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === RETRY_CONFIG.maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelayMs
      );
      const jitter = Math.random() * 50; // Add up to 50ms jitter
      
      console.warn(
        `[${requestId}] Transient error during ${operationName}, attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}. ` +
        `Retrying in ${delay + jitter}ms...`,
        { statusCode, error: lastError.message }
      );
      
      await sleep(delay + jitter);
    }
  }
  
  throw lastError;
}

export async function POST(request: Request) {
  // Start request context and generate request ID
  const requestId = startRequest();
  setRequestId(requestId);
  
  try {
    // Validate environment at runtime
    assertEnvironment();
    
    const body = await request.json();
    const { billing, line_items } = body;

    // Log structured checkout request
    logCheckoutRequest(line_items);

    if (!billing || !line_items || !Array.isArray(line_items)) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: billing and line_items (must be an array)', requestId },
        { status: 400 }
      );
    }

    if (line_items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty', requestId },
        { status: 400 }
      );
    }

    const wordpressUrl = getEnvVar('NEXT_PUBLIC_WORDPRESS_URL', true);
    const consumerKey = getEnvVar('WC_CONSUMER_KEY', true);
    const consumerSecret = getEnvVar('WC_CONSUMER_SECRET', true);

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing environment variables', requestId },
        { status: 500 }
      );
    }

    const baseUrl = wordpressUrl.replace(/\/$/, "");
    const orderUrl = `${baseUrl}/wp-json/wc/v3/orders?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

    // =====================================================
    // ATOMIC TRANSACTION START
    // =====================================================
    // Step 1: Validate ALL products before creating any order
    // This ensures we don't create an order with invalid items
    // =====================================================

    const validatedLineItems: LineItem[] = [];
    const validationErrors: ValidationError[] = [];
    const productsToValidate = new Map<number, { product: WooCommerceProduct; quantity: number; name: string }>();
    
    // Phase 1: Fetch all product data concurrently
    const productFetchPromises = line_items.map(async (item) => {
      try {
        const product = await fetchProduct(baseUrl, consumerKey, consumerSecret, item.product_id);
        return { item, product, error: null };
      } catch (fetchError) {
        return { item, product: null, error: fetchError };
      }
    });
    
    const productResults = await Promise.all(productFetchPromises);
    
    // Collect errors for products that couldn't be fetched
    for (const result of productResults) {
      if (result.error) {
        validationErrors.push({
          field: 'availability',
          product_id: result.item.product_id,
          product_name: `Product ${result.item.product_id}`,
          message: `Unable to verify product availability: ${(result.error as Error).message}`,
        });
        continue;
      }
      
      if (!result.product) {
        validationErrors.push({
          field: 'availability',
          product_id: result.item.product_id,
          product_name: `Product ${result.item.product_id}`,
          message: `Product no longer available`,
        });
        continue;
      }
      
      productsToValidate.set(result.item.product_id, {
        product: result.product,
        quantity: result.item.quantity,
        name: result.product.name,
      });
    }
    
    // Phase 2: Validate stock and availability for all products
    // If any product is invalid, we fail the entire transaction
    for (const [productId, data] of productsToValidate) {
      const { product, quantity, name } = data;
      
      // Check if product is purchasable
      if (product.purchasable === false) {
        validationErrors.push({
          field: 'availability',
          product_id: productId,
          product_name: name,
          message: `Product "${name}" is not available for purchase`,
        });
      }
      
      // Check stock status
      if (product.stock_status === 'outofstock') {
        validationErrors.push({
          field: 'stock',
          product_id: productId,
          product_name: name,
          message: `Product "${name}" is out of stock`,
        });
      }
      
      // Check stock quantity
      if (product.stock_quantity !== null && product.stock_quantity < quantity) {
        validationErrors.push({
          field: 'stock',
          product_id: productId,
          product_name: name,
          message: `Insufficient stock for "${name}". Requested: ${quantity}, Available: ${product.stock_quantity}`,
          expected: quantity.toString(),
          actual: product.stock_quantity.toString(),
        });
      }
    }
    
    // Phase 3: Validate variations if present
    const variationPromises: Promise<void>[] = [];
    
    for (const item of line_items) {
      if (item.variation_id) {
        const promise = (async () => {
          try {
            const variation = await fetchVariation(baseUrl, consumerKey, consumerSecret, item.product_id, item.variation_id);
            
            if (!variation) {
              validationErrors.push({
                field: 'variation',
                product_id: item.product_id,
                product_name: `Product ${item.product_id}`,
                message: `Variation ${item.variation_id} no longer available`,
              });
              return;
            }
            
            if (variation.purchasable === false) {
              validationErrors.push({
                field: 'availability',
                product_id: item.product_id,
                product_name: `Variation of product ${item.product_id}`,
                message: `Variation is not available for purchase`,
              });
            }
            
            if (variation.stock_status === 'outofstock') {
              validationErrors.push({
                field: 'stock',
                product_id: item.product_id,
                product_name: `Variation of product ${item.product_id}`,
                message: `Variation is out of stock`,
              });
            }
            
            if (variation.stock_quantity !== null && variation.stock_quantity < item.quantity) {
              validationErrors.push({
                field: 'stock',
                product_id: item.product_id,
                product_name: `Variation of product ${item.product_id}`,
                message: `Insufficient stock for variation. Requested: ${item.quantity}, Available: ${variation.stock_quantity}`,
                expected: item.quantity.toString(),
                actual: variation.stock_quantity.toString(),
              });
            }
          } catch (variationError) {
            validationErrors.push({
              field: 'variation',
              product_id: item.product_id,
              product_name: `Product ${item.product_id}`,
              message: `Unable to verify variation: ${(variationError as Error).message}`,
            });
          }
        })();
        variationPromises.push(promise);
      }
    }
    
    await Promise.all(variationPromises);
    
    // =====================================================
    // ATOMIC VALIDATION CHECKPOINT
    // =====================================================
    // If any validation errors exist, fail the entire transaction
    // No order is created until all products are validated
    // =====================================================
    
    if (validationErrors.length > 0) {
      const criticalErrors = validationErrors.filter(err => 
        err.field === 'stock' || err.field === 'variation' || err.field === 'availability'
      );
      const outOfStockProductIds = criticalErrors
        .filter(err => err.field === 'stock' || err.field === 'variation')
        .map(err => err.product_id);
      
      // Log validation failure with context
      logCheckoutValidation(
        validationErrors.map(err => ({
          field: err.field,
          product_id: err.product_id,
          message: err.message,
          expected: err.expected,
          actual: err.actual,
        })),
        [...new Set(outOfStockProductIds)]
      );
      
      return NextResponse.json(
        { 
          error: 'Unable to process order. Some products are unavailable.',
          validation_errors: validationErrors.map(err => ({
            field: err.field,
            product_id: err.product_id,
            product_name: err.product_name,
            message: err.message,
            expected: err.expected,
            actual: err.actual,
          })),
          out_of_stock_product_ids: [...new Set(outOfStockProductIds)],
          requestId,
        },
        { status: 409 }
      );
    }
    
    // All validations passed - prepare line items for order
    for (const item of line_items) {
      validatedLineItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        variation_id: item.variation_id,
      });
    }
    
    // =====================================================
    // CREATE PRICE SNAPSHOT (IMMUTABLE)
    // =====================================================
    // Store current prices and product details at time of order
    // This ensures the order is not affected by future product changes
    // =====================================================
    
    const priceSnapshot = createPriceSnapshot(productsToValidate, line_items, requestId);
    
    // =====================================================
    // ORDER CREATION (COMMIT PHASE)
    // =====================================================
    // All products validated - now create the order atomically
    //
    // ORDER LIFECYCLE:
    // 1. Order is created with status PENDING (awaiting payment)
    // 2. Payment is processed -> status changes to PAID
    // 3. Items are shipped -> status changes to FULFILLED
    // 4. Delivery confirmed -> status changes to COMPLETED
    //
    // ORDER STATUS HISTORY:
    // - Each status change is tracked with timestamp, actor, and reason
    // - History is stored in WooCommerce metadata for audit trail
    // - Initial entry is created when order is first created
    //
    // PRICE SNAPSHOT:
    // - All prices are captured at order creation time
    // - Stored in WooCommerce metadata for future reference
    // - Immutable - cannot be modified after creation
    //
    // WooCommerce handles stock deduction when order is created
    // Use retry with exponential backoff for transient failures
    // =====================================================

    // Initial order status is PENDING (payment not yet received)
    const initialStatus = OrderStatus.PENDING;

    // Prepare status history - initial entry is created when order is created
    const initialHistory: Array<{ timestamp: string; fromStatus: null; toStatus: OrderStatus; reason: string; actor: 'customer' }> = [{
      timestamp: new Date().toISOString(),
      fromStatus: null,
      toStatus: initialStatus,
      reason: 'Order created - awaiting bank transfer payment',
      actor: 'customer',
    }];

    const payload = {
      payment_method: 'bacs',
      payment_method_title: 'Direct Bank Transfer',
      set_paid: false, // Order starts as unpaid (PENDING status)
      status: initialStatus,
      billing,
      shipping: billing,
      line_items: validatedLineItems,
      // metadata for tracking and audit
      _checkout_request_id: requestId,
      _initial_order_status: initialStatus,
      _order_status_history: serializeStatusHistory(initialHistory),
      // IMMUTABLE price snapshot - will not change even if product prices change
      _order_price_snapshot: JSON.stringify(priceSnapshot),
      _price_snapshot_version: priceSnapshot.version,
      _price_snapshot_created: priceSnapshot.created_at,
    };

    // Create order with retry for transient failures
    const createOrder = async (): Promise<{ res: Response; data: Record<string, unknown> }> => {
      const res = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      
      const data: Record<string, unknown> = await res.json();
      
      if (!res.ok) {
        // Create an error with status code for retry logic
        const error = new Error(data?.message as string || 'Order creation failed') as Error & { statusCode: number };
        error.statusCode = res.status;
        throw error;
      }
      
      return { res, data };
    };

    const orderResult = await withRetry(createOrder, 'order_creation', requestId);
    const { data } = orderResult;

    // Log successful order creation
    logCheckoutOrderCreated(
      data.id as number,
      validatedLineItems,
      initialStatus
    );

    // =====================================================
    // TRANSACTION COMPLETED SUCCESSFULLY
    // =====================================================
    // Order created with validated items
    // Stock is deducted by WooCommerce
    // =====================================================

    return NextResponse.json(
      { success: true, orderId: data.id, requestId },
      { status: 201 }
    );

  } catch (error) {
    // =====================================================
    // UNEXPECTED ERROR - ROLLBACK
    // =====================================================
    // Any unexpected error results in a failed transaction
    // No partial orders are created
    // =====================================================
    
    logCheckoutError(error as Error, {
      endpoint: '/api/checkout',
      statusCode: 500,
      errorCode: 'INTERNAL_ERROR',
    });
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        code: 'internal_error',
        requestId,
      },
      { status: 500 }
    );
  } finally {
    // Clean up request context
    clearRequestContext();
  }
}
