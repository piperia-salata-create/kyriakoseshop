// =====================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// =====================================================
//
// This module defines user roles and permissions for the application.
// It provides utilities for checking access rights and preventing
// privilege escalation attacks.
//
// ROLES:
// - GUEST: Unauthenticated users, can only view products
// - CUSTOMER: Authenticated users, can place orders, view own orders
// - ADMIN: Full system access, can manage products, orders, view analytics
//
// PERMISSION MATRIX:
// ┌─────────────────┬────────┬──────────┬───────┐
// │ Capability      │ GUEST  │ CUSTOMER │ ADMIN │
// ├─────────────────┼────────┼──────────┼───────┤
// │ View products   │   ✓    │    ✓     │   ✓   │
// │ Add to cart     │   ✗    │    ✓     │   ✓   │
// │ Place order     │   ✗    │    ✓     │   ✓   │
// │ View own orders │   ✗    │    ✓     │   ✓   │
// │ View any order  │   ✗    │    ✗     │   ✓   │
// │ Cancel order    │   ✗    │   OWN*   │   ✓   │
// │ Manage products │   ✗    │    ✗     │   ✓   │
// │ Manage users    │   ✗    │    ✗     │   ✓   │
// │ View analytics  │   ✗    │    ✗     │   ✓   │
// │ Revalidate cache│   ✗    │    ✗     │   ✓   │
// └─────────────────┴────────┴──────────┴───────┘
// * Customers can only cancel their own pending orders
//
// SECURITY CONSIDERATIONS:
// 1. Never trust client-provided role information
// 2. Always verify permissions server-side
// 3. Use least privilege principle
// 4. Log all access attempts for audit
// =====================================================

export type UserRole = 'guest' | 'customer' | 'admin';

// Permission types
export type Permission =
  | 'view_products'
  | 'add_to_cart'
  | 'place_order'
  | 'view_own_orders'
  | 'view_any_order'
  | 'cancel_own_order'
  | 'cancel_any_order'
  | 'manage_products'
  | 'manage_orders'
  | 'manage_users'
  | 'view_analytics'
  | 'revalidate_cache'
  | 'manage_settings';

// Role-permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: [
    'view_products',
  ],
  customer: [
    'view_products',
    'add_to_cart',
    'place_order',
    'view_own_orders',
    'cancel_own_order',
  ],
  admin: [
    'view_products',
    'add_to_cart',
    'place_order',
    'view_own_orders',
    'view_any_order',
    'cancel_own_order',
    'cancel_any_order',
    'manage_products',
    'manage_orders',
    'manage_users',
    'view_analytics',
    'revalidate_cache',
    'manage_settings',
  ],
};

// =====================================================
// PERMISSION CHECKING
// =====================================================

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

// Get all permissions for a role
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// =====================================================
// REQUEST AUTHENTICATION
// =====================================================

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  capabilities: Permission[];
}

/**
 * Extract and validate user from request
 * 
 * In a real application, this would:
 * 1. Extract JWT token from Authorization header
 * 2. Validate token signature and expiration
 * 3. Look up user in database
 * 4. Check if user is active
 * 
 * For this implementation, we use a simpler header-based approach
 * that can be replaced with proper JWT/OAuth authentication.
 */
export function extractUserFromRequest(request: Request): AuthenticatedUser | null {
  // Check for custom auth header (for development/testing)
  const authHeader = request.headers.get('x-user-id');
  const roleHeader = request.headers.get('x-user-role');
  const emailHeader = request.headers.get('x-user-email');
  
  if (authHeader && roleHeader) {
    const userId = parseInt(authHeader, 10);
    if (isNaN(userId)) return null;
    
    const role = roleHeader as UserRole;
    if (!['guest', 'customer', 'admin'].includes(role)) return null;
    
    return {
      id: userId,
      email: emailHeader || `user${userId}@example.com`,
      role,
      capabilities: getPermissions(role),
    };
  }
  
  // No authentication - return guest
  return null;
}

/**
 * Require authentication for a route
 * Returns user or throws an error
 */
export function requireAuth(request: Request): AuthenticatedUser {
  const user = extractUserFromRequest(request);
  
  if (!user) {
    const error = new Error('Authentication required') as Error & { statusCode: number; code: string };
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }
  
  return user;
}

/**
 * Require a specific permission
 * Returns user or throws an error
 */
export function requirePermission(
  request: Request,
  permission: Permission
): AuthenticatedUser {
  const user = requireAuth(request);
  
  if (!hasPermission(user.role, permission)) {
    const error = new Error(`Permission denied: ${permission}`) as Error & { statusCode: number; code: string };
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }
  
  return user;
}

/**
 * Require admin role
 * Returns user or throws an error
 */
export function requireAdmin(request: Request): AuthenticatedUser {
  const user = requireAuth(request);
  
  if (user.role !== 'admin') {
    const error = new Error('Admin access required') as Error & { statusCode: number; code: string };
    error.statusCode = 403;
    error.code = 'ADMIN_REQUIRED';
    throw error;
  }
  
  return user;
}

// =====================================================
// OWNERSHIP CHECKING
// =====================================================

/**
 * Check if a user owns a resource
 * Used for preventing privilege escalation
 */
export function isResourceOwner(
  userId: number,
  resourceOwnerId: number
): boolean {
  return userId === resourceOwnerId;
}

/**
 * Check if user can access a resource
 * Customers can only access their own resources unless admin
 */
export function canAccessResource(
  user: AuthenticatedUser,
  resourceOwnerId: number
): boolean {
  // Admins can access any resource
  if (user.role === 'admin') return true;
  
  // Customers can only access their own resources
  return isResourceOwner(user.id, resourceOwnerId);
}

/**
 * Validate ownership for resource modification
 * Throws error if user doesn't have access
 */
export function requireResourceOwnership(
  request: Request,
  resourceOwnerId: number
): AuthenticatedUser {
  const user = requireAuth(request);
  
  if (!canAccessResource(user, resourceOwnerId)) {
    const error = new Error('You do not have permission to access this resource') as Error & { statusCode: number; code: string };
    error.statusCode = 403;
    error.code = 'RESOURCE_FORBIDDEN';
    throw error;
  }
  
  return user;
}

// =====================================================
// RATE LIMITING (for admin endpoints)
// =====================================================

const adminActionLimits = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Check if admin has exceeded rate limit
 */
export function checkAdminRateLimit(adminId: number): boolean {
  const now = Date.now();
  const key = `admin_${adminId}`;
  const record = adminActionLimits.get(key);
  
  if (!record || now > record.resetTime) {
    adminActionLimits.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Reset rate limit for an admin (after successful action)
 */
export function resetAdminRateLimit(adminId: number): void {
  const key = `admin_${adminId}`;
  adminActionLimits.delete(key);
}

// =====================================================
// AUDIT LOGGING
// =====================================================

export interface AuditLogEntry {
  timestamp: string;
  userId?: number;
  userRole: UserRole;
  action: string;
  resource?: string;
  resourceId?: number;
  success: boolean;
  error?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry for an access attempt
 */
export function logAccessAttempt(
  user: AuthenticatedUser | null,
  action: string,
  resource?: string,
  resourceId?: number,
  success: boolean = true,
  error?: string,
  request?: Request
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    userId: user?.id,
    userRole: user?.role ?? 'guest',
    action,
    resource,
    resourceId,
    success,
    error,
    ip: request?.headers.get('x-forwarded-for') ?? request?.headers.get('x-real-ip') ?? undefined,
    userAgent: request?.headers.get('user-agent') ?? undefined,
  };
}
