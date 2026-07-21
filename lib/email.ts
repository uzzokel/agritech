// lib/email.ts
import { Resend } from 'resend';

// Resend automatically reads process.env.RESEND_API_KEY from .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApprovalEmail(userEmail: string, uniqueId: string) {
  return await resend.emails.send({
    from: 'onboarding@resend.dev', // Resend's default test address
    to: userEmail,                 // e.g., uzzokel+user1@gmail.com
    subject: 'Account Approved - Your Unique ID',
    html: `
      <h2>Your account is approved!</h2>
      <p>Your unique access ID is: <strong>${uniqueId}</strong></p>
      <p>Use this ID to complete your login.</p>
    `
  });
}
