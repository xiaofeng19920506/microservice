import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { generateSwaggerSpec } from "../../../swagger/swagger.config";
import userRoutes from "../routes/userRoutes";
import "../../../swagger/user.swagger";

const createApp = () => {
  const app = express();
  const PORT = parseInt(process.env.USER_SERVICE_PORT || "3001");

  // Swagger configuration
  const swaggerSpec = generateSwaggerSpec({
    title: "User Service API",
    version: "1.0.0",
    description: "User management service for microservice architecture",
    port: PORT,
    apis: ["./services/user-service/server.ts", "./swagger/user.swagger.ts"],
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
  app.use("/", userRoutes);

  // Error handling
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("User Service Error:", err);
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
