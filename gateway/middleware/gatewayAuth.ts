import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IJWTPayload } from "../../types";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}

// Gateway authentication middleware for auth routes
export const gatewayAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // Public auth routes that don't require authentication
  const publicAuthRoutes = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/forgot-password"
  ];
  
  // Check if this is a public route
  if (publicAuthRoutes.some(route => path.startsWith(route))) {
    return next(); // Allow public routes without authentication
  }
  
  // For all other auth routes, require authentication
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Gateway authentication middleware for user routes
export const gatewayUserMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // Admin-only user routes
  const adminUserRoutes = ["/api/users/staff", "/api/users/all"];
  
  if (adminUserRoutes.some(route => path.startsWith(route))) {
    // Require admin staff for these routes
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    
    if (req.user.userType !== "staff" || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin staff access required",
      });
    }
  }
  
  // For all other user routes, require authentication
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
