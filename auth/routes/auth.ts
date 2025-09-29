import { Router, Request, Response } from 'express';
import { registerRoutes } from './register';
import { loginRoutes } from './login';
import { AuthenticatedRequest } from '../middleware/auth';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { RefreshToken } from '../models/RefreshToken';
import { generateAccessToken } from '../utils/jwt';

const router = Router();

// Import and use route modules
// ...existing code...
import { refreshRoutes } from './refresh';
import { logoutRoutes } from './logout';
import { meRoutes } from './me';
import { confirmEmailRoutes } from './confirmEmail';

router.use(registerRoutes);
router.use(loginRoutes);
router.use(refreshRoutes);
router.use(logoutRoutes);
router.use(meRoutes);
router.use(confirmEmailRoutes);

export default router;
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

export default router;