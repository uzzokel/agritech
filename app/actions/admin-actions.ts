"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "uzzokel@gmail.com";

// Security helper: Verifies user is logged in via Clerk as admin
async function isAdminAuthorized() {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses[0]?.emailAddress;

  if (primaryEmail !== ADMIN_EMAIL) {
    console.warn(`⚠️ Unauthorized admin access attempt by: ${primaryEmail}`);
    return false;
  }

  return true;
}

// Collision-proof unique AGRI ID generator
async function generateUniqueAgriId(): Promise<string> {
  let uniqueId = "";
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    uniqueId = `AGRI-${randomNum}`;

    const count = await prisma.user.count({
      where: { uniqueAdminId: uniqueId },
    });

    if (count === 0) {
      exists = false;
    }
  }

  return uniqueId;
}

export async function getPendingUsers() {
  try {
    const isAuth = await isAdminAuthorized();
    if (!isAuth) {
      return {
        success: false,
        error: "Unauthorized access: Admin privileges required.",
        users: [],
      };
    }

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

export async function updateUserStatus(userId: string, status: Status) {
  try {
    const isAuth = await isAdminAuthorized();
    if (!isAuth) {
      return { success: false, error: "Unauthorized access: Admin privileges required." };
    }

    // Fetch existing user record first
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: "User record not found." };
    }

    // Generate AGRI ID if approving and user doesn't have one yet
    let agriId = existingUser.uniqueAdminId;
    if (status === Status.APPROVED && !agriId) {
      agriId = await generateUniqueAgriId();
    }

    // 1. Update status and save generated ID
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        uniqueAdminId: agriId,
      },
      select: {
        email: true,
        fullName: true,
        uniqueAdminId: true,
        securityPin: true,
      },
    });

    // 2. Send email notification if approved
    if (status === Status.APPROVED && updatedUser.uniqueAdminId) {
      const { data, error } = await resend.emails.send({
        from: "AgriTech Onboarding <onboarding@resend.dev>",
        to: [updatedUser.email],
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
              <p style="margin: 0 0 16px 0; font-family: monospace; font-size: 28px; font-weight: bold; color: #34d399;">
                ${updatedUser.uniqueAdminId}
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Your Security PIN</p>
              <p style="margin: 0; font-family: monospace; font-size: 20px; font-weight: bold; color: #cbd5e1;">
                ${updatedUser.securityPin}
              </p>
            </div>

            <p style="color: #cbd5e1; font-size: 14px;">
              You can now use these credentials to log in to your portal.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("❌ RESEND API ERROR:", error);
        return { success: false, error: error.message };
      }

      // Mark emailSent flag to true
      await prisma.user.update({
        where: { id: userId },
        data: { emailSent: true },
      });

      console.log("✅ RESEND SUCCESS! Email ID:", data?.id);
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(`Failed to update status to ${status}:`, error);
    return { success: false, error: "Failed to update user status." };
  }
}