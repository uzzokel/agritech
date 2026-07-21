"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

function generateUniqueAgriId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `AGRI-${randomNum}`;
}

export async function registerAgriUser(formData: {
  fullName: string;
  email: string; // 👈 1. Added email to TypeScript type
  state: string;
  lga: string;
  designation: string;
  phoneNumber?: string;
  securityPin: string;
}) {
  // Check if user is signed in with Clerk (optional for new applicants)
  const { userId } = await auth();
  const user = await currentUser();

  // 👈 2. Use email from the form input, falling back to Clerk email if present
  const targetEmail = formData.email || user?.emailAddresses[0]?.emailAddress;

  if (!targetEmail) {
    return { success: false, error: "A valid email address is required." };
  }

  // 👈 3. Check if an application already exists for this email or Clerk ID
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(userId ? [{ clerkUserId: userId }] : []),
        { email: targetEmail },
      ],
    },
  });

  if (existingUser) {
    return {
      success: false,
      error: `An application with this email already exists. Current status: ${existingUser.status}`,
    };
  }

  try {
    const uniqueAdminId = generateUniqueAgriId();

    await prisma.user.create({
      data: {
        clerkUserId: userId || `guest_${Date.now()}`, // Ties to Clerk if logged in, or uses guest placeholder
        uniqueAdminId: uniqueAdminId,
        securityPin: formData.securityPin,
        fullName: formData.fullName,
        email: targetEmail, // 👈 4. Saves the submitted form email to database
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