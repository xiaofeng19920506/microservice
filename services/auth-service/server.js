const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const User = require('./models/User');
const Staff = require('./models/Staff');
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
const refreshTokens = new Map();

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Auth Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Generate JWT tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    userType: user.userType,
    permissions: user.permissions || []
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
};

// Register new user (regular or staff based on isAdmin flag)
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, role, department, position, permissions = [], isAdmin = false } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
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
      if (!role || !department || !position) {
        return res.status(400).json({
          success: false,
          message: 'Role, department, and position are required for staff registration'
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
        name,
        email,
        password: hashedPassword,
        role: role || 'employee',
        department,
        position,
        permissions
      });

      await newStaff.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(newStaff);
      refreshTokens.set(refreshToken, newStaff._id.toString());

      res.status(201).json({
        success: true,
        data: {
          staff: newStaff.toJSON(),
          accessToken,
          refreshToken
        },
        message: 'Staff member registered successfully'
      });
    } else {
      // Create new regular user
      const newUser = new User({
        name,
        email,
        password: hashedPassword
      });

      await newUser.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(newUser);
      refreshTokens.set(refreshToken, newUser._id.toString());

      res.status(201).json({
        success: true,
        data: {
          user: newUser.toJSON(),
          accessToken,
          refreshToken
        },
        message: 'User registered successfully'
      });
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
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password, isAdmin = false } = req.body;

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

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh access token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userId = refreshTokens.get(refreshToken);

    if (!userId || userId !== decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user in both collections
    let user = await User.findOne({ _id: userId, isActive: true });
    if (!user) {
      user = await Staff.findOne({ _id: userId, isActive: true });
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
    refreshTokens.set(newRefreshToken, user.id);

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
app.post('/api/auth/logout', async (req, res) => {
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
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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

// Note: Profile management has been moved to the user service

// Change password
app.put('/api/auth/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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

// Note: Staff management endpoints have been moved to the user service

// Error handling
app.use((err, req, res, next) => {
  console.error('Auth Service Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
