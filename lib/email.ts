import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApprovalEmail(
  userEmail: string, 
  uniqueId: string, 
  securityPin: string
) {
  try {
    // ⚠️ TOGGLE DOMAIN VERIFICATION STATUS:
    // Set to 'true' while testing without a custom domain on Resend.
    // Set to 'false' (or set RESEND_DOMAIN_VERIFIED=true in .env) once custom domain DNS is active.
    const isUnverifiedDomain = process.env.RESEND_DOMAIN_VERIFIED !== "true"; 

    // 1. Target recipient logic
    // Unverified mode MUST send to exact Resend account owner (uzzokel@gmail.com)
    const recipientEmail = isUnverifiedDomain 
      ? "uzzokel@gmail.com" 
      : userEmail;

    // 2. Sender email logic
    // Unverified mode MUST use 'onboarding@resend.dev'
    const senderEmail = isUnverifiedDomain 
      ? 'AGRI Tech <onboarding@resend.dev>' 
      : `AGRI Tech <noreply@${process.env.NEXT_PUBLIC_APP_DOMAIN || "agritech.com"}>`;

    console.log(`📧 Sending approval email to: ${recipientEmail} (Requested for: ${userEmail})`);

    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [recipientEmail],
      subject: 'Account Approved - Your Unique ID & PIN',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #10b981; margin-top: 0;">Your account is approved! 🎉</h2>
          <p style="color: #475569; line-height: 1.5;">Your registration for the AgriTech platform has been verified.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Unique Access ID</p>
            <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #059669; font-family: monospace; letter-spacing: 1px;">
              ${uniqueId}
            </p>
            
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Security PIN</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #0f172a; font-family: monospace;">
              ${securityPin}
            </p>
          </div>

          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 0;">
            Use your <strong>Unique ID</strong> along with this <strong>Security PIN</strong> to complete your login on the Access Control page.
          </p>
        </div>
      `
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return { success: false, error };
    }

    console.log("✅ Resend Email Delivered Successfully! Message ID:", data?.id);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Failed to call Resend API:", err);
    return { success: false, error: err };
  }
}