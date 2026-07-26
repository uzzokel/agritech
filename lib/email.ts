import { Resend } from 'resend';

// Resend automatically reads process.env.RESEND_API_KEY from .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApprovalEmail(
  userEmail: string, 
  uniqueId: string, 
  securityPin: string
) {
  // Routes emails to your account in dev mode to bypass Resend domain verification limits
  const recipientEmail = process.env.NODE_ENV === "development" 
    ? "uzzokel@gmail.com" 
    : userEmail;

  return await resend.emails.send({
    from: 'onboarding@resend.dev', // Resend's default test address
    to: recipientEmail,
    subject: 'Account Approved - Your Unique ID & PIN',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 500px;">
        <h2 style="color: #10b981;">Your account is approved! 🎉</h2>
        <p>Your registration for the AgriTech platform has been verified.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Unique Access ID:</p>
          <p style="margin: 0 0 16px 0; font-size: 22px; font-weight: bold; color: #059669; letter-spacing: 1px;">
            ${uniqueId}
          </p>
          
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Your Security PIN:</p>
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a; font-family: monospace;">
            ${securityPin}
          </p>
        </div>

        <p style="font-size: 14px;">Use your <strong>Unique ID</strong> along with this <strong>Security PIN</strong> to complete your login on the Access Control page.</p>
      </div>
    `
  });
}