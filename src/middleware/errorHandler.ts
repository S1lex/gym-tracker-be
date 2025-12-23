import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { config } from '../config/config';

/**
 * Error handling middleware
 * In production, don't expose internal error details
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log full error details server-side
  console.error('Error:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // In production, don't expose internal error messages
  const errorMessage = config.nodeEnv === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  const response: ApiResponse<never> = {
    success: false,
    error: errorMessage,
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

