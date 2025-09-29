import { Request, Response, NextFunction } from 'express';

export interface RequestWithId extends Request {
  requestId?: string;
  startTime?: number;
}

const requestLogger = (req: RequestWithId, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = generateRequestId();
  req.startTime = Date.now();

  // Log incoming request
  console.log(`[${req.requestId}] ${req.method} ${req.originalUrl} - ${req.ip}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - (req.startTime || 0);
    console.log(`[${req.requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export { requestLogger };
