// app/actions/loginAgriUser.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export async function loginAgriUser(formData: {
  uniqueAdminId: string; // The ID emailed to them
  securityPin: string;   // The PIN set during registration or emailed
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Please sign in with Clerk first." };
    }

    const { uniqueAdminId, securityPin } = formData;

    if (!uniqueAdminId || !securityPin) {
      return { success: false, error: "Both ID and Security PIN are required." };
    }

    // 1. Find user by uniqueAdminId
    const user = await prisma.user.findFirst({
      where: {
        uniqueAdminId: uniqueAdminId.trim(),
      },
    });

    if (!user) {
      return { success: false, error: "Invalid ID or account not found." };
    }

    // 2. Ensure the user is APPROVED
    if (user.status !== "APPROVED") {
      return {
        success: false,
        error: `Your registration is currently ${user.status.toLowerCase()}. Please check your email for approval confirmation.`,
      };
    }

    // 3. Check PIN
    if (user.securityPin !== securityPin.trim()) {
      return { success: false, error: "Invalid Security PIN." };
    }

    // 4. MINT COOKIES: Enable Middleware bypass
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    cookieStore.set("agri_session_verified", "true", cookieOptions);
    cookieStore.set("agri_session_id", user.id, cookieOptions);

    return { success: true };
  } catch (error: any) {
    console.error("Agri login error:", error);
    return {
      success: false,
      error: error?.message || "Failed to log in. Please try again.",
    };
  }
}