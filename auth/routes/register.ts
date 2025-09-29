import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import crypto from 'crypto';

const router = Router();

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, isAdmin } = req.body;
  const existingUser = await User.findOne({ email });
  const existingStaff = await Staff.findOne({ email });
  if (existingUser || existingStaff) {
    throw new AppError('User with this email already exists', 409);
  }

  let user: any;
  if (isAdmin) {
    user = new Staff({ email, password, firstName, lastName });
  } else {
    user = new User({ email, password, firstName, lastName });
  }

  const confirmationToken = crypto.randomBytes(32).toString('hex');
  user.emailConfirmationToken = confirmationToken;
  user.emailConfirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  try {
    await emailService.sendEmail({
      to: user.email,
      subject: 'Confirm Your Account - Action Required',
      html: emailService.generateConfirmationEmail(user.email, confirmationToken, isAdmin)
    });
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
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

export { router as registerRoutes };
