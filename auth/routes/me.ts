import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { authenticateToken } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let user: any;
  if (req.user!.modelType === 'staff') {
    user = await Staff.findById(req.user!.id);
  } else {
    user = await User.findById(req.user!.id);
  }
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const userResponse = {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    address: user.address,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  if (req.user!.modelType === 'staff') {
    Object.assign(userResponse, {
      managedStore: user.managedStore,
      workingStore: user.workingStore,
      isOwner: user.isOwner,
      employeeId: user.employeeId,
      position: user.position,
      hireDate: user.hireDate,
      salary: user.salary
    });
  }
  res.status(200).json({ user: userResponse });
}));

export { router as meRoutes };
