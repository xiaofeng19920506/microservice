import { Request, Response, NextFunction } from "express";

// Global error handler
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Service Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};
