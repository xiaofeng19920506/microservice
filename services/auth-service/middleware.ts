import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { IJWTPayload } from '../../types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Authorization middleware for specific roles
const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Staff-only middleware
const requireStaff = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (req.user.userType !== 'staff') {
    res.status(403).json({
      success: false,
      message: 'Staff access required'
    });
    return;
  }

  next();
};

// Admin-only middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (req.user.userType !== 'staff' || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }

  next();
};


// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we don't fail the request
      req.user = undefined;
    }
  }

  next();
};

// Rate limiting middleware for sensitive operations
const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Password validation middleware
const validatePassword = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;
  
  if (!password) {
    res.status(400).json({
      success: false,
      message: 'Password is required'
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
    return;
  }

  if (password.length > 128) {
    res.status(400).json({
      success: false,
      message: 'Password must be less than 128 characters'
    });
    return;
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'qwerty', 'abc123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    res.status(400).json({
      success: false,
      message: 'Password is too weak. Please choose a stronger password'
    });
    return;
  }

  next();
};

// Email validation middleware
const validateEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Email is required'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
    return;
  }

  next();
};

// Token blacklist middleware (for logout functionality)
const tokenBlacklist = new Set<string>();

const checkBlacklist = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && tokenBlacklist.has(token)) {
    res.status(401).json({
      success: false,
      message: 'Token has been revoked'
    });
    return;
  }

  next();
};

// Add token to blacklist
const blacklistToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    tokenBlacklist.add(token);
  }

  next();
};

export {
  authenticateToken,
  authorize,
  requireStaff,
  requireAdmin,
  optionalAuth,
  createRateLimit,
  validatePassword,
  validateEmail,
  checkBlacklist,
  blacklistToken
};
