import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { RefreshToken } from '../models/RefreshToken';
import { generateAccessToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, isAdmin } = req.body;
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }
  let user: any;
  if (isAdmin) {
    user = await Staff.findOne({ email }).select('+password');
  } else {
    user = await User.findOne({ email }).select('+password');
  }
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  user.lastLogin = new Date();
  await user.save();
  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isAdmin: isAdmin
  };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = user.generateRefreshToken();
  await user.save();
  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  res.json({
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      ...(isAdmin && {
        managedStore: user.managedStore,
        workingStore: user.workingStore,
        isOwner: user.isOwner,
        employeeId: user.employeeId,
        position: user.position,
      })
    }
  });
}));

export { router as loginRoutes };
