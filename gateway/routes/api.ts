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
router.use('/auth', createServiceProxy('auth'));

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
      }
    },
    documentation: '/api-docs',
    health: '/health'
  });
});

export { router as apiRoutes };
