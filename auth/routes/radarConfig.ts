import { Router, Request, Response } from 'express';
import { addressValidationService } from '../services/addressValidationService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/auth/radar/config:
 *   get:
 *     summary: Get Radar client configuration
 *     description: Returns the public key and configuration needed for client-side Radar SDK initialization
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Radar client configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 *                   description: Radar public key for client-side SDK
 *                   example: "prj_test_public_key_here"
 *                 isConfigured:
 *                   type: boolean
 *                   description: Whether the public key is configured
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Radar client configuration retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "Something went wrong"
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 */
router.get('/config', asyncHandler(async (req: Request, res: Response) => {
  const config = addressValidationService.getClientConfig();
  
  res.status(200).json({
    ...config,
    message: 'Radar client configuration retrieved successfully'
  });
}));

export { router as radarConfigRoutes };
