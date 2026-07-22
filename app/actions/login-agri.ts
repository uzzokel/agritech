"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Status } from "@prisma/client";

export async function loginAgriUser(prevState: any, formData: FormData) {
  const uniqueAdminId = (formData.get("uniqueAdminId") as string)?.trim().toUpperCase();
  const pin = (formData.get("pin") as string)?.trim();

  if (!uniqueAdminId || !pin) {
    return { success: false, error: "Please enter both your AGRI-ID and 4-digit PIN." };
  }

  try {
    // 1. Look up user by unique AGRI-ID
    const user = await prisma.user.findFirst({
      where: { uniqueAdminId },
    });

    if (!user) {
      return { success: false, error: "Invalid AGRI-ID or Security PIN." };
    }

    // 2. Status verification
    if (user.status === Status.PENDING) {
      return { 
        success: false, 
        error: "Your application is still under review. Please wait for email approval." 
      };
    }

    if (user.status === Status.DENIED) {
      return { 
        success: false, 
        error: "Your registration was not approved. Contact support for assistance." 
      };
    }

    // 3. Verify security PIN 👈 Updated to match schema property
    if (user.securityPin !== pin) {
      return { success: false, error: "Invalid AGRI-ID or Security PIN." };
    }

    // 4. Save HTTP-only session cookie (valid for 7 days)
    const cookieStore = await cookies();
    cookieStore.set("agri_session_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Login action error:", error);
    return { success: false, error: "Authentication failed. Please try again." };
  }
}