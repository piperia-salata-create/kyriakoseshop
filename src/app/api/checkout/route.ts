import { NextResponse } from 'next/server';
import { logApiRequest, logApiResponse, logApiError } from '@/lib/logger';
import { ErrorCode } from '@/lib/errors';
import { assertEnvironment, getEnvVar } from '@/lib/env';

interface LineItem {
  product_id: number;
  quantity: number;
  price?: string;
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

// WooCommerce variation response interface
interface WooCommerceVariation {
  price: string;
  purchasable: boolean;
  stock_status: string;
  stock_quantity: number | null;
}

async function fetchProduct(baseUrl: string, consumerKey: string, consumerSecret: string, productId: number) {
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

async function fetchVariation(baseUrl: string, consumerKey: string, consumerSecret: string, productId: number, variationId: number) {
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

function validatePrice(clientPrice: string | undefined, serverPrice: string, productName: string, productId: number): ValidationError | null {
  if (clientPrice === undefined) return null;
  
  const clientPriceNum = parseFloat(clientPrice);
  const serverPriceNum = parseFloat(serverPrice);
  
  if (isNaN(clientPriceNum) || isNaN(serverPriceNum)) return null;
  
  // Use a small epsilon for floating point comparison
  const epsilon = 0.01;
  if (Math.abs(clientPriceNum - serverPriceNum) > epsilon) {
    return {
      field: 'price',
      product_id: productId,
      product_name: productName,
      message: `Price has changed for "${productName}"`,
      expected: clientPrice,
      actual: serverPrice,
    };
  }
  
  return null;
}

function validateStock(product: WooCommerceProduct, quantity: number, productName: string, productId: number): ValidationError | null {
  // Check stock status first
  if (product.stock_status === 'outofstock') {
    return {
      field: 'stock',
      product_id: productId,
      product_name: productName,
      message: `Product "${productName}" is out of stock`,
    };
  }
  
  // Then check stock quantity if available
  if (product.stock_quantity !== null && product.stock_quantity < quantity) {
    return {
      field: 'stock',
      product_id: productId,
      product_name: productName,
      message: `Insufficient stock for "${productName}"`,
      expected: quantity.toString(),
      actual: product.stock_quantity?.toString() || '0',
    };
  }
  
  return null;
}

function validateVariationAvailability(variation: WooCommerceVariation | null, quantity: number, productName: string, productId: number, variationId: number): ValidationError | null {
  if (!variation) {
    return {
      field: 'variation',
      product_id: productId,
      product_name: productName,
      message: `Variation ${variationId} of "${productName}" no longer available`,
    };
  }
  
  // Check if variation is purchasable
  if (variation.purchasable === false) {
    return {
      field: 'availability',
      product_id: productId,
      product_name: productName,
      message: `Variation of "${productName}" is not available for purchase`,
    };
  }
  
  // Check variation stock status
  if (variation.stock_status === 'outofstock') {
    return {
      field: 'stock',
      product_id: productId,
      product_name: productName,
      message: `Variation of "${productName}" is out of stock`,
    };
  }
  
  // Check variation stock quantity
  if (variation.stock_quantity !== null && variation.stock_quantity < quantity) {
    return {
      field: 'stock',
      product_id: productId,
      product_name: productName,
      message: `Insufficient stock for variation of "${productName}"`,
      expected: quantity.toString(),
      actual: variation.stock_quantity?.toString() || '0',
    };
  }
  
  return null;
}

export async function POST(request: Request) {
  try {
    // Validate environment at runtime
    assertEnvironment();
    
    const body = await request.json();
    const { billing, line_items } = body;

    // Log the checkout request (sanitized)
    logApiRequest('POST', '/api/checkout', { line_items });

    if (!billing || !line_items) {
      return NextResponse.json(
        { error: 'Missing required fields: billing or line_items' },
        { status: 400 }
      );
    }

    const wordpressUrl = getEnvVar('NEXT_PUBLIC_WORDPRESS_URL', true);
    const consumerKey = getEnvVar('WC_CONSUMER_KEY', true);
    const consumerSecret = getEnvVar('WC_CONSUMER_SECRET', true);

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing environment variables' },
        { status: 500 }
      );
    }

    const baseUrl = wordpressUrl.replace(/\/$/, "");
    const url = `${baseUrl}/wp-json/wc/v3/orders?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

    // Validate each product: fetch current data from WooCommerce
    const validatedLineItems: LineItem[] = [];
    const validationErrors: ValidationError[] = [];
    
    for (const item of line_items) {
      // Fetch current product data from WooCommerce
      const product = await fetchProduct(baseUrl, consumerKey, consumerSecret, item.product_id);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.product_id} no longer available` },
          { status: 400 }
        );
      }
      
      // Validate price if client provided a price
      const priceError = validatePrice(item.price, product.price, product.name, item.product_id);
      if (priceError) {
        validationErrors.push(priceError);
      }
      
      // Check if product is purchasable
      if (product.purchasable === false) {
        return NextResponse.json(
          { error: `Product "${product.name}" is not available for purchase` },
          { status: 400 }
        );
      }
      
      // Handle variations
      if (item.variation_id) {
        const variation = await fetchVariation(baseUrl, consumerKey, consumerSecret, item.product_id, item.variation_id);
        
        const variationError = validateVariationAvailability(variation, item.quantity, product.name, item.product_id, item.variation_id);
        if (variationError) {
          validationErrors.push(variationError);
        }
        
        // Validate variation price if available
        if (variation && variation.price) {
          const variationPriceError = validatePrice(item.price, variation.price, product.name, item.product_id);
          if (variationPriceError) {
            validationErrors.push(variationPriceError);
          }
        }
      } else {
        // For simple products, validate stock
        const stockError = validateStock(product, item.quantity, product.name, item.product_id);
        if (stockError) {
          validationErrors.push(stockError);
        }
      }
      
      // Add validated item - WooCommerce will use its own price data
      validatedLineItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        variation_id: item.variation_id,
      });
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      const stockErrors = validationErrors.filter(err => err.field === 'stock' || err.field === 'variation' || err.field === 'availability');
      const outOfStockProductIds = stockErrors.map(err => err.product_id);
      
      return NextResponse.json(
        { 
          error: 'Product data has changed. Please review your cart.',
          validation_errors: validationErrors.map(err => ({
            field: err.field,
            product_id: err.product_id,
            product_name: err.product_name,
            message: err.message,
            expected: err.expected,
            actual: err.actual,
          })),
          out_of_stock_product_ids: outOfStockProductIds,
        },
        { status: 409 }
      );
    }

    const payload = {
      payment_method: 'bacs',
      payment_method_title: 'Direct Bank Transfer',
      set_paid: false,
      billing,
      shipping: billing,
      line_items: validatedLineItems,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();

    // Log the WooCommerce API response
    logApiResponse(`${baseUrl}/wp-json/wc/v3/orders`, res.status, data);

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to create order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orderId: data.id }, { status: 201 });

  } catch (error) {
    logApiError('/api/checkout', 500, error as Error, ErrorCode.SERVER_ERROR);
    console.error('Checkout API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
