import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Auth service health check
 *     description: Returns the health status of the auth service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     connection:
 *                       type: string
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbConnection = dbStatus === 1 ? 'connected' : 'disconnected';
    
    const healthStatus = {
      status: dbStatus === 1 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: {
        name: 'auth-service',
        version: '1.0.0',
        port: process.env.PORT || 12004
      },
      database: {
        status: dbConnection,
        connection: mongoose.connection.host || 'unknown'
      }
    };

    const statusCode = dbStatus === 1 ? 200 : 503;
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
 *     description: Check if the auth service is ready to accept requests
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  const isReady = dbStatus === 1;
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    message: isReady ? 'Auth service is ready to accept requests' : 'Auth service is not ready'
  });
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check
 *     description: Check if the auth service process is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

export { router as healthRoutes };
