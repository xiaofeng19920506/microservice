# API Gateway Service

A comprehensive API Gateway service built with Express.js and TypeScript for microservice architecture.

## Features

- 🚀 **High Performance**: Built with Express.js and optimized for production
- 🔒 **Security**: JWT authentication, CORS, rate limiting, and security headers
- 🔄 **Load Balancing**: Intelligent routing to microservices
- 📊 **Health Monitoring**: Comprehensive health checks and service discovery
- 📚 **API Documentation**: Auto-generated Swagger documentation
- 🐳 **Docker Ready**: Containerized with Docker and Docker Compose
- 🔧 **TypeScript**: Full type safety and modern development experience
- 📝 **Logging**: Request/response logging with unique request IDs
- ⚡ **Caching**: Built-in response caching capabilities
- 🛡️ **Error Handling**: Comprehensive error handling and recovery

## Architecture

```
┌─────────────────┐
│   API Gateway   │  ← Entry point (Port 12000)
│   (Express)     │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│ Auth  │  │ User  │  │Product│  │ Order │
│:12004 │  │:12001 │  │:12002 │  │:12003 │
└───────┘  └───────┘  └───────┘  └───────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp config.env .env
# Edit .env with your configuration
```

3. **Start the gateway:**
```bash
# Development
npm run dev:gateway

# Production
npm run build
npm start
```

### Using Docker

```bash
# Build and start all services
docker-compose up --build

# Start only the gateway
docker-compose up gateway
```

## API Endpoints

### Gateway Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Gateway information |
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness check |
| GET | `/health/live` | Liveness check |
| GET | `/api` | API information |
| GET | `/api-docs` | Swagger documentation |

### Service Proxies

| Service | Endpoint | Description |
|---------|----------|-------------|
| Auth | `/api/auth/*` | Authentication service |
| User | `/api/users/*` | User management |
| Product | `/api/products/*` | Product catalog |
| Order | `/api/orders/*` | Order management |

## Configuration

### Environment Variables

```env
# Gateway Configuration
GATEWAY_PORT=12000
NODE_ENV=development

# Service URLs
AUTH_SERVICE_URL=http://localhost:12004
USER_SERVICE_URL=http://localhost:12001
PRODUCT_SERVICE_URL=http://localhost:12002
ORDER_SERVICE_URL=http://localhost:12003

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Service Configuration

The gateway automatically discovers and routes to microservices based on the configuration in `config.ts`:

```typescript
export const gatewayConfig: GatewayConfig = {
  port: 12000,
  services: {
    auth: {
      name: 'auth-service',
      url: 'http://localhost:12004',
      port: 12004,
      healthEndpoint: '/health',
      timeout: 5000,
      retries: 3
    },
    // ... other services
  }
};
```

## Security Features

### Authentication & Authorization

- JWT token validation
- Role-based access control
- Optional authentication for public endpoints
- Token refresh mechanism

### Rate Limiting

- Configurable rate limits per IP
- Different limits for different endpoints
- Graceful degradation

### CORS & Security Headers

- Configurable CORS origins
- Security headers via Helmet.js
- Content Security Policy

## Health Monitoring

### Health Check Endpoints

```bash
# Basic health check
curl http://localhost:12000/health

# Readiness check (for Kubernetes)
curl http://localhost:12000/health/ready

# Liveness check (for Kubernetes)
curl http://localhost:12000/health/live
```

### Service Discovery

The gateway automatically monitors the health of all connected services:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "auth": true,
    "user": true,
    "product": true,
    "order": true
  }
}
```

## Development

### Project Structure

```
gateway/
├── server.ts              # Main server file
├── config.ts              # Configuration
├── middleware/            # Custom middleware
│   ├── auth.ts           # Authentication
│   ├── errorHandler.ts   # Error handling
│   └── requestLogger.ts  # Request logging
├── routes/                # Route handlers
│   ├── api.ts            # API routes
│   └── health.ts         # Health check routes
├── Dockerfile            # Docker configuration
└── README.md            # This file
```

### Adding New Services

1. **Update configuration:**
```typescript
// In config.ts
services: {
  newService: {
    name: 'new-service',
    url: 'http://localhost:12005',
    port: 12005,
    healthEndpoint: '/health',
    timeout: 5000,
    retries: 3
  }
}
```

2. **Add proxy route:**
```typescript
// In routes/api.ts
router.use('/new-service', createServiceProxy('newService'));
```

### Custom Middleware

Create custom middleware in the `middleware/` directory:

```typescript
export const customMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Your middleware logic
  next();
};
```

## Testing

### Manual Testing

```bash
# Test gateway health
curl http://localhost:12000/health

# Test service routing
curl http://localhost:12000/api/users
curl http://localhost:12000/api/products

# Test authentication
curl -H "Authorization: Bearer <token>" http://localhost:12000/api/orders
```

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## Deployment

### Docker Deployment

```bash
# Build the image
docker build -f gateway/Dockerfile -t microservice-gateway .

# Run the container
docker run -p 12000:12000 microservice-gateway
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
      - name: gateway
        image: microservice-gateway:latest
        ports:
        - containerPort: 12000
        env:
        - name: NODE_ENV
          value: "production"
```

## Monitoring & Logging

### Request Logging

Every request is logged with a unique request ID:

```
[req-12345] GET /api/users - 200 - 45ms
[req-12346] POST /api/auth/login - 401 - 12ms
```

### Error Logging

Comprehensive error logging with stack traces:

```
Gateway Error: {
  message: "Service unavailable",
  statusCode: 503,
  stack: "...",
  url: "/api/orders",
  method: "GET"
}
```

### Metrics

- Request count and duration
- Error rates by service
- Health check status
- Service availability

## Troubleshooting

### Common Issues

1. **Service Connection Failed**
   - Check service URLs in configuration
   - Verify services are running
   - Check network connectivity

2. **Authentication Errors**
   - Verify JWT secret configuration
   - Check token expiration
   - Validate token format

3. **CORS Issues**
   - Update ALLOWED_ORIGINS configuration
   - Check preflight requests
   - Verify credentials setting

### Debug Mode

Enable debug logging:

```bash
DEBUG=gateway:* npm run dev:gateway
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
