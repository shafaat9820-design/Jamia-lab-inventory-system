import { BrevoClient } from '@getbrevo/brevo';

// Safe helper for Brevo API instance
function getBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  
  return new BrevoClient({ apiKey });
}

export async function sendOTP(email: string, otp: string, type: 'registration' | 'password_reset' = 'registration') {
  const senderEmail = process.env.BREVO_SENDER || 'jmi.lab.inventory@gmail.com';
  
  const isPasswordReset = type === 'password_reset';
  const subject = isPasswordReset ? "Password Reset Code" : "Your Verification Code";
  
  const mainText = isPasswordReset 
    ? `You have requested to reset your password for the <strong>Jamia Lab Asset & Resource Portal</strong>. To proceed, please use the following One-Time Password (OTP):`
    : `Thank you for registering with the <strong>Jamia Lab Asset & Resource Portal</strong>. To proceed with your registration, please use the following One-Time Password (OTP):`;

  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1a5a28; text-align: center;">${isPasswordReset ? 'Password Reset' : 'Verification Code'}</h2>
        <p>Dear User,</p>
        <p>${mainText}</p>
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
    `;

  try {
    const client = getBrevoClient();
    
    if (!client) {
      console.log("------------------------------------------");
      console.log(`DEV MODE (BREVO): API Key missing.`);
      console.log(`OTP for ${email}: ${otp}`);
      console.log("To send real emails, set BREVO_API_KEY variable.");
      console.log("------------------------------------------");
      return true;
    }

    console.log(`Attempting to send OTP email to ${email} via Brevo...`);
    
    await client.transactionalEmails.sendTransacEmail({
      subject: subject,
      htmlContent: htmlContent,
      sender: { name: "Jamia Lab Inventory", email: senderEmail },
      to: [{ email: email }]
    });

    console.log(`OTP email sent successfully to ${email} via Brevo.`);
    return true;
  } catch (error: any) {
    console.error("CRITICAL: Error sending verification email:");
    if (error.response && error.response.body) {
      console.error("Brevo API Error:", error.response.body.message || error.response.body);
    } else {
      console.error(error.message);
    }
    
    // Fallback log for admins
    console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
    
    if (error.message && !error.message.includes("Failed to send verification email")) {
      error.message = `Failed to send verification email: ${error.message}`;
    }
    throw error;
  }
}
