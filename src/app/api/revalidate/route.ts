import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Secret token for webhook authentication
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

// Validate the revalidation request
function validateRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  // Check for Bearer token or query parameter
  const querySecret = request.nextUrl.searchParams.get('secret');
  
  if (REVALIDATION_SECRET) {
    const token = authHeader?.replace('Bearer ', '') || querySecret;
    return token === REVALIDATION_SECRET;
  }
  
  // If no secret is configured, allow any request (not recommended for production)
  return true;
}

// Parse WooCommerce webhook payload
interface WooCommerceWebhookPayload {
  id?: number;
  created_at?: string;
  resource?: string;
  action?: string;
  data?: {
    id?: number;
    status?: string;
    changes?: Record<string, unknown>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate the request
    if (!validateRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: WooCommerceWebhookPayload = await request.json();
    
    console.log('Received revalidation webhook:', payload);

    // Handle different webhook types
    const resource = payload.resource;
    const action = payload.action;
    const data = payload.data;

    // Revalidate product-related paths
    if (resource === 'product') {
      if (action === 'update' && data?.id) {
        // Revalidate specific product page
        revalidatePath(`/product/${data.id}`);
        // @ts-ignore
        revalidateTag(`product-${data.id}`);
        
        // Also try to revalidate by slug if available
        if (data.changes?.slug) {
          revalidatePath(`/product/${data.changes.slug}`);
        }
        
        // Revalidate product list and all products
        revalidatePath('/');
        // @ts-ignore
        revalidateTag('products');
        // @ts-ignore
        revalidateTag('product-list');
        
        console.log(`Revalidated product page: /product/${data.id}`);
      } else if (action === 'delete' && data?.id) {
        // Product was deleted, revalidate product list
        revalidatePath('/');
        // @ts-ignore
        revalidateTag('products');
        // @ts-ignore
        revalidateTag('product-list');
        console.log(`Product ${data.id} deleted, revalidated home page`);
      }
    }

    // Handle order webhooks (stock changes)
    if (resource === 'order') {
      if (action === 'created' || action === 'updated') {
        // Orders may affect stock, revalidate all products
        revalidatePath('/');
        // @ts-ignore
        revalidateTag('products');
        // @ts-ignore
        revalidateTag('product-list');
        console.log('Order created/updated, revalidated product cache');
      }
    }

    // Handle product category changes
    if (resource === 'product_cat') {
      revalidatePath('/');
      // @ts-ignore
      revalidateTag('products');
      // @ts-ignore
      revalidateTag('product-list');
      console.log('Category changed, revalidated product cache');
    }

    // Generic revalidation via query parameter
    const pathToRevalidate = request.nextUrl.searchParams.get('path');
    if (pathToRevalidate) {
      revalidatePath(pathToRevalidate);
      console.log(`Manually revalidated path: ${pathToRevalidate}`);
    }

    // Generic tag revalidation
    const tagToRevalidate = request.nextUrl.searchParams.get('tag');
    if (tagToRevalidate) {
      // @ts-ignore - revalidateTag signature may vary
      revalidateTag(tagToRevalidate);
      console.log(`Manually revalidated tag: ${tagToRevalidate}`);
    }

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
      payload: {
        resource,
        action,
        data,
      },
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also handle GET requests for manual revalidation
export async function GET(request: NextRequest) {
  const pathToRevalidate = request.nextUrl.searchParams.get('path');
  const tagToRevalidate = request.nextUrl.searchParams.get('tag');

  if (pathToRevalidate) {
    revalidatePath(pathToRevalidate);
    return NextResponse.json({
      revalidated: true,
      path: pathToRevalidate,
    });
  }

  if (tagToRevalidate) {
    // @ts-ignore - revalidateTag signature may vary
    revalidateTag(tagToRevalidate);
    return NextResponse.json({
      revalidated: true,
      tag: tagToRevalidate,
    });
  }

  return NextResponse.json({
    error: 'Please provide path or tag parameter',
  });
}
