import swaggerJsdoc from "swagger-jsdoc";

export interface SwaggerConfig {
  title: string;
  version: string;
  description: string;
  port: number;
  apis: string[];
}

export const createSwaggerConfig = (config: SwaggerConfig) => {
  return {
    definition: {
      openapi: "3.0.0",
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
        contact: {
          name: "API Support",
          email: "support@example.com",
        },
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          User: {
            type: "object",
            properties: {
              _id: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              email: { type: "string", format: "email" },
              role: { type: "string" },
              userType: { type: "string" },
              isActive: { type: "boolean" },
              addresses: { type: "array", items: { type: "string" } },
            },
          },
          Staff: {
            type: "object",
            properties: {
              _id: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              email: { type: "string", format: "email" },
              role: { type: "string" },
              workingStore: { type: "array", items: { type: "string" } },
              managedStore: { type: "array", items: { type: "string" } },
              ownedStore: { type: "array", items: { type: "string" } },
              isActive: { type: "boolean" },
            },
          },
          LoginRequest: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string", minLength: 6 },
              isAdmin: { type: "boolean", default: false },
            },
          },
          RegisterRequest: {
            type: "object",
            required: ["firstName", "lastName", "email", "password"],
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
              email: { type: "string", format: "email" },
              password: { type: "string", minLength: 6 },
              role: { type: "string" },
              workingStore: { type: "array", items: { type: "string" } },
              managedStore: { type: "array", items: { type: "string" } },
              ownedStore: { type: "array", items: { type: "string" } },
              isAdmin: { type: "boolean", default: false },
            },
          },
          AuthResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  user: { $ref: "#/components/schemas/User" },
                  staff: { $ref: "#/components/schemas/Staff" },
                  accessToken: { type: "string" },
                  refreshToken: { type: "string" },
                },
              },
              message: { type: "string" },
            },
          },
          ApiResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
              count: { type: "number" },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    apis: config.apis,
  };
};

export const generateSwaggerSpec = (config: SwaggerConfig) => {
  const swaggerOptions = createSwaggerConfig(config);
  return swaggerJsdoc(swaggerOptions);
};
