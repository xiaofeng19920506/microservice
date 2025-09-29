import { Router, Request, Response } from 'express';
import { getAllServicesHealth, gatewayConfig } from '../config';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Gateway health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Gateway is healthy
 *       503:
 *         description: Gateway is unhealthy
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const servicesHealth = await getAllServicesHealth();
    const allServicesHealthy = Object.values(servicesHealth).every(status => status);
    
    const healthStatus = {
      status: allServicesHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: servicesHealth,
      gateway: {
        port: gatewayConfig.port,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      }
    };

    const statusCode = allServicesHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: 'Unable to verify service health'
    });
  }
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Gateway is ready
 */
router.get('/ready', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    message: 'Gateway is ready to accept requests'
  });
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Gateway is alive
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

export { router as healthCheck };
