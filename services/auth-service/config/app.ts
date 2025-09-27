import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { generateSwaggerSpec } from "../../../swagger/swagger.config";
import authRoutes from "../routes/authRoutes";
import "../../../swagger/auth.swagger";

const createApp = () => {
  const app = express();
  const PORT = process.env.AUTH_SERVICE_PORT || 12004;

  // Swagger configuration
  const swaggerSpec = generateSwaggerSpec({
    title: "Auth Service API",
    version: "1.0.0",
    description:
      "Authentication and authorization service for microservice architecture",
    port: parseInt(PORT.toString()),
    apis: ["./services/auth-service/server.ts", "./swagger/auth.swagger.ts"],
  });

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(morgan("combined"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Routes
  app.use("/", authRoutes);

  // Error handling
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("Auth Service Error:", err);
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
