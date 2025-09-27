import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { generateSwaggerSpec } from "../../swagger/swagger.config";
import gatewayRoutes from "../routes/gatewayRoutes";
import { createProxyMiddlewares } from "./proxy";
import "../../swagger/gateway.swagger";
import "../../swagger/auth.swagger";
import "../../swagger/user.swagger";
import "../../swagger/unified.swagger";

const createApp = () => {
  const app = express();
  const PORT = parseInt(process.env.GATEWAY_PORT || "3000");

  // Swagger configuration
  const swaggerSpec = generateSwaggerSpec({
    title: "Microservice API Documentation",
    version: "1.0.0",
    description:
      "Complete API documentation for all microservices including Gateway, Auth Service, and User Service",
    port: PORT,
    apis: [
      "./gateway/server.ts",
      "./swagger/gateway.swagger.ts",
      "./swagger/auth.swagger.ts",
      "./swagger/user.swagger.ts",
      "./swagger/unified.swagger.ts",
    ],
  });

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

  // Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Gateway routes (must come before proxy middlewares)
  app.use("/", gatewayRoutes);

  // Proxy middlewares
  const proxyMiddlewares = createProxyMiddlewares();
  proxyMiddlewares.forEach((middleware) => {
    app.use(middleware);
  });

  // Error handling
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("Gateway Error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  );

  // 404 handler
  app.use("*", (req: express.Request, res: express.Response) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  return app;
};

export default createApp;
