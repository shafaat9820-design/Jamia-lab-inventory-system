import nodemailer from "nodemailer";

export async function sendOTP(email: string, otp: string) {
  // SMTP configuration from environment variables (evaluated at runtime)
  const smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  const transporter = nodemailer.createTransport({
    ...smtpConfig,
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 20000,     // 20 seconds
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Jamia Lab Inventory" <noreply@jmi.ac.in>',
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1a5a28; text-align: center;">Verification Code</h2>
        <p>Dear User,</p>
        <p>Thank you for registering with the <strong>Jamia Lab Asset & Resource Portal</strong>. To proceed with your registration, please use the following One-Time Password (OTP):</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a5a28; background: #f0fdf4; padding: 10px 20px; border-radius: 5px; border: 1px dashed #1a5a28;">
            ${otp}
          </span>
        </div>
        <p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666666; text-align: center;">
          This is an automated message from Jamia Millia Islamia Lab Inventory System.
        </p>
      </div>
    `,
  };

  try {
    // If auth user/pass are not provided, we might be in dev mode without a real SMTP
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.log("------------------------------------------");
      console.log(`DEV MODE: SMTP credentials missing.`);
      console.log(`OTP for ${email}: ${otp}`);
      console.log("To send real emails on Render, set SMTP_USER and SMTP_PASS variables.");
      console.log("------------------------------------------");
      return true;
    }

    console.log(`Attempting to send OTP email to ${email} via ${smtpConfig.host}...`);
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error("CRITICAL: Error sending verification email:");
    if (error.code === 'EAUTH') {
      console.error("SMTP Authentication Failed: Please check SMTP_USER and SMTP_PASS.");
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error(`SMTP Connection Failed: Could not connect to ${smtpConfig.host}:${smtpConfig.port}.`);
    } else {
      console.error("Unknown SMTP Error:", error.message);
    }
    
    // Even if email fails, log the OTP so an admin can find it in Render logs
    console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
    throw new Error("Failed to send verification email. Please check server logs for details.");
  }
}
