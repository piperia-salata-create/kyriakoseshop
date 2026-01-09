import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { 
  requireAdmin, 
  checkAdminRateLimit, 
  logAccessAttempt 
} from '@/lib/auth';
import { logger } from '@/lib/logger';

// =====================================================
// REVALIDATION ENDPOINT SECURITY
// =====================================================
//
// This endpoint is ADMIN-ONLY.
// Only users with the 'admin' role can revalidate cached content.
//
// PROTECTED CAPABILITIES:
// - revalidate_cache: Required to trigger cache invalidation
//
// RATE LIMITING:
// - Admins are limited to 10 requests per minute
// - Excessive requests will be rejected with 429
//
// AUDIT LOGGING:
// - All revalidation attempts are logged for security
// =====================================================

// Secret token for webhook authentication (additional layer)
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
    // Step 1: Validate webhook secret (first layer of defense)
    if (!validateRequest(request)) {
      logger.warn('Revalidation rejected: invalid webhook secret', {
        endpoint: '/api/revalidate',
        status_code: 401,
        error_code: 'INVALID_SECRET',
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 2: Require admin authentication (second layer of defense)
    const admin = requireAdmin(request);

    // Step 3: Check rate limit
    if (!checkAdminRateLimit(admin.id)) {
      logger.warn('Revalidation rate limit exceeded', {
        endpoint: '/api/revalidate',
        status_code: 429,
        error_code: 'RATE_LIMIT_EXCEEDED',
        user_id: admin.id,
      });
      
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const payload: WooCommerceWebhookPayload = await request.json();
    
    logger.info('Revalidation webhook received', {
      endpoint: '/api/revalidate',
      payload: {
        resource: payload.resource,
        action: payload.action,
        data_id: payload.data?.id,
      },
    });

    // Handle different webhook types
    const resource = payload.resource;
    const action = payload.action;
    const data = payload.data;

    // Revalidate product-related paths
    if (resource === 'product') {
      if (action === 'update' && data?.id) {
        // Revalidate specific product page
        revalidatePath(`/product/${data.id}`);
        // @ts-expect-error - revalidateTag may not have type definitions
        revalidateTag(`product-${data.id}`);
        
        // Also try to revalidate by slug if available
        if (data.changes?.slug) {
          revalidatePath(`/product/${String(data.changes.slug)}`);
        }
        
        // Revalidate product list and all products
        revalidatePath('/');
        // @ts-expect-error - revalidateTag may not have type definitions
        revalidateTag('products');
        // @ts-expect-error - revalidateTag may not have type definitions
        revalidateTag('product-list');
        
        logger.info('Product cache revalidated', {
          product_id: data.id,
          revalidated_by: admin.id,
        });
      } else if (action === 'delete' && data?.id) {
        // Product was deleted, revalidate product list
        revalidatePath('/');
        // @ts-expect-error - revalidateTag may not have type definitions
        revalidateTag('products');
        // @ts-expect-error - revalidateTag may not have type definitions
        revalidateTag('product-list');
        
        logger.info('Product deleted, cache revalidated', {
          product_id: data.id,
          revalidated_by: admin.id,
        });
      }
    }

    // Handle order webhooks (stock changes)
    if (resource === 'order') {
      if (action === 'created' || action === 'updated') {
        // Orders may affect stock, revalidate all products
        revalidatePath('/');
        // @ts-expect-error - revalidateTag may not have type definitions
        revalidateTag('products');
        // @ts-expect-error - revalidateTag may not have type definitions
        revalidateTag('product-list');
        
        logger.info('Order updated, product cache revalidated', {
          order_id: data?.id,
          revalidated_by: admin.id,
        });
      }
    }

    // Handle product category changes
    if (resource === 'product_cat') {
      revalidatePath('/');
      // @ts-expect-error - revalidateTag may not have type definitions
      revalidateTag('products');
      // @ts-expect-error - revalidateTag may not have type definitions
      revalidateTag('product-list');
      
      logger.info('Category changed, cache revalidated', {
        revalidated_by: admin.id,
      });
    }

    // Generic revalidation via query parameter (admin-only)
    const pathToRevalidate = request.nextUrl.searchParams.get('path');
    if (pathToRevalidate) {
      revalidatePath(pathToRevalidate);
      logger.info('Manual path revalidation', {
        path: pathToRevalidate,
        revalidated_by: admin.id,
      });
    }

    // Generic tag revalidation (admin-only)
    const tagToRevalidate = request.nextUrl.searchParams.get('tag');
    if (tagToRevalidate) {
      // @ts-expect-error - revalidateTag signature may vary
      revalidateTag(tagToRevalidate);
      logger.info('Manual tag revalidation', {
        tag: tagToRevalidate,
        revalidated_by: admin.id,
      });
    }

    // Log successful revalidation
    logAccessAttempt(
      admin,
      'revalidate_cache',
      payload.resource,
      payload.data?.id,
      true,
      undefined,
      request
    );

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
      payload: {
        resource,
        action,
        data,
      },
      revalidated_by: admin.id,
    });
  } catch (error) {
    const authError = error as { statusCode?: number; code?: string; message?: string };
    
    // Log failed access attempt
    logAccessAttempt(
      null,
      'revalidate_cache',
      undefined,
      undefined,
      false,
      authError.message,
      request
    );
    
    if (authError.statusCode === 401) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }
    
    if (authError.statusCode === 403) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }
    
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint also requires admin authentication
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = requireAdmin(request);

    // Check rate limit
    if (!checkAdminRateLimit(admin.id)) {
      logger.warn('Revalidation rate limit exceeded', {
        endpoint: '/api/revalidate',
        status_code: 429,
        error_code: 'RATE_LIMIT_EXCEEDED',
        user_id: admin.id,
      });
      
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const pathToRevalidate = request.nextUrl.searchParams.get('path');
    const tagToRevalidate = request.nextUrl.searchParams.get('tag');

    if (pathToRevalidate) {
      revalidatePath(pathToRevalidate);
      
      logger.info('Manual path revalidation (GET)', {
        path: pathToRevalidate,
        revalidated_by: admin.id,
      });
      
      return NextResponse.json({
        revalidated: true,
        path: pathToRevalidate,
        revalidated_by: admin.id,
      });
    }

    if (tagToRevalidate) {
      // @ts-expect-error - revalidateTag signature may vary
      revalidateTag(tagToRevalidate);
      
      logger.info('Manual tag revalidation (GET)', {
        tag: tagToRevalidate,
        revalidated_by: admin.id,
      });
      
      return NextResponse.json({
        revalidated: true,
        tag: tagToRevalidate,
        revalidated_by: admin.id,
      });
    }

    return NextResponse.json({
      error: 'Please provide path or tag parameter',
    });
  } catch (error) {
    const authError = error as { statusCode?: number; code?: string; message?: string };
    
    if (authError.statusCode === 401 || authError.statusCode === 403) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: authError.statusCode }
      );
    }
    
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
