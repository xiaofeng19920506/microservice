import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import axios from "axios";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.GATEWAY_PORT || "12000");

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// Service configurations
const services = {
  "auth-service": {
    url: `http://localhost:${process.env.AUTH_SERVICE_PORT || 12004}`,
    routes: ["/api/auth/*"],
  },
};

// Auth service proxy (manual implementation)
app.use("/api/auth", async (req, res) => {
  try {
    // Keep the full path since auth service routes are mounted at /api/auth
    console.log(`Proxying ${req.method} ${req.url} to ${services["auth-service"].url}${req.url}`);
    
    const response = await axios({
      method: req.method,
      url: `${services["auth-service"].url}${req.url}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header
      },
      timeout: 10000,
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Service unavailable"
      });
    }
  }
});


// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Gateway is healthy",
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Microservice API Gateway",
    version: "1.0.0",
    description: "Gateway for microservice architecture",
    services: Object.keys(services).map(name => ({
      name,
      url: services[name as keyof typeof services]?.url,
      routes: services[name as keyof typeof services]?.routes,
    })),
    endpoints: {
      health: "/health",
      auth: {
        login: "POST /api/auth/login",
        signup: "POST /api/auth/signup",
      },
    },
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Gateway Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// 404 handler
app.use("*", (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📋 Available services: ${Object.keys(services).join(", ")}`);
  console.log(`📖 API docs: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth Service: ${services["auth-service"].url}`);
});

export default app;
