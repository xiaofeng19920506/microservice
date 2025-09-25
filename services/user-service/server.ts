import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IApiResponse, IJWTPayload, IUser, IStaff } from '../../types';
require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.USER_SERVICE_PORT || '3001');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock user data
const users: IUser[] = [
  { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'hashed', role: 'user', addresses: [] },
  { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', password: 'hashed', role: 'user', addresses: [] },
  { _id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', password: 'hashed', role: 'user', addresses: [] }
];

// Mock staff data
const staff: IStaff[] = [
  { 
    _id: '1', 
    firstName: 'Admin', 
    lastName: 'User', 
    email: 'admin@example.com', 
    password: 'hashed', 
    role: 'admin', 
    workingStore: [], 
    managedStore: [], 
    ownedStore: [], 
    permissions: ['read', 'write', 'delete', 'admin'],
    addresses: []
  },
  { 
    _id: '2', 
    firstName: 'Manager', 
    lastName: 'User', 
    email: 'manager@example.com', 
    password: 'hashed', 
    role: 'manager', 
    workingStore: [], 
    managedStore: [], 
    ownedStore: [], 
    permissions: ['read', 'write'],
    addresses: []
  }
];

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
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
const requireAdminStaff = (req: Request, res: Response, next: NextFunction) => {
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
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'User Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all users
app.get('/api/users', (req: Request, res: Response) => {
  const response: IApiResponse<IUser[]> = {
    success: true,
    data: users,
    count: users.length
  };
  res.json(response);
});

// Get user by ID
app.get('/api/users/:id', (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = users.find(u => u._id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const response: IApiResponse<IUser> = {
    success: true,
    data: user
  };
  res.json(response);
});

// Create new user
app.post('/api/users', (req: Request, res: Response) => {
  const { firstName, lastName, email, role = 'user' } = req.body;
  
  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name, and email are required'
    });
  }
  
  const newUser: IUser = {
    _id: (users.length + 1).toString(),
    firstName,
    lastName,
    email,
    password: 'hashed', // In real app, this would be hashed
    role: 'user',
    addresses: []
  };
  
  users.push(newUser);
  
  const response: IApiResponse<IUser> = {
    success: true,
    data: newUser,
    message: 'User created successfully'
  };
  
  res.status(201).json(response);
});

// Update user
app.put('/api/users/:id', (req: Request, res: Response) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u._id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const { firstName, lastName, email, role } = req.body;
  users[userIndex] = { ...users[userIndex], firstName, lastName, email, role };
  
  const response: IApiResponse<IUser> = {
    success: true,
    data: users[userIndex],
    message: 'User updated successfully'
  };
  
  res.json(response);
});

// Delete user
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u._id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  users.splice(userIndex, 1);
  
  const response: IApiResponse = {
    success: true,
    message: 'User deleted successfully'
  };
  
  res.json(response);
});

// ==================== STAFF MANAGEMENT ENDPOINTS ====================

// Get all staff members (admin only)
app.get('/api/users/staff', authenticateToken, requireAdminStaff, (req: Request, res: Response) => {
  const response: IApiResponse<IStaff[]> = {
    success: true,
    data: staff,
    count: staff.length,
    message: 'Staff list retrieved successfully'
  };
  res.json(response);
});

// Get staff member by ID (admin only)
app.get('/api/users/staff/:id', authenticateToken, requireAdminStaff, (req: Request, res: Response) => {
  const staffId = req.params.id;
  const staffMember = staff.find(s => s._id === staffId);
  
  if (!staffMember) {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  const response: IApiResponse<IStaff> = {
    success: true,
    data: staffMember,
    message: 'Staff member retrieved successfully'
  };
  res.json(response);
});

// Update staff member (admin only)
app.put('/api/users/staff/:id', authenticateToken, requireAdminStaff, (req: Request, res: Response) => {
  const staffId = req.params.id;
  const staffIndex = staff.findIndex(s => s._id === staffId);
  
  if (staffIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  const { firstName, lastName, email, role, workingStore, managedStore, ownedStore, permissions, isActive } = req.body;
  
  // Update staff member
  if (firstName) staff[staffIndex].firstName = firstName;
  if (lastName) staff[staffIndex].lastName = lastName;
  if (email) staff[staffIndex].email = email;
  if (role) staff[staffIndex].role = role;
  if (workingStore) staff[staffIndex].workingStore = workingStore;
  if (managedStore) staff[staffIndex].managedStore = managedStore;
  if (ownedStore) staff[staffIndex].ownedStore = ownedStore;
  if (permissions) staff[staffIndex].permissions = permissions;
  if (typeof isActive === 'boolean') staff[staffIndex].isActive = isActive;

  const response: IApiResponse<IStaff> = {
    success: true,
    data: staff[staffIndex],
    message: 'Staff member updated successfully'
  };
  res.json(response);
});

// Delete staff member (admin only)
app.delete('/api/users/staff/:id', authenticateToken, requireAdminStaff, (req: Request, res: Response) => {
  const staffId = req.params.id;
  const staffIndex = staff.findIndex(s => s._id === staffId);
  
  if (staffIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  staff.splice(staffIndex, 1);

  const response: IApiResponse = {
    success: true,
    message: 'Staff member deleted successfully'
  };
  res.json(response);
});

// Get all users (admin only)
app.get('/api/users/all', authenticateToken, requireAdminStaff, (req: Request, res: Response) => {
  const response: IApiResponse<IUser[]> = {
    success: true,
    data: users,
    count: users.length,
    message: 'Users list retrieved successfully'
  };
  res.json(response);
});

// Note: Authentication endpoints have been moved to the dedicated auth service

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('User Service Error:', err);
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
  console.log(`👤 User Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
