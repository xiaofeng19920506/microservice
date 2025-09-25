import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Service configuration interface
interface ServiceConfig {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  corsOrigin: string;
  corsOrigins: string[];
  frontendUrl: string;
  brevoApiKey: string;
  brevoSenderEmail: string;
  brevoSenderName: string;
  brevoSmtpUser: string;
  brevoSmtpPassword: string;
}

// JWT Payload interface
interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  type: string;
}

// Constants for better maintainability
const DEFAULT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "3d";
const REFRESH_TOKEN_EXPIRY = "7d";
const TOKEN_BYTES = 32;
const DEFAULT_PORT = "5000";
const DEFAULT_MONGODB_URI = "mongodb://localhost:27017/pc-admin-server";
const DEFAULT_CORS_ORIGIN = "http://localhost:3000";
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001", 
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173"
];
const DEFAULT_SENDER_EMAIL = "noreply@yourdomain.com";
const DEFAULT_SENDER_NAME = "Your App";
const DEFAULT_JWT_SECRET = "your-secret-key";
const DEFAULT_JWT_REFRESH_SECRET = "your-refresh-secret-key";

// Service configuration
export const getServiceConfig = (): ServiceConfig => {
  const config = {
    port: parseInt(process.env.PORT || DEFAULT_PORT),
    mongoUri: process.env.MONGODB_URI || DEFAULT_MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    jwtRefreshSecret:
      process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH_SECRET,
    corsOrigin: process.env.CORS_ORIGIN || DEFAULT_CORS_ORIGIN,
    corsOrigins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
      DEFAULT_CORS_ORIGINS,
    frontendUrl: process.env.FRONTEND_URL || DEFAULT_CORS_ORIGIN,
    brevoApiKey: process.env.BREVO_API_KEY || "",
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL,
    brevoSenderName: process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME,
    brevoSmtpUser: process.env.BREVO_USER || "",
    brevoSmtpPassword: process.env.BREVO_PASSWORD || "",
  };

  // Log warning if using default JWT secrets
  if (config.jwtSecret === DEFAULT_JWT_SECRET) {
    console.warn(
      "⚠️  Warning: Using default JWT_SECRET. Please set a secure JWT_SECRET in your .env file"
    );
  }
  if (config.jwtRefreshSecret === DEFAULT_JWT_REFRESH_SECRET) {
    console.warn(
      "⚠️  Warning: Using default JWT_REFRESH_SECRET. Please set a secure JWT_REFRESH_SECRET in your .env file"
    );
  }

  return config;
};

class EmailService {
  private transporter: nodemailer.Transporter;
  private config: ServiceConfig;

  constructor() {
    this.config = getServiceConfig();
    
    // Initialize Nodemailer with Brevo SMTP
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.config.brevoSmtpUser,
        pass: this.config.brevoSmtpPassword
      }
    });
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetLink: string, isAdmin: boolean = false): Promise<boolean> {
    console.log("🚀 EMAIL SERVICE CALLED - sendPasswordResetEmail");
    try {
      const userType = isAdmin ? 'Staff' : 'Customer';
      const frontendType = isAdmin ? 'Admin Dashboard' : 'Customer Portal';
      
      console.log("📧 Email Service Debug Info:");
      console.log("Email:", email);
      console.log("FirstName:", firstName);
      console.log("ResetLink:", resetLink);
      console.log("IsAdmin:", isAdmin);
      console.log("Brevo SMTP User:", this.config.brevoSmtpUser);
      console.log("Brevo SMTP Password:", this.config.brevoSmtpPassword ? "***configured***" : "NOT SET");
      console.log("Brevo Sender Email:", this.config.brevoSenderEmail);
      console.log("Brevo Sender Name:", this.config.brevoSenderName);
      
      if (!this.config.brevoSmtpPassword) {
        console.warn("❌ Brevo SMTP password not configured, skipping email send");
        return false;
      }

      const mailOptions = {
        from: `"${this.config.brevoSenderName}" <${this.config.brevoSenderEmail}>`,
        to: email,
        subject: `Password Reset Request - ${frontendType}`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50; text-align: center;">Password Reset Request - ${frontendType}</h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p>Hello ${firstName},</p>
                  <p>You have requested to reset your password for your ${userType} account. Click the button below to set a new password:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                      Reset Password
                    </a>
                  </div>
                  
                  <p style="color: #e67e22; font-style: italic;">
                    <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                  </p>
                  
                  <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                </div>
                
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #27ae60;">
                    <strong>Security Note:</strong> If you're having trouble with the button above, you can copy and paste this link into your browser: ${resetLink}
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #7f8c8d;">
                  <p>Best regards,<br>${this.config.brevoSenderName}</p>
                  <p>If you have any questions, please contact our support team.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
          Password Reset Request - ${frontendType}
          
          Hello ${firstName},
          
          You have requested to reset your password for your ${userType} account. Click the link below to set a new password:
          
          ${resetLink}
          
          This link will expire in 1 hour.
          
          If you didn't request this password reset, please ignore this email.
          
          Best regards,
          ${this.config.brevoSenderName}
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📧 Response: ${result.response}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending password reset email:", error);
      console.error("❌ Error message:", (error as any).message);
      console.error("❌ Error code:", (error as any).code);
      console.error("❌ SMTP Config:", {
        host: 'smtp-relay.brevo.com',
        port: 587,
        user: this.config.brevoSmtpUser,
        password: this.config.brevoSmtpPassword ? '***SET***' : 'NOT SET'
      });
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string, isAdmin: boolean = false): Promise<boolean> {
    try {
      const userType = isAdmin ? 'Staff' : 'Customer';
      const frontendType = isAdmin ? 'Admin Dashboard' : 'Customer Portal';
      
      if (!this.config.brevoSmtpPassword) {
        console.warn("Brevo SMTP password not configured, skipping email send");
        return false;
      }

      const mailOptions = {
        from: `"${this.config.brevoSenderName}" <${this.config.brevoSenderEmail}>`,
        to: email,
        subject: `Welcome to ${this.config.brevoSenderName} - ${frontendType}`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #27ae60; text-align: center;">Welcome to ${this.config.brevoSenderName}!</h2>
                <h3 style="color: #2c3e50; text-align: center;">Your ${frontendType} Account is Ready</h3>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p>Hello ${firstName},</p>
                  <p>Welcome to ${this.config.brevoSenderName}! Your ${userType} account has been successfully created.</p>
                  <p>You can now access your ${frontendType} and start using all the features available to you.</p>
                  <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                  <p>Thank you for choosing ${this.config.brevoSenderName}!</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #7f8c8d;">
                  <p>Best regards,<br>${this.config.brevoSenderName} Team</p>
                  <p>If you have any questions, please contact our support team.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
          Welcome to ${this.config.brevoSenderName}!
          
          Hello ${firstName},
          
          Welcome to ${this.config.brevoSenderName}! Your ${userType} account has been successfully created.
          
          You can now access your ${frontendType} and start using all the features available to you.
          
          If you have any questions or need assistance, please don't hesitate to contact our support team.
          
          Thank you for choosing ${this.config.brevoSenderName}!
          
          Best regards,
          ${this.config.brevoSenderName} Team
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending welcome email:", error);
      return false;
    }
  }

  // CORS configuration helper
  getCorsOptions() {
    const config = this.config;
    return {
      origin: function (origin: string | undefined, callback: Function) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Allow localhost with any port for development
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      optionsSuccessStatus: 200
    };
  }
}

// Utility functions from your template
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, DEFAULT_SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (
  payload: JwtPayload,
  secret: string
): string => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (
  payload: JwtPayload,
  secret: string
): string => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, secret, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const generateSecureRefreshToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
};

export const generatePasswordResetToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
};

export const generateStoreCode = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const verifyToken = (token: string, secret: string): JwtPayload => {
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, secret) as JwtPayload;
};

export const formatUserResponse = (user: any) => {
  const { password, ...userWithoutPassword } = user;
  return {
    id: user.id || user._id?.toString() || "",
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    managedStore: user.managedStore,
    workingStore: user.workingStore,
    createdAt: user.createdAt,
  };
};

export default new EmailService();
