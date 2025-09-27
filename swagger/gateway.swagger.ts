/**
 * @swagger
 * components:
 *   schemas:
 *     HealthResponse:
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
 *           example: API Gateway
 *         version:
 *           type: string
 *           example: 1.0.0
 *     ApiInfoResponse:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Microservice API Gateway
 *         version:
 *           type: string
 *           example: 1.0.0
 *         description:
 *           type: string
 *           example: Gateway for microservice architecture
 *         services:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               routes:
 *                 type: array
 *                 items:
 *                   type: string
 *         endpoints:
 *           type: object
 *           properties:
 *             health:
 *               type: string
 *             documentation:
 *               type: string
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API Gateway
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
export const gatewayHealthEndpoint = {};

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information
 *     description: Returns information about the API Gateway and available services
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiInfoResponse'
 */
export const gatewayApiEndpoint = {};
