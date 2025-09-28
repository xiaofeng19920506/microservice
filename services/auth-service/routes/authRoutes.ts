import express from "express";
import { login, signup } from "../controllers/authController";

const router = express.Router();

// Auth routes
router.post("/login", login);
router.post("/register", signup);

export default router;

