import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Staff from "../models/Staff";
import { IApiResponse, IJWTPayload } from "../../../types";
import emailService from "../services/emailService";

// Register controller
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, isAdmin = false } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    const existingStaff = await Staff.findOne({ email });

    if (existingUser || existingStaff) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let newUser;
    let userType: "user" | "staff";

    if (isAdmin) {
      // Create staff member
      newUser = new Staff({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "admin",
        workingStore: [],
        managedStore: [],
        ownedStore: [],
      });
      userType = "staff";
    } else {
      // Create regular user
      newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "user",
        addresses: [],
      });
      userType = "user";
    }

    await newUser.save();

    // Generate JWT token
    const tokenPayload: IJWTPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      userType,
      role: newUser.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(
      { userId: newUser._id.toString() },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, firstName);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail registration if email fails
    }

    const response: IApiResponse<any> = {
      success: true,
      data: {
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          userType,
        },
        token,
        refreshToken,
      },
      message: "User registered successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user in both User and Staff collections
    let user = await User.findOne({ email });
    let userType: "user" | "staff" = "user";

    if (!user) {
      user = await Staff.findOne({ email });
      userType = "staff";
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const tokenPayload: IJWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      userType,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    const response: IApiResponse<any> = {
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          userType,
        },
        token,
        refreshToken,
      },
      message: "Login successful",
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Refresh token controller
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { userId: string };

    // Find user
    let user = await User.findById(decoded.userId);
    let userType: "user" | "staff" = "user";

    if (!user) {
      user = await Staff.findById(decoded.userId);
      userType = "staff";
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new access token
    const tokenPayload: IJWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      userType,
      role: user.role,
    };

    const newToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const response: IApiResponse<any> = {
      success: true,
      data: {
        token: newToken,
      },
      message: "Token refreshed successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};
