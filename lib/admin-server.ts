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

  let adminRecord = await prisma.user.findFirst({
    where: {
      OR: [
        { email: primaryEmail },
        { uniqueAdminId: "AGRI-ADMIN-001" },
      ],
    },
  });

  if (!adminRecord) {
    adminRecord = await prisma.user.create({
      data: {
        email: primaryEmail,
        fullName: `${clerkUser.firstName || "Super"} ${clerkUser.lastName || "Admin"}`.trim(),
        uniqueAdminId: "AGRI-ADMIN-001",
        securityPin: "000000",
        status: Status.APPROVED,
        designation: "System Administrator",
        state: "Headquarters",
        lga: "Central",
        phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || "00000000000",
        emailSent: true,
      },
    });
    console.log(`✅ [ADMIN SETUP] Auto-provisioned AGRI-ADMIN-001 for ${primaryEmail}`);
  }

  return adminRecord;
}