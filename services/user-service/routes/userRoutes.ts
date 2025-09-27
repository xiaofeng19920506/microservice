import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getAllUsersAdmin,
} from "../controllers/userController";
import {
  authenticateToken,
  requireAdminStaff,
} from "../middleware/authMiddleware";

const router = express.Router();

// Public user routes
router.get("/api/users", getAllUsers);
router.get("/api/users/:id", getUserById);
router.post("/api/users", createUser);
router.put("/api/users/:id", updateUser);
router.delete("/api/users/:id", deleteUser);

// Admin-only staff routes
router.get(
  "/api/users/staff",
  authenticateToken,
  requireAdminStaff,
  getAllStaff
);
router.get(
  "/api/users/staff/:id",
  authenticateToken,
  requireAdminStaff,
  getStaffById
);
router.put(
  "/api/users/staff/:id",
  authenticateToken,
  requireAdminStaff,
  updateStaff
);
router.delete(
  "/api/users/staff/:id",
  authenticateToken,
  requireAdminStaff,
  deleteStaff
);

// Admin-only user routes
router.get(
  "/api/users/all",
  authenticateToken,
  requireAdminStaff,
  getAllUsersAdmin
);

export default router;
