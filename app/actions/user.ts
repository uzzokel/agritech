'use server';

import { revalidatePath } from 'next/cache';
import { sendApprovalEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

// Helper function to generate a collision-safe unique AGRI ID
async function generateUniqueAgriId(): Promise<string> {
  let uniqueId = '';
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    uniqueId = `AGRI-${randomNum}`;
    
    const count = await prisma.user.count({
      where: { uniqueAdminId: uniqueId },
    });
    
    if (count === 0) {
      exists = false;
    }
  }

  return uniqueId;
}

export async function approveUser(userId: string) {
  try {
    // 1. Fetch user to check if they already have an ID or if PIN exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: 'User not found.' };
    }

    // 2. Generate new AGRI ID if they don't have one yet
    const agriId = existingUser.uniqueAdminId || (await generateUniqueAgriId());

    // 3. Update database record
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'APPROVED',
        uniqueAdminId: agriId,
        emailSent: true,
      },
    });

    // 4. Send approval email with AGRI-ID and Security PIN
    await sendApprovalEmail(
      updatedUser.email, 
      agriId, 
      updatedUser.securityPin
    );

    // 5. Purge Next.js router cache to refresh admin UI table instantly
    revalidatePath('/admin/users'); // Update this path to match your actual admin dashboard page path

    return { success: true, message: 'User approved and email sent!' };
  } catch (error) {
    console.error('Failed to approve user:', error);
    return { success: false, error: 'Approval failed.' };
  }
}