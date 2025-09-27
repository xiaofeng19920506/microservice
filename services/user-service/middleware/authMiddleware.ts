import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IJWTPayload } from "../../../types";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}

// Authentication middleware
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
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

// Admin staff middleware
export const requireAdminStaff = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
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

  next();
};
