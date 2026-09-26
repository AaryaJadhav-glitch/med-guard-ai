import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

/**
 * Initializes the Nodemailer transporter.
 * Uses configured SMTP credentials if provided, otherwise creates an Ethereal test account.
 */
async function getTransporter() {
  if (transporter) return transporter;

  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,
      secure: config.smtpSecure || false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
    return transporter;
  }

  // If standard Gmail credentials are provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    return transporter;
  }

  // Development fallback: Ethereal email
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Nodemailer initialized with Ethereal development mail server.');
    return transporter;
  } catch (err) {
    console.warn('⚠️ Could not initialize Ethereal mail account:', err.message);
    return null;
  }
}

/**
 * Generates an OTP verification code with exactly 3 letters and 3 numbers.
 * Example: 'MGD492' or 'KLS831'
 */
export function generateVerificationOtp() {
  // Disambiguated uppercase letters (omitting confusing letters like 'O' and 'I')
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  // Digits (omitting 0 and 1 to prevent ambiguity with O and I)
  const numbers = '23456789';

  let letterPart = '';
  for (let i = 0; i < 3; i++) {
    letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  let numberPart = '';
  for (let i = 0; i < 3; i++) {
    numberPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  // Returns 3 letters + 3 numbers (6 characters total)
  return `${letterPart}${numberPart}`;
}

/**
 * Builds the professional Med - Guard AI branded HTML email template.
 * Strictly adheres to project requirements:
 * - Branded as "Med - Guard AI"
 * - High-res medical shield logo
 * - OTP code clearly highlighted (3 letters + 3 numbers)
 * - "Thanks for contacting us" at the end
 * - Only project-related clinical safety information
 * - Zero mention of database names or third-party platform names
 */
export function buildVerificationEmailHtml({ recipientName, otp }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Med - Guard AI Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%); padding: 36px 32px 30px 32px; text-align: center;">
              
              <!-- Medical Shield Logo SVG -->
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%); width: 64px; height: 64px; border-radius: 18px; box-shadow: 0 8px 16px rgba(20, 184, 166, 0.35);">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 15px auto;">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  </td>
                </tr>
              </table>

              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Med - Guard <span style="color: #2dd4bf;">AI</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; color: #99f6e4; text-transform: uppercase; letter-spacing: 1.5px;">
                Clinical Safety & Drug Interaction Prevention
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h2 style="margin: 0 0 14px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">
                Account Verification Code
              </h2>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                ${recipientName ? `Hello <strong>${recipientName}</strong>,<br>` : ''}
                Please use the one-time verification code below to confirm your email and activate your clinical account.
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0 26px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 16px; padding: 18px 36px; text-align: center;">
                      <span style="display: block; font-size: 11px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">
                        One-Time Verification Code
                      </span>
                      <span style="display: block; font-family: 'Courier New', Courier, monospace, monospace; font-size: 38px; font-weight: 800; color: #0f172a; letter-spacing: 8px;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #64748b; text-align: center;">
                ⏱️ This verification code contains <strong>3 letters and 3 numbers</strong> and expires in <strong>15 minutes</strong>.
              </p>

              <!-- Safety Notice Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin: 20px 0 0 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  🔒 <strong>Clinical Security Notice:</strong> Never share your verification code with anyone. Med - Guard AI personnel will never ask for your code. If you did not request this verification, you can safely disregard this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0f766e;">
                Thanks for contacting us.
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                The Med - Guard AI Clinical Safety Team
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Medication Safety, Drug-Drug Interaction & Clinical Contraindication Prevention
              </p>
            </td>
          </tr>

        </table>

        <!-- Copyright Footnote -->
        <table role="presentation" width="100%" style="max-width: 540px;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-top: 18px; text-align: center; font-size: 11px; color: #94a3b8;">
              © ${new Date().getFullYear()} Med - Guard AI. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends the verification email via Nodemailer.
 */
export async function sendVerificationEmail({ toEmail, recipientName, otp }) {
  const mailOptions = {
    from: config.smtpFrom || '"Med - Guard AI" <clinical-safety@medguard-ai.internal>',
    to: toEmail,
    subject: `Med - Guard AI - Verification Code: ${otp}`,
    text: `Med - Guard AI\n\nYour one-time account verification code is: ${otp}\n\nThis code contains 3 letters and 3 numbers, and is valid for 15 minutes.\n\nThanks for contacting us.\n- The Med - Guard AI Clinical Safety Team`,
    html: buildVerificationEmailHtml({ recipientName, otp })
  };

  try {
    const activeTransporter = await getTransporter();
    if (activeTransporter) {
      const info = await activeTransporter.sendMail(mailOptions);
      console.log(`\n======================================================`);
      console.log(`✉️  [Med - Guard AI] Verification Email Sent`);
      console.log(`📬  Recipient: ${toEmail}`);
      console.log(`🔑  Verification Code (3 letters + 3 numbers): ${otp}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`🔗  Ethereal Mail Preview: ${nodemailer.getTestMessageUrl(info)}`);
      }
      console.log(`======================================================\n`);
      return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
    }
  } catch (err) {
    console.warn(`⚠️ Failed to deliver email via transporter: ${err.message}`);
  }

  // Always log to console as guarantee for local development / testing
  console.log(`\n======================================================`);
  console.log(`✉️  [Med - Guard AI] Verification Code for ${toEmail}: ${otp}`);
  console.log(`======================================================\n`);

  return { success: true, loggedToConsole: true };
}
