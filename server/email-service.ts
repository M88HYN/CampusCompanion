/*
==========================================================
File: server/email-service.ts

Module: Email and Notifications

Purpose:
Provides email sending functionality for transactional emails like
verification codes, password resets, and notifications.

Design Rationale:
Centralised email service allows easy switching between providers,
logging, and consistent template management.
==========================================================
*/

import nodemailer from "nodemailer";

// Email configuration - use environment variables or fallback
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "gmail";
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

let transporter: nodemailer.Transporter | null = null;

// Initialize email transporter based on environment
function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  // In development, log emails to console instead of sending
  if (process.env.NODE_ENV !== "production" || !EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn(
      "[EMAIL] Running in development mode. Verification codes will be logged to console."
    );
    transporter = nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      secure: false,
      logger: true,
    });
    return transporter;
  }

  // Production: use configured email service
  transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  return transporter;
}

export interface VerificationEmailParams {
  email: string;
  code: string;
  expiresInMinutes?: number;
}

/**
 * Send email verification code to user
 * Returns true if sent successfully, false otherwise
 */
export async function sendVerificationEmail({
  email,
  code,
  expiresInMinutes = 15,
}: VerificationEmailParams): Promise<boolean> {
  try {
    // Log the code in development
    if (process.env.NODE_ENV !== "production" || !EMAIL_USER) {
      console.log(
        `[VERIFICATION EMAIL] Code for ${email}: ${code} (expires in ${expiresInMinutes} minutes)`
      );
    }

    // Only attempt to send if production credentials are configured
    if (process.env.NODE_ENV === "production" && EMAIL_USER && EMAIL_PASSWORD) {
      const transporter = getTransporter();

      const mailOptions = {
        from: `StudyMate <${EMAIL_USER}>`,
        to: email,
        subject: "Verify Your StudyMate Account",
        html: generateVerificationEmailHTML(code, expiresInMinutes),
        text: generateVerificationEmailText(code, expiresInMinutes),
      };

      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Verification code sent to ${email}`);
    }

    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send verification email to ${email}:`, error);
    // In development, we still consider this a success since we logged it
    return process.env.NODE_ENV !== "production";
  }
}

function generateVerificationEmailHTML(code: string, expiresInMinutes: number): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
          .code-box { background: white; border: 2px solid #14b8a6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code-box .code { font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #14b8a6; font-family: "Courier New", monospace; }
          .expires { color: #666; font-size: 14px; margin-top: 10px; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          a { color: #14b8a6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to StudyMate</h1>
            <p>Verify Your Email Address</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for creating your StudyMate account! To get started, please verify your email address using the code below:</p>
            <div class="code-box">
              <div class="code">${code}</div>
              <div class="expires">This code expires in ${expiresInMinutes} minutes</div>
            </div>
            <p>Enter this code on the verification page to activate your account.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <div class="footer">
              <p>&copy; 2026 StudyMate. All rights reserved.</p>
              <p>Questions? Contact us at <a href="mailto:support@studymate.local">support@studymate.local</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateVerificationEmailText(code: string, expiresInMinutes: number): string {
  return `
Welcome to StudyMate

Verify Your Email Address

Thank you for creating your StudyMate account! To get started, please use the code below to verify your email:

${code}

This code expires in ${expiresInMinutes} minutes.

Enter this code on the verification page to activate your account.

If you didn't create this account, you can safely ignore this email.

---
© 2026 StudyMate. All rights reserved.
Questions? Contact us at support@studymate.local
  `.trim();
}

/**
 * Send password reset email (for future use)
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  try {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    if (process.env.NODE_ENV !== "production" || !EMAIL_USER) {
      console.log(`[PASSWORD RESET] Link for ${email}: ${resetLink}`);
      return true;
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `StudyMate <${EMAIL_USER}>`,
      to: email,
      subject: "Reset Your StudyMate Password",
      html: `
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send password reset email:`, error);
    return false;
  }
}
