import { Request, Response } from "express";
import { IServiceConfig } from "../../types";

// Service configurations
const services: Record<string, IServiceConfig> = {
  "auth-service": {
    url: `http://localhost:${process.env.AUTH_SERVICE_PORT || 12004}`,
    routes: ["/api/auth/*"],
    timeout: 5000,
    retries: 3,
    healthCheck: "/health",
  },
  "user-service": {
    url: `http://localhost:${process.env.USER_SERVICE_PORT || 12001}`,
    routes: ["/api/users/*"],
    timeout: 5000,
    retries: 3,
    healthCheck: "/health",
  },
};

// API info controller
export const getApiInfo = (req: Request, res: Response) => {
  const serviceList = Object.entries(services).map(([name, config]) => ({
    name,
    url: config.url,
    routes: config.routes,
  }));

  res.json({
    name: "Microservice API Gateway",
    version: "1.0.0",
    description: "Gateway for microservice architecture",
    services: serviceList,
    endpoints: {
      health: "/health",
      documentation: "/api-docs",
    },
  });
};

// Unified API info controller
export const getUnifiedApiInfo = (req: Request, res: Response) => {
  const serviceList = Object.entries(services).map(([name, config]) => ({
    name: name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `${name.replace("-", " ")} for microservice architecture`,
    baseUrl: config.url,
    endpoints: config.routes,
  }));

  res.json({
    name: "Microservice API Documentation",
    version: "1.0.0",
    description: "Complete API documentation for all microservices",
    services: serviceList,
    documentation: {
      unified: `http://localhost:${process.env.GATEWAY_PORT || 12000}/api-docs`,
      gateway: `http://localhost:${process.env.GATEWAY_PORT || 12000}/api-docs`,
      auth: `http://localhost:${
        process.env.AUTH_SERVICE_PORT || 12004
      }/api-docs`,
      user: `http://localhost:${
        process.env.USER_SERVICE_PORT || 12001
      }/api-docs`,
    },
  });
};
