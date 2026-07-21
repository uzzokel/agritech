// app/actions/admin-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidPasscode(passcode?: string) {
  const secret = process.env.ADMIN_SECRET_PASSCODE;
  // If no secret passcode is defined in .env.local, fall back to standard Clerk auth check
  if (!secret) return true;
  return passcode === secret;
}

export async function getPendingUsers(passcode?: string) {
  const { userId } = await auth();
  if (!userId || !isValidPasscode(passcode)) {
    return { success: false, error: "Unauthorized access or invalid passcode.", users: [] };
  }

  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: Status.PENDING },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        uniqueAdminId: true,
        fullName: true,
        email: true,
        state: true,
        lga: true,
        designation: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
      },
    });

    return { success: true, users: pendingUsers };
  } catch (error) {
    console.error("[GET_PENDING_USERS_ERROR]", error);
    return { success: false, error: "Failed to load pending users.", users: [] };
  }
}

export async function updateUserStatus(
  userId: string,
  status: Status,
  passcode?: string
) {
  const { userId: adminClerkId } = await auth();
  if (!adminClerkId || !isValidPasscode(passcode)) {
    return { success: false, error: "Unauthorized access or invalid passcode." };
  }

  try {
    // 1. Update status, mark emailSent, and fetch user details
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        emailSent: status === Status.APPROVED ? true : undefined,
      },
      select: {
        email: true,
        fullName: true,
        uniqueAdminId: true,
      },
    });

    // 2. Send email notification if approved
    if (status === Status.APPROVED) {
      await resend.emails.send({
        from: "AgriTech Onboarding <onboarding@resend.dev>",
        to: updatedUser.email,
        subject: "🎉 Application Approved - Your AGRI-ID Access Details",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #10b981; margin-bottom: 8px;">Application Approved!</h2>
            <p style="color: #94a3b8; font-size: 15px;">Hello <strong>${updatedUser.fullName}</strong>,</p>
            <p style="color: #cbd5e1; line-height: 1.5;">
              Your registration request has been reviewed and officially approved by the admin team.
            </p>
            
            <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Your Official AGRI-ID</p>
              <p style="margin: 0; font-family: monospace; font-size: 26px; font-weight: bold; color: #34d399;">
                ${updatedUser.uniqueAdminId}
              </p>
            </div>

            <p style="color: #cbd5e1; font-size: 14px;">
              You can now use this AGRI-ID to log in and access your portal.
            </p>
          </div>
        `,
      });
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(`Failed to update status to ${status}:`, error);
    return { success: false, error: "Failed to update user status." };
  }
}