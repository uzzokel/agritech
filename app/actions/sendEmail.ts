"use server";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  const adminEmail = process.env.ADMIN_EMAILS || "support@agritechhub.com";

  try {
    await resend.emails.send({
      from: 'AgriTech <onboarding@resend.dev>',
      to: adminEmail,
      subject: `New AgriTech Inquiry from ${name}`,
      text: `You have received a new message from your AgriTech platform.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send message. Please try again." };
  }
}