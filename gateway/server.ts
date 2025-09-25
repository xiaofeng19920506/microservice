import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from './config';
import { IServiceConfig } from '../types';
require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.GATEWAY_PORT || '3000');

// Security middleware
app.use(helmet());
app.use(cors());

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Service registry - in production, this would be a service discovery service
const services: { [key: string]: IServiceConfig & { health: string } } = {
  'auth-service': {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:12004',
    timeout: 5000,
    retries: 3,
    healthCheck: '/health',
    health: '/health',
    routes: ['/api/auth']
  },
  'user-service': {
    url: process.env.USER_SERVICE_URL || 'http://localhost:12001',
    timeout: 5000,
    retries: 3,
    healthCheck: '/health',
    health: '/health',
    routes: ['/api/users', '/api/users/staff', '/api/users/all']
  },
  'product-service': {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:12002',
    timeout: 5000,
    retries: 3,
    healthCheck: '/health',
    health: '/health',
    routes: ['/api/products', '/api/categories']
  },
  'order-service': {
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:12003',
    timeout: 5000,
    retries: 3,
    healthCheck: '/health',
    health: '/health',
    routes: ['/api/orders', '/api/payments']
  }
};

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'API Gateway',
    version: '1.0.0'
  });
});

// Service discovery and routing
Object.keys(services).forEach(serviceName => {
  const service = services[serviceName];
  
  if (service) {
    service.routes.forEach(route => {
      app.use(route, createProxyMiddleware({
        target: service.url,
        changeOrigin: true,
        pathRewrite: {
          [`^${route}`]: route
        },
        onError: (err: Error, req: Request, res: Response) => {
          console.error(`Error proxying to ${serviceName}:`, err.message);
          res.status(503).json({
            error: 'Service temporarily unavailable',
            service: serviceName,
            message: 'The requested service is currently unavailable'
          });
        },
        onProxyReq: (proxyReq: any, req: Request, res: Response) => {
          console.log(`Proxying ${req.method} ${req.url} to ${serviceName}`);
        }
      }));
    });
  }
});

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Microservice API Gateway',
    version: '1.0.0',
    description: 'Gateway for microservice architecture',
    services: Object.keys(services).map(name => ({
      name,
      url: services[name]?.url || '',
      routes: services[name]?.routes || []
    })),
    endpoints: {
      health: '/health',
      documentation: '/api'
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: Object.values(services).flatMap(service => service.routes)
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Gateway Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred in the gateway'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📋 Available services: ${Object.keys(services).join(', ')}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api`);
});

export default app;
