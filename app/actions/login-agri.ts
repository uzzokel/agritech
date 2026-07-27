// app/actions/login-agri.ts
"use server";

import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function loginAgriUser(prevState: any, formData: FormData) {
  const uniqueAdminId = (formData.get("uniqueAdminId") as string)?.trim().toUpperCase();
  const securityPin = (formData.get("securityPin") as string)?.trim();

  if (!uniqueAdminId || !securityPin) {
    return { success: false, error: "AGRI-ID and PIN are required." };
  }

  const user = await prisma.user.findUnique({
    where: { uniqueAdminId },
  });

  if (!user || !user.uniqueAdminId) {
    return { success: false, error: "Invalid AGRI-ID or Security PIN." };
  }

  if (user.status !== "APPROVED") {
    return { success: false, error: "Your account is pending admin approval." };
  }

  if (user.securityPin !== securityPin) {
    return { success: false, error: "Invalid AGRI-ID or Security PIN." };
  }

  const { userId: clerkUserId } = await auth();
  if (clerkUserId && !user.clerkUserId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { clerkUserId },
    });
  }

  const cookieStore = await cookies();
  cookieStore.set("agri_session_verified", user.uniqueAdminId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return { success: true, error: null };
}