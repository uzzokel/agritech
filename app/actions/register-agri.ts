"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

function generateUniqueAgriId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `AGRI-${randomNum}`;
}

export async function registerAgriUser(formData: {
  fullName: string;
  state: string;
  lga: string;
  designation: string;
  phoneNumber?: string;
  securityPin: string;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return { success: false, error: "You must be signed in with Clerk first." };
  }

  const primaryEmail = user.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    return { success: false, error: "No primary email found on Clerk profile." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (existingUser) {
    return {
      success: false,
      error: `You have already submitted your application. Current status: ${existingUser.status}`,
    };
  }

  try {
    const uniqueAdminId = generateUniqueAgriId();

    await prisma.user.create({
      data: {
        clerkUserId: userId,
        uniqueAdminId: uniqueAdminId,
        securityPin: formData.securityPin,
        fullName: formData.fullName,
        email: primaryEmail,
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
