// app/actions/login-agri.ts
"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function loginAgriUser(prevState: any, formData: FormData) {
  // 1. Extract values safely from form data
  const rawId = (formData.get("uniqueAdminId") || formData.get("agriId") || formData.get("uniqueId") || "") as string;
  const rawPin = (formData.get("securityPin") || formData.get("pin") || "") as string;
  
  const targetRedirect = (formData.get("redirectTo") as string) || "/dashboard";

  console.log(`📥 [LOGIN ATTEMPT] ID: "${rawId}" | PIN: "${rawPin}" | Redirect: "${targetRedirect}"`);

  if (!rawId || !rawPin) {
    console.log("❌ [LOGIN FAILED] Missing ID or Security PIN in Form Data!");
    return { success: false, error: "Please enter both AGRI-ID and Security PIN." };
  }

  const cleanId: string = rawId.trim().toUpperCase();
  const cleanPin: string = rawPin.trim();

  // 2. Find user in database
  const dbUser = await prisma.user.findFirst({
    where: {
      uniqueAdminId: cleanId,
      securityPin: cleanPin,
    },
  });

  if (!dbUser) {
    console.log(`❌ [LOGIN FAILED] No user found for ID: ${cleanId}`);
    return { success: false, error: "Invalid AGRI-ID or Security PIN." };
  }

  // 3. Status Validation Checks
  if (dbUser.status === "PENDING") {
    console.log(`⚠️ [LOGIN BLOCKED] Account ${cleanId} is PENDING approval.`);
    return { success: false, error: "Your account is currently pending approval by an Admin." };
  }

  if (dbUser.status === "DENIED") {
    console.log(`⚠️ [LOGIN BLOCKED] Account ${cleanId} was DENIED.`);
    return { success: false, error: "Your account request was not approved." };
  }

  // 4. Ensure guaranteed string value for session ID
  const sessionUserId: string = dbUser.uniqueAdminId ?? cleanId;

  console.log(`✅ [LOGIN SUCCESS] Minting session cookies for ${sessionUserId}`);

  // 5. Set session cookies
  const cookieStore = await cookies();
  
  cookieStore.set("agri_session_verified", "true", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("agri_session_id", sessionUserId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true, error: null };
}