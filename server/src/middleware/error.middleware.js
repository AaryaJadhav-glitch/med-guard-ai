import { ZodError } from 'zod';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  // Safe console logging without clinical PII
  console.error(`[API Error] ${req.method} ${req.originalUrl} - ${err.message || 'Unknown error'}`);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed for request data.',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized access. Authentication token invalid or expired.'
    });
  }

  if (err.status === 403 || err.code === '42501') {
    return res.status(403).json({
      error: 'Forbidden. You do not have permission to access or modify this clinical resource.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = config.nodeEnv === 'production' && statusCode === 500
    ? 'An unexpected clinical safety server error occurred. Please contact system administration.'
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    error: message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack })
  });
}
