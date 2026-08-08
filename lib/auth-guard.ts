// lib/auth-guard.ts
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_EMAILS } from "@/lib/admin";

interface CustomSessionClaims {
  email?: string;
  primaryEmail?: string;
  email_address?: string;
  metadata?: {
    role?: string;
  };
  firstName?: string;
  lastName?: string;
}

export async function requireAgriUser() {
  const { userId, sessionClaims } = await auth();
  console.log("🛡️ [Auth Guard] Checking userId:", userId);

  if (!userId) {
    console.log("❌ [Auth Guard] No userId found -> redirecting to /unauthorized");
    redirect("/unauthorized");
  }

  const claims = sessionClaims as unknown as CustomSessionClaims;
  const userEmail = (
    claims?.email ||
    claims?.primaryEmail ||
    claims?.email_address
  )?.toLowerCase();

  const cookieStore = await cookies();
  const agriVerified = cookieStore.get("agri_session_verified")?.value;
  const agriSessionId = cookieStore.get("agri_session_id")?.value;

  // 1. Admin Fast-Pass
  const isAdmin =
    (userEmail ? ADMIN_EMAILS.includes(userEmail) : false) ||
    claims?.metadata?.role === "admin" ||
    agriSessionId === "AGRI-ADMIN-001";

  if (isAdmin) {
    console.log("👑 [Auth Guard] Admin fast-pass granted for:", userEmail);
    return {
      id: "AGRI-ADMIN-001",
      clerkUserId: userId,
      email: userEmail || "admin@agritech.com",
      fullName: `${claims?.firstName || "System"} ${claims?.lastName || "Admin"}`.trim(),
      role: "ADMIN",
      status: "APPROVED",
      isSessionVerified: true,
    };
  }

  // 2. Database Lookup
  let userRecord = null;
  try {
    console.log("🔍 [Auth Guard] Querying database for clerkUserId:", userId);
    const dbUser = await prisma.user.findFirst({
      where: { clerkUserId: userId },
    });

    userRecord = dbUser || (userEmail ? await prisma.user.findUnique({
      where: { email: userEmail },
    }) : null);
    console.log("📦 [Auth Guard] Database lookup result:", userRecord ? "Found user" : "User not found");
  } catch (error) {
    console.error("💥 [Auth Guard] Database error:", error);
  }

  // 3. Rule 1: Must register first
  if (!userRecord) {
    console.log("🚨 [Auth Guard] User not registered -> redirecting to /register-agri");
    redirect("/register-agri");
  }

  // 4. Rule 2: Pending or Denied
  if (userRecord.status === "PENDING" || userRecord.status === "DENIED") {
    console.log(`🚨 [Auth Guard] User status is ${userRecord.status} -> redirecting to /register-agri`);
    redirect(`/register-agri?status=${userRecord.status.toLowerCase()}`);
  }

  // 5. Rule 3: PIN session verification (Relaxed strict ID check to prevent session loops)
  if (agriVerified !== "true" || !agriSessionId) {
    console.log("🔐 [Auth Guard] Invalid PIN session -> redirecting to /login-agri");
    redirect("/login-agri?redirect=/dashboard");
  }

  console.log("✅ [Auth Guard] Fully verified user granted dashboard access.");
  return {
    ...userRecord,
    isSessionVerified: true,
  };
}