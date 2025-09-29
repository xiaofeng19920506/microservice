import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import { addressValidationService } from '../services/addressValidationService';
import crypto from 'crypto';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user or staff member
 *     description: Creates a new user account or staff member account with contact information and address details. Addresses are validated using Radar Address Validation API to ensure accuracy.
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
 *               - firstName
 *               - lastName
 *               - phoneNumber
 *               - address
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password (minimum 6 characters)
 *                 example: "SecurePass123!"
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+1 (555) 123-4567"
 *               address:
 *                 type: object
 *                 description: User's address information
 *                 required:
 *                   - streetAddress
 *                   - city
 *                   - stateProvince
 *                   - zipCode
 *                 properties:
 *                   streetAddress:
 *                     type: string
 *                     description: Street address
 *                     example: "123 Main Street, Apt 4B"
 *                   city:
 *                     type: string
 *                     description: City name
 *                     example: "New York"
 *                   stateProvince:
 *                     type: string
 *                     description: State or Province
 *                     example: "NY"
 *                   zipCode:
 *                     type: string
 *                     description: ZIP or postal code
 *                     example: "10001"
 *               isAdmin:
 *                 type: boolean
 *                 description: Whether to create a staff/admin account instead of regular user
 *                 default: false
 *                 example: false
 *           examples:
 *             regular_user:
 *               summary: Regular user registration
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "SecurePass123!"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 phoneNumber: "+1 (555) 123-4567"
 *                 address:
 *                   streetAddress: "123 Main Street, Apt 4B"
 *                   city: "New York"
 *                   stateProvince: "NY"
 *                   zipCode: "10001"
 *                 isAdmin: false
 *             staff_user:
 *               summary: Staff user registration
 *               value:
 *                 email: "admin@company.com"
 *                 password: "AdminPass123!"
 *                 firstName: "Jane"
 *                 lastName: "Smith"
 *                 phoneNumber: "+1 (555) 987-6543"
 *                 address:
 *                   streetAddress: "456 Business Ave"
 *                   city: "Los Angeles"
 *                   stateProvince: "CA"
 *                   zipCode: "90210"
 *                 isAdmin: true
 *     responses:
 *       201:
 *         description: Registration successful - email confirmation sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registration successful! Please check your email to confirm your account."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1 (555) 123-4567"
 *                     address:
 *                       type: object
 *                       properties:
 *                         streetAddress:
 *                           type: string
 *                           example: "123 Main Street, Apt 4B"
 *                         city:
 *                           type: string
 *                           example: "New York"
 *                         stateProvince:
 *                           type: string
 *                           example: "NY"
 *                         zipCode:
 *                           type: string
 *                           example: "10001"
 *                     role:
 *                       type: string
 *                       enum: [user, staff, admin, owner, manager]
 *                       example: "user"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T10:30:00.000Z"
 *                 requiresEmailConfirmation:
 *                   type: boolean
 *                   example: true
 *                 emailSent:
 *                   type: boolean
 *                   example: true
 *                 addressValidation:
 *                   type: object
 *                   description: Address validation results from Radar API
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *                     formattedAddress:
 *                       type: string
 *                       description: Standardized address format from Radar
 *                       example: "123 Main St, Apt 4B, New York, NY 10001, USA"
 *                     confidence:
 *                       type: string
 *                       enum: [high, medium, low]
 *                       description: Confidence level of address validation
 *                       example: "high"
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
 *                   example: "Email, password, firstName, lastName, phoneNumber, and address are required"
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *           examples:
 *             missing_fields:
 *               summary: Missing required fields
 *               value:
 *                 error: "Validation error"
 *                 message: "Email, password, firstName, lastName, phoneNumber, and address are required"
 *                 statusCode: 400
 *             invalid_address:
 *               summary: Invalid address validation
 *               value:
 *                 error: "Address Validation Failed"
 *                 message: "Invalid address: Address not found"
 *                 statusCode: 400
 *                 addressValidation:
 *                   isValid: false
 *                   error: "Address not found"
 *                   providedAddress:
 *                     streetAddress: "123 Invalid St"
 *                     city: "Invalid City"
 *                     stateProvince: "XX"
 *                     zipCode: "00000"
 *             incomplete_address:
 *               summary: Incomplete address fields
 *               value:
 *                 error: "Validation error"
 *                 message: "All address fields (streetAddress, city, stateProvince, zipCode) are required"
 *                 statusCode: 400
 *             validation_service_error:
 *               summary: Address validation service error
 *               value:
 *                 error: "Address Validation Service Error"
 *                 message: "Address validation service is currently unavailable. Please try again later."
 *                 statusCode: 400
 *                 addressValidation:
 *                   isValid: false
 *                   error: "Validation service unavailable"
 *                   providedAddress:
 *                     streetAddress: "123 Main St"
 *                     city: "New York"
 *                     stateProvince: "NY"
 *                     zipCode: "10001"
 *       409:
 *         description: Conflict - user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Conflict"
 *                 message:
 *                   type: string
 *                   example: "User with this email already exists"
 *                 statusCode:
 *                   type: integer
 *                   example: 409
 *       500:
 *         description: Internal server error or email service error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email Service Error"
 *                 message:
 *                   type: string
 *                   example: "Registration was successful, but we could not send the confirmation email. Please contact support."
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 *                 user:
 *                   type: object
 *                   description: User data that was successfully created
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1 (555) 123-4567"
 *                     address:
 *                       type: object
 *                       properties:
 *                         streetAddress:
 *                           type: string
 *                           example: "123 Main Street"
 *                         city:
 *                           type: string
 *                           example: "New York"
 *                         stateProvince:
 *                           type: string
 *                           example: "NY"
 *                         zipCode:
 *                           type: string
 *                           example: "10001"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T10:30:00.000Z"
 *                 emailError:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to send confirmation email"
 *                     requiresManualConfirmation:
 *                       type: boolean
 *                       example: true
 *           examples:
 *             email_service_error:
 *               summary: Email service failure
 *               value:
 *                 error: "Email Service Error"
 *                 message: "Registration was successful, but we could not send the confirmation email. Please contact support."
 *                 statusCode: 500
 *                 user:
 *                   id: "507f1f77bcf86cd799439011"
 *                   email: "user@example.com"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   phoneNumber: "+1 (555) 123-4567"
 *                   address:
 *                     streetAddress: "123 Main Street"
 *                     city: "New York"
 *                     stateProvince: "NY"
 *                     zipCode: "10001"
 *                   role: "user"
 *                   isEmailVerified: false
 *                   createdAt: "2023-12-01T10:30:00.000Z"
 *                 emailError:
 *                   message: "Failed to send confirmation email"
 *                   requiresManualConfirmation: true
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phoneNumber, address, isAdmin } = req.body;
  
  // Validate required fields
  if (!email || !password || !firstName || !lastName || !phoneNumber || !address) {
    throw new AppError('Email, password, firstName, lastName, phoneNumber, and address are required', 400);
  }

  // Validate address fields
  if (!address.streetAddress || !address.city || !address.stateProvince || !address.zipCode) {
    throw new AppError('All address fields (streetAddress, city, stateProvince, zipCode) are required', 400);
  }

  // Validate address using Radar API
  console.log('Starting address validation for:', address);
  let addressValidation;
  
  try {
    // Check if address validation service is configured
    if (!addressValidationService.isConfigured()) {
      console.warn('⚠️ Address validation service not configured. Skipping validation.');
      addressValidation = {
        isValid: true,
        formattedAddress: `${address.streetAddress}, ${address.city}, ${address.stateProvince} ${address.zipCode}`,
        confidence: 'not_configured'
      };
    } else {
      console.log('Validating address with Radar API...');
      addressValidation = await addressValidationService.validateAddress(address);
      console.log('Address validation result:', addressValidation);
    }
  } catch (validationError) {
    console.error('Address validation error:', validationError);
  }

  // Check validation result and return early error response if validation fails
  if (!addressValidation.isValid) {
    return res.status(400).json({
      error: 'Address Validation Failed',
      message: `Invalid address: ${addressValidation.error}`,
      statusCode: 400,
      addressValidation: {
        isValid: false,
        error: addressValidation.error,
        providedAddress: {
          streetAddress: address.streetAddress,
          city: address.city,
          stateProvince: address.stateProvince,
          zipCode: address.zipCode
        }
      }
    });
  }

  const existingUser = await User.findOne({ email });
  const existingStaff = await Staff.findOne({ email });
  if (existingUser || existingStaff) {
    throw new AppError('User with this email already exists', 409);
  }

  let user: any;
  if (isAdmin) {
    user = new Staff({ email, password, firstName, lastName, phoneNumber, address });
  } else {
    user = new User({ email, password, firstName, lastName, phoneNumber, address });
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
    
    // Return early error response if email sending fails
    return res.status(500).json({
      error: 'Email Service Error',
      message: 'Registration was successful, but we could not send the confirmation email. Please contact support.',
      statusCode: 500,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      emailError: {
        message: 'Failed to send confirmation email',
        requiresManualConfirmation: true
      }
    });
  }

  res.status(201).json({
    message: 'Registration successful! Please check your email to confirm your account.',
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    },
    requiresEmailConfirmation: true,
    emailSent: true,
    addressValidation: {
      isValid: addressValidation.isValid,
      formattedAddress: addressValidation.formattedAddress,
      confidence: addressValidation.confidence
    }
  });
}));

export { router as registerRoutes };
