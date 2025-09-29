import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { RefreshToken } from '../models/RefreshToken';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { authenticateToken } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh123token"
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
    if (req.user!.modelType === 'staff') {
      await Staff.findByIdAndUpdate(req.user!.id, {
        $pull: { refreshTokens: refreshToken }
      });
    } else {
      await User.findByIdAndUpdate(req.user!.id, {
        $pull: { refreshTokens: refreshToken }
      });
    }
  }
  res.status(200).json({ message: 'Logout successful' });
}));

export { router as logoutRoutes };
