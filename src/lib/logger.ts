// =====================================================
// STRUCTURED LOGGING
// =====================================================
//
// This module provides structured, contextual logging for the application.
// All log entries include:
// - timestamp: ISO 8601 UTC
// - level: Log severity level
// - message: Human-readable message
// - requestId: Unique request identifier for correlation
// - data: Additional context (sanitized of sensitive fields)
//
// SENSITIVE DATA IS AUTOMATICALLY REDACTED:
// - Passwords, credit cards, CVV, SSN
// - Tokens, API keys, secrets
// - Billing/shipping details (email, phone, address)
// - Personal names
// =====================================================

import { OrderStatus } from './types';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// =====================================================
// LOG ENTRY STRUCTURE
// =====================================================

export interface LogEntry {
  timestamp: string;           // ISO 8601 UTC
  level: LogLevel;             // Log severity
  message: string;             // Human-readable message
  requestId?: string;          // Request correlation ID
  data?: LogData;
}

export interface LogData {
  // Request context
  endpoint?: string;
  method?: string;
  status_code?: number;
  
  // Error context
  error_type?: string;
  error_code?: string;
  error_message?: string;
  stack_trace?: string;
  
  // Business context
  order_id?: number;
  product_id?: number;
  quantity?: number;
  
  // Additional context
  duration_ms?: number;
  retry_attempt?: number;
  
  // Sanitized payload (sensitive fields redacted)
  payload?: Record<string, unknown>;
  
  // Validation errors
  validation_errors?: Array<{
    field: string;
    product_id?: number;
    message: string;
    expected?: string;
    actual?: string;
  }>;
  
  // Additional custom fields for specific logging needs
  [key: string]: unknown;
}

// =====================================================
// SENSITIVE FIELD SANITIZATION
// =====================================================

// Fields that will be redacted from all logs
const SENSITIVE_FIELDS = new Set([
  'password',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
  'consumer_key',
  'consumer_secret',
  'billing',
  'shipping',
  'email',
  'phone',
  'address',
  'first_name',
  'last_name',
  'billing_address_1',
  'billing_address_2',
  'shipping_address_1',
  'shipping_address_2',
]);

// Recursively sanitize an object
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  
  if (typeof value === 'string') {
    // Check if string looks like an email
    if (value.includes('@') && value.includes('.')) {
      return '[EMAIL_REDACTED]';
    }
    return value;
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    const obj = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, val] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.has(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof val === 'string' && val.length > 100) {
        // Truncate very long strings
        sanitized[key] = val.substring(0, 100) + '...[TRUNCATED]';
      } else {
        sanitized[key] = sanitizeValue(val);
      }
    }
    
    return sanitized;
  }
  
  return value;
}

// Sanitize a payload object
export function sanitizePayload(payload: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  return sanitizeValue(payload) as Record<string, unknown>;
}

// =====================================================
// LOGGING CONTEXT
// =====================================================

// Current request context (thread-local in production, global in development)
let _requestId: string | undefined;
let _requestStartTime: number | undefined;

// Get current request ID
export function getRequestId(): string | undefined {
  return _requestId;
}

// Set request ID for current operation
export function setRequestId(id: string): void {
  _requestId = id;
}

// Clear request context (call after request completes)
export function clearRequestContext(): void {
  _requestId = undefined;
  _requestStartTime = undefined;
}

// Mark request start and return request ID
export function startRequest(): string {
  _requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  _requestStartTime = Date.now();
  return _requestId;
}

// Get request duration in milliseconds
export function getRequestDuration(): number | undefined {
  if (_requestStartTime === undefined) return undefined;
  return Date.now() - _requestStartTime;
}

// =====================================================
// LOG OUTPUT
// =====================================================

const isDevelopment = process.env.NODE_ENV === 'development';

function outputLog(entry: LogEntry): void {
  const { level, message, timestamp, requestId, data } = entry;
  
  // Base prefix
  const parts = [`[${timestamp}]`, `[${level.toUpperCase()}]`];
  if (requestId) parts.push(`[${requestId}]`);
  const prefix = parts.join(' ');
  
  // Prepare log data
  const logData: Record<string, unknown> = { ...data };
  if (requestId) logData.requestId = requestId;
  if (entry.level === LogLevel.ERROR && isDevelopment) {
    logData.stack_trace = new Error().stack;
  }
  
  if (isDevelopment) {
    // Human-readable format for development
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, logData);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, logData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, logData);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, logData);
        break;
    }
  } else {
    // JSON format for production (structured logging)
    console.log(JSON.stringify(entry));
  }
}

// =====================================================
// LOGGING API
// =====================================================

function createLogEntry(
  level: LogLevel,
  message: string,
  data?: LogData
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: _requestId,
    data: data ? sanitizeValue(data) as LogData : undefined,
  };
}

export const logger = {
  debug: (message: string, data?: LogData): void => {
    if (isDevelopment) {
      outputLog(createLogEntry(LogLevel.DEBUG, message, data));
    }
  },

  info: (message: string, data?: LogData): void => {
    outputLog(createLogEntry(LogLevel.INFO, message, data));
  },

  warn: (message: string, data?: LogData): void => {
    outputLog(createLogEntry(LogLevel.WARN, message, data));
  },

  error: (message: string, data?: LogData): void => {
    outputLog(createLogEntry(LogLevel.ERROR, message, data));
  },
};

// =====================================================
// CHECKOUT-SPECIFIC LOGGING
// =====================================================

export function logCheckoutRequest(
  lineItems: Array<{ product_id: number; quantity: number }>
): void {
  logger.info('Checkout request received', {
    endpoint: '/api/checkout',
    method: 'POST',
    payload: { line_items_count: lineItems.length },
  });
}

export function logCheckoutValidation(
  errors: Array<{ field: string; product_id?: number; message: string }>,
  outOfStockProductIds: number[]
): void {
  logger.warn('Checkout validation failed', {
    endpoint: '/api/checkout',
    status_code: 409,
    error_code: 'VALIDATION_ERROR',
    validation_errors: errors,
    payload: { out_of_stock_product_ids: outOfStockProductIds },
  });
}

export function logCheckoutOrderCreated(
  orderId: number,
  lineItems: Array<{ product_id: number; quantity: number }>,
  initialStatus: OrderStatus
): void {
  logger.info('Order created successfully', {
    endpoint: '/api/checkout',
    status_code: 201,
    order_id: orderId,
    payload: {
      line_items: lineItems,
      initial_status: initialStatus,
    },
  });
}

export function logCheckoutError(
  error: Error,
  context: {
    endpoint?: string;
    statusCode?: number;
    errorCode?: string;
    orderId?: number;
    validationErrors?: Array<{ field: string; product_id?: number; message: string }>;
  } = {}
): void {
  logger.error('Checkout operation failed', {
    endpoint: context.endpoint || '/api/checkout',
    status_code: context.statusCode || 500,
    error_type: error.constructor.name,
    error_code: context.errorCode,
    error_message: error.message,
    order_id: context.orderId,
    validation_errors: context.validationErrors,
    duration_ms: getRequestDuration(),
  });
}

export function logOrderStatusTransition(
  orderId: number,
  fromStatus: OrderStatus | null,
  toStatus: OrderStatus,
  reason: string,
  actor: 'system' | 'customer' | 'admin' | 'payment_gateway'
): void {
  logger.info('Order status transition', {
    order_id: orderId,
    payload: {
      from_status: fromStatus,
      to_status: toStatus,
      reason,
      actor,
    },
  });
}

// =====================================================
// API-SPECIFIC LOGGING
// =====================================================

export function logApiRequest(
  method: string,
  endpoint: string,
  payload?: Record<string, unknown>
): void {
  logger.debug(`API Request: ${method} ${endpoint}`, {
    endpoint,
    method,
    payload: sanitizePayload(payload),
  });
}

export function logApiResponse(
  endpoint: string,
  statusCode: number,
  response?: Record<string, unknown>
): void {
  const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
  
  const logMethod = level === LogLevel.WARN ? logger.warn : logger.debug;
  logMethod(`API Response: ${endpoint} ${statusCode}`, {
    endpoint,
    status_code: statusCode,
    payload: sanitizePayload(response),
    duration_ms: getRequestDuration(),
  });
}

export function logApiError(
  endpoint: string,
  statusCode: number,
  error: Error,
  errorCode?: string,
  payload?: Record<string, unknown>
): void {
  logger.error(`API Error: ${endpoint} ${statusCode}`, {
    endpoint,
    status_code: statusCode,
    error_type: error.constructor.name,
    error_code: errorCode,
    error_message: error.message,
    stack_trace: isDevelopment ? error.stack : undefined,
    payload: sanitizePayload(payload),
    duration_ms: getRequestDuration(),
  });
}

// =====================================================
// CART-SPECIFIC LOGGING
// =====================================================

export function logCartAction(
  action: 'add' | 'remove' | 'update' | 'checkout',
  productId: number,
  quantity?: number
): void {
  logger.info(`Cart ${action}`, {
    method: action,
    endpoint: '/cart',
    product_id: productId,
    quantity,
  });
}
