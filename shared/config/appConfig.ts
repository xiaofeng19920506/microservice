import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { generalLimiter } from "../middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";

// Common middleware setup
export const setupCommonMiddleware = (app: express.Application) => {
  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(morgan("combined"));
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use(generalLimiter);
};

// Common error handling
export const setupErrorHandling = (app: express.Application) => {
  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use("*", notFoundHandler);
};

// Health check response
export const createHealthResponse = (serviceName: string) => ({
  status: "OK",
  service: serviceName,
  timestamp: new Date().toISOString(),
  version: "1.0.0",
});
