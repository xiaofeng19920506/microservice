import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/auth/confirm-email:
 *   post:
 *     summary: Confirm email address
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "abc123token"
 *               isAdmin:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Email confirmed
 *       400:
 *         description: Invalid token
 */
router.post('/confirm-email', asyncHandler(async (req: Request, res: Response) => {
  const { token, isAdmin } = req.body;
  if (!token) {
    throw new AppError('Confirmation token is required', 400);
  }
  let foundUser: any;
  if (isAdmin) {
    foundUser = await Staff.findOne({
      emailConfirmationToken: token,
      emailConfirmationExpires: { $gt: new Date() }
    });
  } else {
    foundUser = await User.findOne({
      emailConfirmationToken: token,
      emailConfirmationExpires: { $gt: new Date() }
    });
  }
  if (!foundUser) {
    throw new AppError('Invalid or expired confirmation token', 400);
  }
  if (isAdmin) {
    await Staff.findByIdAndUpdate(foundUser._id, {
      isEmailVerified: true,
      $unset: {
        emailConfirmationToken: 1,
        emailConfirmationExpires: 1
      }
    });
  } else {
    await User.findByIdAndUpdate(foundUser._id, {
      isEmailVerified: true,
      $unset: {
        emailConfirmationToken: 1,
        emailConfirmationExpires: 1
      }
    });
  }
  res.json({
    message: 'Email confirmed successfully! You can now fully access your account.',
    confirmed: true,
    email: foundUser.email
  });
}));

export { router as confirmEmailRoutes };
