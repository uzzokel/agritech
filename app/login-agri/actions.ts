"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export type AgriActionResult = {
  success: boolean;
  error?: string;
} | null;

export async function loginAgriUser(
  _prevState: AgriActionResult,
  formData: FormData
): Promise<AgriActionResult> {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return {
        success: false,
        error: "Unauthorized: Please sign in with Clerk first.",
      };
    }

    const agriIdOrEmail = formData.get("agriIdOrEmail")?.toString().trim();
    const securityPin = formData.get("securityPin")?.toString().trim();

    if (!agriIdOrEmail || !securityPin) {
      return {
        success: false,
        error: "Please provide both AGRI-ID / Email and your Security PIN.",
      };
    }

    const clerkUserId = clerkUser.id;
    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase();

    // 1. Locate user record in Prisma via AGRI-ID, Email, or Clerk ID
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { uniqueAdminId: agriIdOrEmail },
          { email: agriIdOrEmail.toLowerCase() },
          { clerkUserId },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
    });

    if (!dbUser) {
      return {
        success: false,
        error: "No registered profile found matching those details.",
      };
    }

    // 2. Check application approval status
    if (dbUser.status !== "APPROVED") {
      return {
        success: false,
        error: `Your account status is currently ${dbUser.status}. You cannot log in yet.`,
      };
    }

    // 3. Verify Security PIN
    if (dbUser.securityPin !== securityPin) {
      return {
        success: false,
        error: "Incorrect Security PIN. Please try again.",
      };
    }

    // 4. Link clerkUserId to Prisma record if missing
    if (!dbUser.clerkUserId) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { clerkUserId },
      });
    }

    // 5. Set Tier-2 Verification Cookies
    const cookieStore = await cookies();
    const sessionIdentifier = dbUser.uniqueAdminId || dbUser.id;

    cookieStore.set("agri_session_verified", "true", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    cookieStore.set("agri_session_id", sessionIdentifier, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true };
  } catch (error) {
    console.error("[LOGIN_AGRI_ACTION_ERROR]", error);
    return {
      success: false,
      error: "An unexpected error occurred during login. Please try again.",
    };
  }
}