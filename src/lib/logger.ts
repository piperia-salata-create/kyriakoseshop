// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log entry structure
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: {
    error_type?: string;
    endpoint?: string;
    status_code?: number;
    method?: string;
    payload?: Record<string, unknown>;
    user_id?: string;
    session_id?: string;
    error_code?: string;
    stack_trace?: string;
  };
}

// Sensitive fields to sanitize from logs
const SENSITIVE_FIELDS = [
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
  'consumer_secret',
  'billing',
  'shipping',
  'email',
  'phone',
  'address',
  'first_name',
  'last_name',
];

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Current session ID for correlation
let sessionId: string | undefined;

export function setSessionId(id: string) {
  sessionId = id;
}

export function getSessionId(): string | undefined {
  return sessionId;
}

// Generate a unique request ID
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

// Sanitize payload to remove sensitive data
function sanitizePayload(payload: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!payload) return undefined;

  const sanitized = { ...payload };
  
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Handle nested objects
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key] as Record<string, unknown>);
    }
  }

  return sanitized;
}

// Create a log entry
function createLogEntry(
  level: LogLevel,
  message: string,
  data?: LogEntry['data']
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data: data ? { ...data, session_id: sessionId } : undefined,
  };
}

// Output log to console with appropriate formatting
function outputLog(entry: LogEntry): void {
  const { level, message, timestamp, data } = entry;
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (isDevelopment) {
    // In development, use console methods directly for better debugging
    const logData = data ? { ...data, timestamp } : { timestamp };
    
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
    // In production, use JSON format for structured logging
    console.log(JSON.stringify(entry));
  }
}

// Logger API
export const logger = {
  debug: (message: string, data?: LogEntry['data']) => {
    if (isDevelopment) {
      outputLog(createLogEntry(LogLevel.DEBUG, message, data));
    }
  },

  info: (message: string, data?: LogEntry['data']) => {
    outputLog(createLogEntry(LogLevel.INFO, message, data));
  },

  warn: (message: string, data?: LogEntry['data']) => {
    outputLog(createLogEntry(LogLevel.WARN, message, data));
  },

  error: (message: string, data?: LogEntry['data']) => {
    outputLog(createLogEntry(LogLevel.ERROR, message, data));
  },
};

// API-specific logging helpers
export function logApiRequest(
  method: string,
  endpoint: string,
  payload?: Record<string, unknown>
) {
  logger.debug(`API Request: ${method} ${endpoint}`, {
    method,
    endpoint,
    payload: sanitizePayload(payload),
  });
}

export function logApiResponse(
  endpoint: string,
  statusCode: number,
  response?: Record<string, unknown>
) {
  const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
  
  const logMethod = level === LogLevel.WARN ? logger.warn : logger.debug;
  logMethod(`API Response: ${endpoint} ${statusCode}`, {
    endpoint,
    status_code: statusCode,
    payload: sanitizePayload(response),
  });
}

export function logApiError(
  endpoint: string,
  statusCode: number,
  error: Error,
  errorCode?: string,
  payload?: Record<string, unknown>
) {
  logger.error(`API Error: ${endpoint} ${statusCode}`, {
    error_type: error.constructor.name,
    endpoint,
    status_code: statusCode,
    error_code: errorCode,
    stack_trace: isDevelopment ? error.stack : undefined,
    payload: sanitizePayload(payload),
  });
}

// Cart-specific logging
export function logCartAction(
  action: 'add' | 'remove' | 'update' | 'checkout',
  productId: number,
  quantity?: number
) {
  logger.info(`Cart Action: ${action}`, {
    method: action,
    endpoint: '/cart',
    payload: { product_id: productId, quantity },
  });
}

export function logCheckoutError(
  error: Error,
  errorCode: string,
  lineItems: Array<{ product_id: number; quantity: number }>
) {
  logApiError('/api/checkout', 409, error, errorCode, { line_items: lineItems });
}
