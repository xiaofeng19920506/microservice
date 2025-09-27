import { createProxyMiddleware } from "http-proxy-middleware";
import { IServiceConfig } from "../../types";
import { gatewayUserMiddleware } from "../middleware/gatewayAuth";

// Service configurations
const services: Record<string, IServiceConfig> = {
  "auth-service": {
    url: `http://localhost:${process.env.AUTH_SERVICE_PORT || 12004}`,
    routes: ["/api/auth/*"],
    timeout: 5000,
    retries: 3,
    healthCheck: "",
  },
  "user-service": {
    url: `http://localhost:${process.env.USER_SERVICE_PORT || 12001}`,
    routes: ["/api/users/*"],
    timeout: 5000,
    retries: 3,
    healthCheck: "",
  },
};

// Create proxy middleware for each service
export const createProxyMiddlewares = () => {
  const middlewares: any[] = [];

  // Auth service proxy disabled - private endpoints handled by gateway routes

  // User service proxy with authentication middleware
  const userService = services["user-service"];
  if (userService) {
    // Apply user protection middleware first
    middlewares.push(gatewayUserMiddleware);

    // Then proxy to user service
    middlewares.push(
      createProxyMiddleware("/api/users", {
        target: userService.url,
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res) => {
          console.error("User Service Proxy Error:", err);
          res.status(503).json({
            success: false,
            message: "User service is currently unavailable",
          });
        },
      })
    );
  }

  return middlewares;
};

export { services };
