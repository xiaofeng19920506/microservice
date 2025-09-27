/**
 * @swagger
 * components:
 *   schemas:
 *     UnifiedHealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: OK
 *         timestamp:
 *           type: string
 *           format: date-time
 *         service:
 *           type: string
 *           example: Microservice API
 *         version:
 *           type: string
 *           example: 1.0.0
 *         services:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *               url:
 *                 type: string
 *     UnifiedApiInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Microservice API Documentation
 *         version:
 *           type: string
 *           example: 1.0.0
 *         description:
 *           type: string
 *           example: Complete API documentation for all microservices
 *         services:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               baseUrl:
 *                 type: string
 *               endpoints:
 *                 type: array
 *                 items:
 *                   type: string
 */

/**
 * @swagger
 * /unified-health:
 *   get:
 *     summary: Unified health check for all services
 *     description: Returns the health status of all microservices
 *     tags: [Unified API]
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnifiedHealthResponse'
 */
export const unifiedHealthEndpoint = {};

/**
 * @swagger
 * /unified-api:
 *   get:
 *     summary: Unified API information
 *     description: Returns comprehensive information about all microservices
 *     tags: [Unified API]
 *     responses:
 *       200:
 *         description: Unified API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnifiedApiInfo'
 */
export const unifiedApiEndpoint = {};
