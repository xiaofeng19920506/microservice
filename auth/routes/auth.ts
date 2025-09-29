import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { authenticateToken, verifyRefreshToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account using email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (will be used as username)
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *               firstName:
 *                 type: string
 *                 description: User's first name (optional)
 *               lastName:
 *                 type: string
 *                 description: User's last name (optional)
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Use email as username
  const username = email;
  
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Create new user
  const user = new User({
    username,
    email,
    password,
    firstName,
    lastName
  });

  await user.save();

  // Generate tokens
  const tokenPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token
  const refreshTokenDoc = new RefreshToken({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  await refreshTokenDoc.save();

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: '1h'
    }
  });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user using email and password, return JWT tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (used as username)
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is inactive
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password +isActive');
  
  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const tokenPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token
  const refreshTokenDoc = new RefreshToken({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  await refreshTokenDoc.save();

  res.json({
    message: 'Login successful',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: '1h'
    }
  });
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token
 *     tags: [Authentication]
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
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', verifyRefreshToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.body;

  // Find and revoke the old refresh token
  const oldTokenDoc = await RefreshToken.findOneAndUpdate(
    { token: refreshToken },
    { isRevoked: true },
    { new: true }
  );

  if (!oldTokenDoc) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Generate new tokens
  const tokenPayload = {
    id: req.user!.id,
    username: req.user!.username,
    email: req.user!.email,
    role: req.user!.role
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Store new refresh token
  const newRefreshTokenDoc = new RefreshToken({
    token: newRefreshToken,
    userId: req.user!.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  await newRefreshTokenDoc.save();

  res.json({
    message: 'Token refreshed successfully',
    tokens: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: '1h'
    }
  });
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Revoke refresh token and logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Revoke the refresh token
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { isRevoked: true }
    );
  }

  res.json({
    message: 'Logout successful'
  });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get current authenticated user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
}));

/**
 * @swagger
 * /api/auth/clear-db:
 *   delete:
 *     summary: Clear all users from database (Development only)
 *     description: Remove all users from the database - USE ONLY IN DEVELOPMENT
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Database cleared successfully
 *       500:
 *         description: Server error
 */
router.delete('/clear-db', asyncHandler(async (req: Request, res: Response) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw new AppError('This endpoint is not available in production', 403);
  }

  try {
    const result = await User.deleteMany({});
    res.json({
      message: 'Database cleared successfully',
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new AppError('Failed to clear database', 500);
  }
}));

export { router as authRoutes };
