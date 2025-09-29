import { Router, Request, Response } from 'express';
import { RefreshToken } from '../models/RefreshToken';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { generateAccessToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh123token"
 *     responses:
 *       200:
 *         description: Token refreshed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }
  const tokenDoc = await RefreshToken.findOne({ 
    token: refreshToken,
    expiresAt: { $gt: new Date() }
  });
  if (!tokenDoc) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
  const isAdmin = req.headers['x-is-admin'] === 'true';
  let user: any;
  if (isAdmin) {
    user = await Staff.findById(tokenDoc.userId);
  } else {
    user = await User.findById(tokenDoc.userId);
  }
  if (!user) {
    throw new AppError('User not found', 401);
  }
  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isAdmin: isAdmin
  };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = user.generateRefreshToken();
  await user.save();
  tokenDoc.token = newRefreshToken;
  tokenDoc.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await tokenDoc.save();
  res.status(200).json({
    message: 'Token refreshed successfully',
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
}));

export { router as refreshRoutes };
