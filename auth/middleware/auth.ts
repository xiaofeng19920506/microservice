import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isAdmin: boolean;
    modelType: 'user' | 'staff';
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // Check if this is an admin request (staff)
    const isAdmin = req.headers['x-is-admin'] === 'true' || decoded.isAdmin;
    
    let user: any;
    if (isAdmin) {
      // Look up in Staff collection
      user = await Staff.findById(decoded.id).select('+role');
    } else {
      // Look up in User collection
      user = await User.findById(decoded.id).select('+role');
    }
    
    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isAdmin: isAdmin,
      modelType: isAdmin ? 'staff' : 'user'
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid token', 403));
    }
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Access denied. Authentication required.', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('Access denied. Insufficient permissions.', 403));
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      const isAdmin = req.headers['x-is-admin'] === 'true' || decoded.isAdmin;
      
      let user: any;
      if (isAdmin) {
        user = await Staff.findById(decoded.id).select('+role');
      } else {
        user = await User.findById(decoded.id).select('+role');
      }
      
      if (user) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          isAdmin: isAdmin,
          modelType: isAdmin ? 'staff' : 'user'
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail if token is invalid
    next();
  }
};

export const verifyRefreshToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Check if refresh token exists and is not revoked
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!tokenDoc) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const isAdmin = req.headers['x-is-admin'] === 'true';
    
    // Check if user still exists
    let user: any;
    if (isAdmin) {
      user = await Staff.findById(tokenDoc.userId);
    } else {
      user = await User.findById(tokenDoc.userId);
    }
    
    if (!user) {
      throw new AppError('User account not found', 401);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isAdmin: isAdmin,
      modelType: isAdmin ? 'staff' : 'user'
    };

    next();
  } catch (error) {
    next(error);
  }
};
