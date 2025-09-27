# Microservice Architecture with API Gateway

A Node.js microservice architecture with an API Gateway as the entry point to access all services.

## Architecture Overview

```
┌─────────────────┐
│   API Gateway   │  ← Entry point (Port 3000)
│   (Express)     │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│ User  │  │Product│  │ Order │
│Service│  │Service│  │Service│
│:3001  │  │:3002  │  │:3003  │
└───────┘  └───────┘  └───────┘
```

## Services

### 1. API Gateway (Port 3000)

- Entry point for all client requests
- Routes requests to appropriate microservices
- Handles load balancing and service discovery
- Provides unified API documentation
- Implements rate limiting and security

### 2. User Service (Port 3001)

- User management and authentication
- Endpoints: `/api/users`, `/api/auth`
- Features: CRUD operations, login/register

### 3. Product Service (Port 3002)

- Product catalog management
- Endpoints: `/api/products`, `/api/categories`
- Features: Product CRUD, category management, search/filter

### 4. Order Service (Port 3003)

- Order and payment processing
- Endpoints: `/api/orders`, `/api/payments`
- Features: Order management, payment processing

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (running locally or via Docker)
- Docker (optional)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
# Create .env file with the following variables:
MONGODB_URI=mongodb://localhost:27017/microservice_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
GATEWAY_PORT=3000
AUTH_SERVICE_PORT=12004
USER_SERVICE_PORT=12001
```

3. **Start all services:**

```bash
# Start all services with environment variables
MONGODB_URI="mongodb://localhost:27017/microservice_db" JWT_SECRET="your-super-secret-jwt-key-change-this-in-production" JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production" npm run dev:all
```

### Using Docker

1. **Build and start all services:**

```bash
npm run docker:build
npm run docker:up
```

2. **Stop services:**

```bash
npm run docker:down
```

## API Endpoints

### Gateway (http://localhost:3000)

- `GET /health` - Gateway health check
- `GET /api` - API documentation
- `GET /api/users` - User service routes
- `GET /api/products` - Product service routes
- `GET /api/orders` - Order service routes

### User Service (http://localhost:3001)

- `GET /health` - Service health check
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Product Service (http://localhost:3002)

- `GET /health` - Service health check
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category

### Order Service (http://localhost:3003)

- `GET /health` - Service health check
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment
- `PUT /api/payments/:id/status` - Update payment status

## Testing the API

### 1. Check Gateway Health

```bash
curl http://localhost:3000/health
```

### 2. Get API Documentation

```bash
curl http://localhost:3000/api
```

### 3. Test User Service through Gateway

```bash
# Get all users
curl http://localhost:3000/api/users

# Create a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "role": "user"}'
```

### 4. Test Product Service through Gateway

```bash
# Get all products
curl http://localhost:3000/api/products

# Create a new product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "New Product", "price": 99.99, "category": "Electronics", "stock": 10}'
```

### 5. Test Order Service through Gateway

```bash
# Get all orders
curl http://localhost:3000/api/orders

# Create a new order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "items": [{"productId": 1, "quantity": 2, "price": 99.99}]}'
```

## Development

### Project Structure

```
microservice/
├── gateway/
│   ├── server.js          # Gateway server
│   ├── config.js          # Gateway configuration
│   └── Dockerfile         # Gateway Docker config
├── services/
│   ├── user-service/
│   │   ├── server.js      # User service server
│   │   └── Dockerfile     # User service Docker config
│   ├── product-service/
│   │   ├── server.js      # Product service server
│   │   └── Dockerfile     # Product service Docker config
│   └── order-service/
│       ├── server.js      # Order service server
│       └── Dockerfile     # Order service Docker config
├── package.json           # Dependencies and scripts
├── docker-compose.yml     # Docker orchestration
├── config.env            # Environment variables
└── README.md             # This file
```

### Adding New Services

1. Create a new service directory under `services/`
2. Implement the service with Express.js
3. Add service configuration to `gateway/config.js`
4. Update `docker-compose.yml` if using Docker
5. Add service routes to the gateway

### Environment Variables

Copy `config.env` to `.env` and modify as needed:

```bash
cp config.env .env
```

Key variables:

- `GATEWAY_PORT` - Gateway port (default: 3000)
- `USER_SERVICE_URL` - User service URL
- `PRODUCT_SERVICE_URL` - Product service URL
- `ORDER_SERVICE_URL` - Order service URL

## Features

- ✅ API Gateway with routing
- ✅ Service discovery
- ✅ Load balancing
- ✅ Rate limiting
- ✅ CORS support
- ✅ Security headers
- ✅ Health checks
- ✅ Docker support
- ✅ Error handling
- ✅ Logging

## Future Enhancements

- [ ] Database integration (PostgreSQL, MongoDB)
- [ ] Authentication & Authorization (JWT)
- [ ] Message queues (Redis, RabbitMQ)
- [ ] Monitoring and logging (ELK stack)
- [ ] Service mesh (Istio)
- [ ] Kubernetes deployment
- [ ] API versioning
- [ ] Caching layer
- [ ] Circuit breaker pattern
- [ ] Distributed tracing

## License

MIT
