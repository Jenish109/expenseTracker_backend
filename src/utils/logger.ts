import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaStr = Object.keys(metadata).length ? `\n${JSON.stringify(metadata, null, 2)}` : '';
  return `${timestamp} ${level}: ${message}${metaStr}`;
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }), // Capture stack traces
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport with colors for development
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Helper methods for common scenarios
const loggerWrapper = {
  info(message: string, metadata: any = {}) {
    logger.info(message, metadata);
  },

  error(message: string, metadata: any = {}) {
    logger.error(message, metadata);
  },

  warn(message: string, metadata: any = {}) {
    logger.warn(message, metadata);
  },

  debug(message: string, metadata: any = {}) {
    logger.debug(message, metadata);
  },

  // Helper methods for common scenarios
  logRequest(req: any) {
    const sanitizedHeaders = { ...req.headers };
    if (sanitizedHeaders.authorization) {
      sanitizedHeaders.authorization = '[REDACTED]';
    }

    logger.debug('Incoming Request', {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      headers: sanitizedHeaders
    });
  },

  logResponse(res: any) {
    logger.debug('Outgoing Response', {
      statusCode: res.statusCode,
      headers: res.getHeaders?.() || {},
      body: res.body
    });
  },

  logError(error: Error, context?: string) {
    logger.error(context || 'Error occurred', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any)
    });
  },

  logDatabaseQuery(query: string, params?: any[]) {
    const sanitizedParams = params?.map(p => 
      typeof p === 'string' && p.toLowerCase().includes('password')
        ? '[REDACTED]'
        : p
    );

    logger.debug('Database Query', {
      query,
      params: sanitizedParams
    });
  },

  logPerformance(operation: string, startTime: number) {
    const duration = Date.now() - startTime;
    logger.debug(`Performance: ${operation}`, {
      duration: `${duration}ms`
    });
  }
};

export default loggerWrapper; 