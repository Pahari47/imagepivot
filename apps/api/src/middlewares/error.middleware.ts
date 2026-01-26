import { Request, Response, NextFunction } from 'express';
import { AppError } from '../libs/errors';
import { logger } from '../libs/logger';

export function errorMiddleware(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    logger.error(`[${error.statusCode}] ${error.message}`);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error instanceof Error && 'fields' in error
        ? { fields: (error as any).fields }
        : {}),
    });
  }

  // Unknown error
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development'
      ? { message: error.message, stack: error.stack }
      : {}),
  });
}

