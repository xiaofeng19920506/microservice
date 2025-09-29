import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private createTransporter(): nodemailer.Transporter {
    const brevoSmtpUser = process.env.BREVO_USER ;
    const brevoSmtpPassword = process.env.BREVO_PASSWORD ;

    if (!brevoSmtpPassword) {
      console.warn("Brevo SMTP password not configured, email sending will fail");
    }

    return nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: brevoSmtpUser,
        pass: brevoSmtpPassword
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = this.createTransporter();
      const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;
      const brevoSenderName = process.env.BREVO_SENDER_NAME;

      const mailOptions = {
        from: `"${brevoSenderName}" <${brevoSenderEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  generateConfirmationEmail(userEmail: string, confirmationToken: string, isStaff: boolean = false): string {
    const userType = isStaff ? 'staff member' : 'user';
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-email?token=${confirmationToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Platform!</h1>
          </div>
          <div class="content">
            <h2>Confirm Your ${userType === 'staff member' ? 'Staff' : 'User'} Account</h2>
            <p>Hello!</p>
            <p>Thank you for registering as a ${userType} on our platform. To complete your registration and start using your account, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This confirmation link will expire in 24 hours</li>
              <li>You must confirm your email to access all platform features</li>
              <li>If you didn't create this account, please ignore this email</li>
            </ul>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
