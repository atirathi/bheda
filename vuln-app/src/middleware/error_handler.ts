import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  const errorResponse: any = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  if (isDev) {
    errorResponse.stack = err.stack;
    errorResponse.query = req.query;
    errorResponse.params = req.params;
    errorResponse.headers = {
      ...req.headers,
      authorization: req.headers.authorization ? '[REDACTED]' : undefined,
      cookie: req.headers.cookie ? '[REDACTED]' : undefined,
    };
    errorResponse.body = req.body;
    errorResponse.url = req.originalUrl;
    errorResponse.method = req.method;
    errorResponse.timestamp = new Date().toISOString();
  }

  return res.status(status).json(errorResponse);
}
