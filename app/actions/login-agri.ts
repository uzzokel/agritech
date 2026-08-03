"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function loginAgriUser(prevState: any, formData: FormData) {
  const uniqueAdminId = formData.get("uniqueAdminId") as string;
  const securityPin = formData.get("securityPin") as string;
  
  // 🎯 Read requested destination from form input
  const targetRedirect = (formData.get("redirectTo") as string) || "/dashboard";

  if (!uniqueAdminId || !securityPin) {
    return { success: false, error: "Please enter both AGRI-ID and Security PIN." };
  }

  // 1. Find user by ID and PIN
  const dbUser = await prisma.user.findFirst({
    where: {
      uniqueAdminId: uniqueAdminId.trim().toUpperCase(),
      securityPin: securityPin.trim(),
    },
  });

  if (!dbUser) {
    return { success: false, error: "Invalid AGRI-ID or Security PIN." };
  }

  // 2. Set the session cookies
  const cookieStore = await cookies();
  
  cookieStore.set("agri_session_verified", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("agri_session_id", dbUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  // 3. Dynamic Server Redirect to requested path
  redirect(targetRedirect);
}