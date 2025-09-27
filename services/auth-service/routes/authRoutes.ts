import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, refreshToken } from "../controllers/authController";
import { authenticateToken, requireStaff } from "../middleware/authMiddleware";

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
});

// Public routes
router.post("/api/auth/register", authLimiter, register);
router.post("/api/auth/login", authLimiter, login);
router.post("/api/auth/refresh", refreshToken);

// Protected routes
router.get("/api/auth/profile", authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
    message: "Profile retrieved successfully",
  });
});

// Admin only routes
router.get("/api/auth/admin/users", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Admin users endpoint - implement as needed",
  });
});

// Staff only routes
router.get(
  "/api/auth/staff/dashboard",
  authenticateToken,
  requireStaff,
  (req, res) => {
    res.json({
      success: true,
      message: "Staff dashboard endpoint - implement as needed",
    });
  }
);

export default router;
