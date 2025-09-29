import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { gatewayConfig, getServiceUrl } from '../config';
import { authenticateToken, authorizeRoles, optionalAuth } from '../middleware/auth';

const router = Router();

// Proxy configuration for each service - only changes port, preserves URL path
const createServiceProxy = (serviceName: keyof typeof gatewayConfig.services) => {
  const service = gatewayConfig.services[serviceName];
  
  return createProxyMiddleware({
    target: `http://localhost:${service.port}`,
    changeOrigin: true,
    secure: false,
    followRedirects: true,
    // No path rewriting - forward the exact same path
    timeout: service.timeout * 2, // Double the timeout for auth operations
    proxyTimeout: service.timeout * 2,
    // Let proxy handle raw request stream
    selfHandleResponse: false,
    preserveHeaderKeyCase: true,
    // Handle request body properly
    onProxyReq: (proxyReq: any, req: any, res: any) => {
      // Add request ID to headers for tracing
      if (req.headers['x-request-id']) {
        proxyReq.setHeader('x-request-id', req.headers['x-request-id']);
      }
      
      // Add user information if authenticated
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
      
      // Handle request body for POST/PUT/PATCH requests
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        console.log(`[GATEWAY] Forwarding body: ${bodyData}`);
      }
      
      // Log the proxy request for debugging
      console.log(`[GATEWAY] Proxying ${req.method} ${req.originalUrl} to http://localhost:${service.port}${req.url}`);
    },
    onError: (err: any, req: any, res: any) => {
      console.error(`[GATEWAY] Proxy error for ${serviceName}:`, {
        error: err.message,
        code: err.code,
        url: req.originalUrl,
        method: req.method,
        target: `http://localhost:${service.port}`
      });
      
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: `${serviceName} service is currently unavailable`,
          statusCode: 503,
          timestamp: new Date().toISOString(),
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    },
    onProxyRes: (proxyRes: any, req: any, res: any) => {
      // Add CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    }
  });
};

// Auth Service Routes
/**
 * @swagger
 * /api/auth:
 *   post:
 *     summary: User authentication
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Invalid credentials
 */
router.use('/auth', createServiceProxy('auth'));

// User Service Routes
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
router.use('/users', optionalAuth, createServiceProxy('user'));

// Product Service Routes
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
router.use('/products', createServiceProxy('product'));

// Order Service Routes
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     description: Retrieve a list of all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.use('/orders', authenticateToken, createServiceProxy('order'));

// Admin Routes (require admin role)
router.use('/admin', authenticateToken, authorizeRoles('admin'), createServiceProxy('user'));

// Service-specific health checks
router.get('/services/health', async (req, res) => {
  try {
    const { getAllServicesHealth } = await import('../config');
    const servicesHealth = await getAllServicesHealth();
    res.json({
      services: servicesHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check service health',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Microservice API Gateway',
    version: '1.0.0',
    services: {
      auth: {
        url: getServiceUrl('auth'),
        endpoints: ['/api/auth/login', '/api/auth/register', '/api/auth/refresh']
      },
      user: {
        url: getServiceUrl('user'),
        endpoints: ['/api/users', '/api/users/:id']
      },
      product: {
        url: getServiceUrl('product'),
        endpoints: ['/api/products', '/api/products/:id', '/api/categories']
      },
      order: {
        url: getServiceUrl('order'),
        endpoints: ['/api/orders', '/api/orders/:id', '/api/payments']
      }
    },
    documentation: '/api-docs',
    health: '/health'
  });
});

export { router as apiRoutes };
