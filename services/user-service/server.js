const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock user data
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
];

// Mock staff data
const staff = [
  { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin', department: 'IT', position: 'System Administrator', permissions: ['read', 'write', 'delete', 'admin'] },
  { id: 2, name: 'Manager User', email: 'manager@example.com', role: 'manager', department: 'Sales', position: 'Sales Manager', permissions: ['read', 'write'] }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Admin staff middleware
const requireAdminStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.userType !== 'staff' || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin staff access required'
    });
  }

  next();
};

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'User Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users,
    count: users.length
  });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Create new user
app.post('/api/users', (req, res) => {
  const { name, email, role = 'user' } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
    role
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  });
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const { name, email, role } = req.body;
  users[userIndex] = { ...users[userIndex], name, email, role };
  
  res.json({
    success: true,
    data: users[userIndex],
    message: 'User updated successfully'
  });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  users.splice(userIndex, 1);
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// ==================== STAFF MANAGEMENT ENDPOINTS ====================

// Get all staff members (admin only)
app.get('/api/users/staff', authenticateToken, requireAdminStaff, (req, res) => {
  res.json({
    success: true,
    data: staff,
    count: staff.length,
    message: 'Staff list retrieved successfully'
  });
});

// Get staff member by ID (admin only)
app.get('/api/users/staff/:id', authenticateToken, requireAdminStaff, (req, res) => {
  const staffId = parseInt(req.params.id);
  const staffMember = staff.find(s => s.id === staffId);
  
  if (!staffMember) {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  res.json({
    success: true,
    data: staffMember,
    message: 'Staff member retrieved successfully'
  });
});

// Update staff member (admin only)
app.put('/api/users/staff/:id', authenticateToken, requireAdminStaff, (req, res) => {
  const staffId = parseInt(req.params.id);
  const staffIndex = staff.findIndex(s => s.id === staffId);
  
  if (staffIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  const { name, email, role, department, position, permissions, isActive } = req.body;
  
  // Update staff member
  if (name) staff[staffIndex].name = name;
  if (email) staff[staffIndex].email = email;
  if (role) staff[staffIndex].role = role;
  if (department) staff[staffIndex].department = department;
  if (position) staff[staffIndex].position = position;
  if (permissions) staff[staffIndex].permissions = permissions;
  if (typeof isActive === 'boolean') staff[staffIndex].isActive = isActive;

  res.json({
    success: true,
    data: staff[staffIndex],
    message: 'Staff member updated successfully'
  });
});

// Delete staff member (admin only)
app.delete('/api/users/staff/:id', authenticateToken, requireAdminStaff, (req, res) => {
  const staffId = parseInt(req.params.id);
  const staffIndex = staff.findIndex(s => s.id === staffId);
  
  if (staffIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  staff.splice(staffIndex, 1);

  res.json({
    success: true,
    message: 'Staff member deleted successfully'
  });
});

// Get all users (admin only)
app.get('/api/users/all', authenticateToken, requireAdminStaff, (req, res) => {
  res.json({
    success: true,
    data: users,
    count: users.length,
    message: 'Users list retrieved successfully'
  });
});

// Note: Authentication endpoints have been moved to the dedicated auth service

// Error handling
app.use((err, req, res, next) => {
  console.error('User Service Error:', err);
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
  console.log(`👤 User Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
