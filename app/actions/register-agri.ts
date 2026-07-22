"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

function generateUniqueAgriId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `AGRI-${randomNum}`;
}

export async function registerAgriUser(formData: {
  fullName: string;
  email: string;
  state: string;
  lga: string;
  designation: string;
  phoneNumber?: string;
  securityPin: string;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  const targetEmail = formData.email || user?.emailAddresses[0]?.emailAddress;

  if (!targetEmail) {
    return { success: false, error: "A valid email address is required." };
  }

  // 👈 1. Only check if THIS specific email address already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: targetEmail },
  });

  if (existingUser) {
    return {
      success: false,
      error: `An application with email (${targetEmail}) already exists. Current status: ${existingUser.status}`,
    };
  }

  try {
    const uniqueAdminId = generateUniqueAgriId();

    // 👈 2. Generate a unique ID key so Clerk logins don't clash during testing
    const uniqueClerkId = userId 
      ? `${userId}_${Date.now()}` 
      : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await prisma.user.create({
      data: {
        clerkUserId: uniqueClerkId,
        uniqueAdminId: uniqueAdminId,
        securityPin: formData.securityPin,
        fullName: formData.fullName,
        email: targetEmail,
        state: formData.state,
        lga: formData.lga,
        designation: formData.designation,
        phoneNumber: formData.phoneNumber || null,
        status: "PENDING",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to submit application. Please try again." };
  }
}