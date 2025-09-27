import { createProxyMiddleware } from "http-proxy-middleware";

// Simple proxy configuration without middleware
export const createSimpleProxies = () => {
  return [
    // Auth service proxy
    createProxyMiddleware("/api/auth", {
      target: "http://localhost:12004",
      changeOrigin: true,
      secure: false,
      timeout: 10000,
      proxyTimeout: 10000,
      onError: (err, req, res) => {
        console.error("Auth Service Proxy Error:", err);
        res.status(503).json({
          success: false,
          message: "Auth service is currently unavailable",
        });
      },
    }),

    // User service proxy
    createProxyMiddleware("/api/users", {
      target: "http://localhost:12001",
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
    }),
  ];
};
