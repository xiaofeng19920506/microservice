import { Request, Response } from "express";
import { IApiResponse, IUser, IStaff } from "../../../types";

// Mock user data
const users: IUser[] = [
  {
    _id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "hashed",
    role: "user",
    addresses: [],
  },
  {
    _id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    password: "hashed",
    role: "user",
    addresses: [],
  },
  {
    _id: "3",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob@example.com",
    password: "hashed",
    role: "user",
    addresses: [],
  },
];

// Mock staff data
const staff: IStaff[] = [
  {
    _id: "1",
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "hashed",
    role: "admin",
    workingStore: [],
    managedStore: [],
    ownedStore: [],
  },
  {
    _id: "2",
    firstName: "Manager",
    lastName: "User",
    email: "manager@example.com",
    password: "hashed",
    role: "manager",
    workingStore: [],
    managedStore: [],
    ownedStore: [],
  },
];

// Get all users
export const getAllUsers = (req: Request, res: Response) => {
  const response: IApiResponse<IUser[]> = {
    success: true,
    data: users,
    count: users.length,
  };
  res.json(response);
};

// Get user by ID
export const getUserById = (req: Request, res: Response): Response | void => {
  const userId = req.params.id;
  const user = users.find((u) => u._id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const response: IApiResponse<IUser> = {
    success: true,
    data: user,
  };
  res.json(response);
};

// Create new user
export const createUser = (req: Request, res: Response): Response | void => {
  const { firstName, lastName, email, role = "user" } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, and email are required",
    });
  }

  const newUser: IUser = {
    _id: (users.length + 1).toString(),
    firstName,
    lastName,
    email,
    password: "hashed", // In real app, this would be hashed
    role: "user",
    addresses: [],
  };

  users.push(newUser);

  const response: IApiResponse<IUser> = {
    success: true,
    data: newUser,
    message: "User created successfully",
  };

  res.status(201).json(response);
};

// Update user
export const updateUser = (req: Request, res: Response): Response | void => {
  const userId = req.params.id;
  const userIndex = users.findIndex((u) => u._id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const { firstName, lastName, email, role } = req.body;
  users[userIndex] = {
    ...users[userIndex],
    firstName,
    lastName,
    email,
    role,
    password: users[userIndex]?.password || "hashed",
    addresses: users[userIndex]?.addresses || [],
  };

  const response: IApiResponse<IUser> = {
    success: true,
    data: users[userIndex],
    message: "User updated successfully",
  };

  res.json(response);
};

// Delete user
export const deleteUser = (req: Request, res: Response): Response | void => {
  const userId = req.params.id;
  const userIndex = users.findIndex((u) => u._id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  users.splice(userIndex, 1);

  const response: IApiResponse = {
    success: true,
    message: "User deleted successfully",
  };

  res.json(response);
};

// Get all staff members (admin only)
export const getAllStaff = (req: Request, res: Response) => {
  const response: IApiResponse<IStaff[]> = {
    success: true,
    data: staff,
    count: staff.length,
    message: "Staff list retrieved successfully",
  };
  res.json(response);
};

// Get staff member by ID (admin only)
export const getStaffById = (req: Request, res: Response): Response | void => {
  const staffId = req.params.id;
  const staffMember = staff.find((s) => s._id === staffId);

  if (!staffMember) {
    return res.status(404).json({
      success: false,
      message: "Staff member not found",
    });
  }

  const response: IApiResponse<IStaff> = {
    success: true,
    data: staffMember,
    message: "Staff member retrieved successfully",
  };
  res.json(response);
};

// Update staff member (admin only)
export const updateStaff = (req: Request, res: Response): Response | void => {
  const staffId = req.params.id;
  const staffIndex = staff.findIndex((s) => s._id === staffId);

  if (staffIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Staff member not found",
    });
  }

  const {
    firstName,
    lastName,
    email,
    role,
    workingStore,
    managedStore,
    ownedStore,
    permissions,
    isActive,
  } = req.body;

  // Update staff member
  if (staff[staffIndex]) {
    if (firstName) staff[staffIndex].firstName = firstName;
    if (lastName) staff[staffIndex].lastName = lastName;
    if (email) staff[staffIndex].email = email;
    if (role) staff[staffIndex].role = role;
    if (workingStore) staff[staffIndex].workingStore = workingStore;
    if (managedStore) staff[staffIndex].managedStore = managedStore;
    if (ownedStore) staff[staffIndex].ownedStore = ownedStore;
    if (typeof isActive === "boolean") staff[staffIndex].isActive = isActive;
  }

  const response: IApiResponse<IStaff> = {
    success: true,
    data: staff[staffIndex],
    message: "Staff member updated successfully",
  };
  res.json(response);
};

// Delete staff member (admin only)
export const deleteStaff = (req: Request, res: Response): Response | void => {
  const staffId = req.params.id;
  const staffIndex = staff.findIndex((s) => s._id === staffId);

  if (staffIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Staff member not found",
    });
  }

  staff.splice(staffIndex, 1);

  const response: IApiResponse = {
    success: true,
    message: "Staff member deleted successfully",
  };
  res.json(response);
};

// Get all users (admin only)
export const getAllUsersAdmin = (req: Request, res: Response) => {
  const response: IApiResponse<IUser[]> = {
    success: true,
    data: users,
    count: users.length,
    message: "Users list retrieved successfully",
  };
  res.json(response);
};
