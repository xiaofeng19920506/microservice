import express from "express";
import axios from "axios";
import {
  getApiInfo,
  getUnifiedApiInfo,
} from "../controllers/gatewayController";
import { gatewayAuthMiddleware } from "../middleware/gatewayAuth";

const router = express.Router();

// API information
router.get("/api", getApiInfo);

// Unified endpoints
router.get("/unified-api", getUnifiedApiInfo);

// Public auth endpoints - direct HTTP requests to auth service
router.post("/api/auth/register", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:12004/api/auth/register",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Auth Service Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Auth service is currently unavailable",
    });
  }
});

router.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:12004/api/auth/login",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Auth Service Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Auth service is currently unavailable",
    });
  }
});

router.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:12004/api/auth/forgot-password",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Auth Service Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Auth service is currently unavailable",
    });
  }
});

// Private auth endpoints - require authentication
router.get("/api/auth/profile", gatewayAuthMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      "http://localhost:12004/api/auth/profile",
      {
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Auth Service Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Auth service is currently unavailable",
    });
  }
});

router.post("/api/auth/logout", gatewayAuthMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:12004/api/auth/logout",
      req.body,
      {
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Auth Service Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Auth service is currently unavailable",
    });
  }
});

router.put(
  "/api/auth/change-password",
  gatewayAuthMiddleware,
  async (req, res) => {
    try {
      const response = await axios.put(
        "http://localhost:12004/api/auth/change-password",
        req.body,
        {
          headers: {
            Authorization: req.headers.authorization,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("Auth Service Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Auth service is currently unavailable",
      });
    }
  }
);

router.post("/api/auth/refresh", gatewayAuthMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:12004/api/auth/refresh",
      req.body,
      {
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Auth Service Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Auth service is currently unavailable",
    });
  }
});

router.post(
  "/api/auth/reset-password",
  gatewayAuthMiddleware,
  async (req, res) => {
    try {
      const response = await axios.post(
        "http://localhost:12004/api/auth/reset-password",
        req.body,
        {
          headers: {
            Authorization: req.headers.authorization,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("Auth Service Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Auth service is currently unavailable",
      });
    }
  }
);

export default router;
