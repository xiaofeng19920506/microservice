import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { RefreshToken } from '../models/RefreshToken';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { authenticateToken, verifyRefreshToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import crypto from 'crypto';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user or staff member
 *     description: Create a new user account with email confirmation required
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
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (used as username)
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *               isAdmin:
 *                 type: boolean
 *                 description: Register as staff member (admin)
 *                 default: false
 *     responses:
 *       201:
 *         description: User registered successfully, email confirmation required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 requiresEmailConfirmation:
 *                   type: boolean
 *                 emailSent:
 *                   type: boolean
 *       409:
 *         description: User already exists
 *       400:
 *         description: Invalid input data
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, isAdmin } = req.body;

  // Determine which collection to use
  const isStaff = isAdmin === true;

  // Check if user already exists in either collection
  const existingUser = await User.findOne({ email });
  const existingStaff = await Staff.findOne({ email });

  if (existingUser || existingStaff) {
    throw new AppError('User with this email already exists', 409);
  }

  let user: any;
  if (isStaff) {
    // Create new staff member
    user = new Staff({
      email,
      password,
      firstName,
      lastName
    });
  } else {
    // Create new user
    user = new User({
      email,
      password,
      firstName,
      lastName
    });
  }

  // Generate email confirmation token
  const confirmationToken = crypto.randomBytes(32).toString('hex');
  
  // Store confirmation token directly in user document
  user.emailConfirmationToken = confirmationToken;
  user.emailConfirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  await user.save();

  // Send confirmation email
  try {
    await emailService.sendEmail({
      to: user.email,
      subject: 'Confirm Your Account - Action Required',
      html: emailService.generateConfirmationEmail(user.email, confirmationToken, isStaff)
    });
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    // Don't fail registration if email fails, but log the error
  }

  res.status(201).json({
    message: 'Registration successful! Please check your email to confirm your account.',
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    },
    requiresEmailConfirmation: true,
    emailSent: true
  });
}));

/**
 * @swagger
 * /api/auth/confirm-email:
 *   post:
 *     summary: Confirm email address
 *     description: Confirm user's email address using the token sent via email
 *     tags: [Authentication]
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
 *                 description: Confirmation token received via email
 *               isAdmin:
 *                 type: boolean
 *                 description: Whether confirming a staff member account
 *                 default: false
 *     responses:
 *       200:
 *         description: Email confirmed successfully
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: Token not found
 */
router.post('/confirm-email', asyncHandler(async (req: Request, res: Response) => {
  const { token, isAdmin } = req.body;

  if (!token) {
    throw new AppError('Confirmation token is required', 400);
  }

  // Determine which collection to use based on isAdmin flag
  let foundUser: any;

  if (isAdmin) {
    // Search in Staff collection
    foundUser = await Staff.findOne({
      emailConfirmationToken: token,
      emailConfirmationExpires: { $gt: new Date() }
    });
  } else {
    // Search in User collection
    foundUser = await User.findOne({
      emailConfirmationToken: token,
      emailConfirmationExpires: { $gt: new Date() }
    });
  }

  if (!foundUser) {
    throw new AppError('Invalid or expired confirmation token', 400);
  }

  // Update user's email verification status and clear confirmation token
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
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *               isAdmin:
 *                 type: boolean
 *                 description: Login as staff member (admin)
 *                 default: false
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Invalid input data
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, isAdmin } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Determine which collection to use
  const isStaff = isAdmin === true;
  let user: any;

  if (isStaff) {
    // Look up in Staff collection
    user = await Staff.findOne({ email }).select('+password');
  } else {
    // Look up in User collection
    user = await User.findOne({ email }).select('+password');
  }

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role as 'user' | 'staff' | 'admin' | 'owner' | 'manager',
    isAdmin: isStaff
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = user.generateRefreshToken();
  await user.save();

  // Store refresh token in database
  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
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
      ...(isStaff && {
        managedStore: user.managedStore,
        workingStore: user.workingStore,
        isOwner: user.isOwner,
        employeeId: user.employeeId,
        position: user.position,
        hireDate: user.hireDate,
        salary: user.salary
      })
    }
  });
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
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
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
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

  // Get user from token document
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

  // Generate new tokens
  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role as 'user' | 'staff' | 'admin' | 'owner' | 'manager',
    isAdmin: req.headers['x-is-admin'] === 'true'
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = user.generateRefreshToken();
  await user.save();

  // Update refresh token in database
  tokenDoc.token = newRefreshToken;
  tokenDoc.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await tokenDoc.save();

  res.json({
    message: 'Token refreshed successfully',
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and invalidate refresh token
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
 *                 description: Refresh token to invalidate
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove refresh token from database
    await RefreshToken.deleteOne({ token: refreshToken });

    // Remove refresh token from user document
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

  res.json({
    message: 'Logout successful'
  });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get the profile of the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
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
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  // Include staff-specific fields if user is staff
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

  res.json({
    user: userResponse
  });
}));

export default router;