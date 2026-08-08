// lib/admin-server.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Status } from "@prisma/client";
import { isAdminUser } from "@/lib/admin";

/**
 * Server-only database provisioner.
 * MUST only be called from Server Components, Layouts, or Server Actions.
 */
export async function ensureAdminUserRecord() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  if (!isAdminUser(clerkUser)) {
    return null;
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!primaryEmail) return null;

  // Search by clerkUserId or email to prevent duplicate record errors
  let adminRecord = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkUserId: clerkUser.id },
        { email: primaryEmail },
      ],
    },
  });

  if (!adminRecord) {
    // Generate a unique ID per admin based on hash/timestamp slice to prevent collisions
    const uniqueSuffix = clerkUser.id.slice(-6).toUpperCase();
    const dynamicAdminId = `AGRI-ADMIN-${uniqueSuffix}`;

    adminRecord = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        email: primaryEmail,
        fullName: `${clerkUser.firstName || "Super"} ${clerkUser.lastName || "Admin"}`.trim(),
        uniqueAdminId: dynamicAdminId,
        securityPin: "000000",
        status: Status.APPROVED,
        designation: "System Administrator",
        state: "Headquarters",
        lga: "Central",
        phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || "00000000000",
        emailSent: true,
      },
    });
    console.log(`✅ [ADMIN SETUP] Auto-provisioned ${dynamicAdminId} for ${primaryEmail}`);
  } else if (!adminRecord.clerkUserId) {
    // Ensure existing record is linked with the current Clerk User ID
    adminRecord = await prisma.user.update({
      where: { id: adminRecord.id },
      data: { clerkUserId: clerkUser.id },
    });
  }

  return adminRecord;
}