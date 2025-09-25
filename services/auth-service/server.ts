import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database';
import User from './models/User';
import Staff from './models/Staff';
import { IAuthRequest, IRegisterRequest, ILoginResponse, IRegisterResponse, IApiResponse, IJWTPayload } from '../../types';
require('dotenv').config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 12004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

// Connect to MongoDB
connectDB();

// Refresh tokens storage (in production, use Redis)
const refreshTokens = new Map<string, string>();

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'Auth Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Generate JWT tokens
const generateTokens = (user: any): { accessToken: string; refreshToken: string } => {
  const payload: IJWTPayload = {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    userType: user.userType || (user.workingStore ? 'staff' : 'customer'),
    permissions: user.permissions || []
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m'
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
};

// Register new user (regular or staff based on isAdmin flag)
app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role, workingStore, managedStore, ownedStore, permissions = [], isAdmin = false }: IRegisterRequest = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Additional validation for staff registration
    if (isAdmin) {
      if (!role || !workingStore || workingStore.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Role and at least one working store are required for staff registration'
        });
      }
    }

    // Check if user already exists in both collections
    const existingUser = await User.findOne({ email });
    const existingStaff = await Staff.findOne({ email });
    
    if (existingUser || existingStaff) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (isAdmin) {
      // Create new staff member
      const newStaff = new Staff({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'employee',
        workingStore: workingStore || [],
        managedStore: managedStore || [],
        ownedStore: ownedStore || [],
        permissions
      });

      await newStaff.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(newStaff);
      refreshTokens.set(refreshToken, newStaff._id.toString());

      const response: IRegisterResponse = {
        success: true,
        data: {
          staff: newStaff.toJSON(),
          accessToken,
          refreshToken
        },
        message: 'Staff member registered successfully'
      };

      res.status(201).json(response);
    } else {
      // Create new regular user
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword
      });

      await newUser.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(newUser);
      refreshTokens.set(refreshToken, newUser._id.toString());

      const response: IRegisterResponse = {
        success: true,
        data: {
          user: newUser.toJSON(),
          accessToken,
          refreshToken
        },
        message: 'User registered successfully'
      };

      res.status(201).json(response);
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user (regular or staff based on isAdmin flag)
app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, isAdmin = false }: IAuthRequest = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    let user = null;

    if (isAdmin) {
      // Look for staff member
      user = await Staff.findOne({ email, isActive: true });
    } else {
      // Look for regular user
      user = await User.findOne({ email, isActive: true });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    refreshTokens.set(refreshToken, user._id.toString());

    const response: ILoginResponse = {
      success: true,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      },
      message: 'Login successful'
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh access token
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as IJWTPayload;
    const userId = refreshTokens.get(refreshToken);

    if (!userId || userId !== decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user in both collections
    let user = await User.findOne({ _id: decoded.id, isActive: true });
    if (!user) {
      user = await Staff.findOne({ _id: decoded.id, isActive: true });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // Remove old refresh token and add new one
    refreshTokens.delete(refreshToken);
    refreshTokens.set(newRefreshToken, user._id.toString());

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Logout user
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint
app.post('/api/auth/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
    
    // Find user in both collections
    let user = await User.findOne({ _id: decoded.id, isActive: true });
    if (!user) {
      user = await Staff.findOne({ _id: decoded.id, isActive: true });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        valid: true
      },
      message: 'Token is valid'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Change password
app.put('/api/auth/change-password', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
    
    // Find user in both collections
    let user = await User.findOne({ _id: decoded.id, isActive: true });
    if (!user) {
      user = await Staff.findOne({ _id: decoded.id, isActive: true });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Note: Profile management has been moved to the user service

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Auth Service Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
