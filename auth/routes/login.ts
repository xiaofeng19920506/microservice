import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { RefreshToken } from '../models/RefreshToken';
import { generateAccessToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User authentication and login
 *     description: Authenticates a user or staff member and returns JWT access token and refresh token for API access
 *     tags: [Auth]
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
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "SecurePass123!"
 *               isAdmin:
 *                 type: boolean
 *                 description: Set to true for staff/admin login, false for regular user login
 *                 default: false
 *                 example: false
 *           examples:
 *             regular_user:
 *               summary: Regular user login
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "SecurePass123!"
 *                 isAdmin: false
 *             staff_user:
 *               summary: Staff/admin user login
 *               value:
 *                 email: "admin@company.com"
 *                 password: "AdminPass123!"
 *                 isAdmin: true
 *     responses:
 *       200:
 *         description: Login successful - returns access token and user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token for API authentication
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1NzEyMzQ1Njc4OWFiY2RlZiIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3MDE5MjM0NTYsImV4cCI6MTcwMjE4MjY1Nn0.xyz123"
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token to obtain new access tokens
 *                   example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique user identifier
 *                       example: "657123456789abcdef"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john.doe@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     role:
 *                       type: string
 *                       enum: [user, staff, admin, owner, manager]
 *                       example: "user"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T10:30:00.000Z"
 *                     # Staff-specific fields (only returned for staff/admin accounts)
 *                     managedStore:
 *                       type: string
 *                       description: Store ID managed by staff (staff accounts only)
 *                       example: "store123"
 *                     workingStore:
 *                       type: string
 *                       description: Store ID where staff works (staff accounts only)
 *                       example: "store456"
 *                     isOwner:
 *                       type: boolean
 *                       description: Whether staff is store owner (staff accounts only)
 *                       example: false
 *                     employeeId:
 *                       type: string
 *                       description: Employee ID (staff accounts only)
 *                       example: "EMP001"
 *                     position:
 *                       type: string
 *                       description: Job position (staff accounts only)
 *                       example: "Manager"
 *             examples:
 *               regular_user_response:
 *                 summary: Regular user login response
 *                 value:
 *                   message: "Login successful"
 *                   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   refreshToken: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
 *                   user:
 *                     id: "657123456789abcdef"
 *                     email: "john.doe@example.com"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     role: "user"
 *                     isEmailVerified: true
 *                     lastLogin: "2023-12-01T10:30:00.000Z"
 *               staff_user_response:
 *                 summary: Staff user login response
 *                 value:
 *                   message: "Login successful"
 *                   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   refreshToken: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
 *                   user:
 *                     id: "657123456789abcdef"
 *                     email: "admin@company.com"
 *                     firstName: "Jane"
 *                     lastName: "Smith"
 *                     role: "admin"
 *                     isEmailVerified: true
 *                     lastLogin: "2023-12-01T10:30:00.000Z"
 *                     managedStore: "store123"
 *                     workingStore: "store456"
 *                     isOwner: false
 *                     employeeId: "EMP001"
 *                     position: "Manager"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error"
 *                 message:
 *                   type: string
 *                   example: "Email and password are required"
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *             examples:
 *               missing_email:
 *                 summary: Missing email
 *                 value:
 *                   error: "Validation error"
 *                   message: "Email and password are required"
 *                   statusCode: 400
 *               missing_password:
 *                 summary: Missing password
 *                 value:
 *                   error: "Validation error"
 *                   message: "Email and password are required"
 *                   statusCode: 400
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   example: "Invalid email or password"
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *             examples:
 *               invalid_credentials:
 *                 summary: Wrong email or password
 *                 value:
 *                   error: "Unauthorized"
 *                   message: "Invalid email or password"
 *                   statusCode: 401
 *               user_not_found:
 *                 summary: User doesn't exist
 *                 value:
 *                   error: "Unauthorized"
 *                   message: "Invalid email or password"
 *                   statusCode: 401
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
      phoneNumber: user.phoneNumber,
      address: user.address,
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
