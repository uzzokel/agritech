"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function registerAgriUser(formData: {
  fullName: string;
  email: string;
  state: string;
  lga: string;
  designation: string;
  phoneNumber?: string;
  securityPin: string;
}) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    const targetEmail = (formData.email || user?.emailAddresses[0]?.emailAddress)?.trim().toLowerCase();

    if (!targetEmail) {
      return { success: false, error: "A valid email address is required." };
    }

    // 1. Check for duplicate registration by email
    const existingUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: `An application with email (${targetEmail}) already exists. Current status: ${existingUser.status}`,
      };
    }

    // 2. Create record with explicit null uniqueAdminId
    await prisma.user.create({
      data: {
        clerkUserId: userId || null,
        securityPin: formData.securityPin,
        fullName: formData.fullName,
        email: targetEmail,
        state: formData.state,
        lga: formData.lga,
        designation: formData.designation,
        phoneNumber: formData.phoneNumber || null,
        status: "PENDING",
        uniqueAdminId: null, // 👈 Fix: Explicitly pass null for optional unique fields
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle duplicate key error from Prisma (e.g. Unique email or Clerk ID)
    if (error?.code === "P2002") {
      const field = error?.meta?.target?.[0] || "field";
      return {
        success: false,
        error: `An account with this ${field} already exists.`,
      };
    }

    return {
      success: false,
      error: error?.message || "Failed to submit application. Please try again.",
    };
  }
}