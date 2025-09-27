import { Request, Response, NextFunction } from "express";
import {
  authenticateToken,
  requireStaff,
  requireAdminStaff,
} from "./authMiddleware";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api",
  "/api-docs",
  "/unified-api",
];

// Define admin-only routes
const ADMIN_ROUTES = ["/api/users/staff", "/api/users/all"];

// Define staff-only routes
const STAFF_ROUTES = ["/api/auth/staff"];

// Route protection middleware
export const protectRoutes = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path;

  // Check if route is public
  if (PUBLIC_ROUTES.some((route) => path.startsWith(route))) {
    return next();
  }

  // Check if route requires admin access
  if (ADMIN_ROUTES.some((route) => path.startsWith(route))) {
    return requireAdminStaff(req, res, next);
  }

  // Check if route requires staff access
  if (STAFF_ROUTES.some((route) => path.startsWith(route))) {
    return requireStaff(req, res, next);
  }

  // For all other routes, require authentication
  return authenticateToken(req, res, next);
};

// Specific middleware for auth service routes
export const protectAuthRoutes = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path;

  // Public auth routes
  const publicAuthRoutes = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/forgot-password",
  ];

  if (publicAuthRoutes.some((route) => path.startsWith(route))) {
    return next();
  }

  // All other auth routes require authentication
  return authenticateToken(req, res, next);
};

// Specific middleware for user service routes
export const protectUserRoutes = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path;

  // Admin-only user routes
  const adminUserRoutes = ["/api/users/staff", "/api/users/all"];

  if (adminUserRoutes.some((route) => path.startsWith(route))) {
    return requireAdminStaff(req, res, next);
  }

  // All other user routes require authentication
  return authenticateToken(req, res, next);
};
