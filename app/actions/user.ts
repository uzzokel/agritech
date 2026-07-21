// app/actions/user.ts
'use server';

import { revalidatePath } from 'next/cache'; // 👈 1. Import revalidatePath
import { sendApprovalEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export async function approveUser(userId: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'APPROVED',
        emailSent: true,
      },
    });

    await sendApprovalEmail(user.email, user.uniqueAdminId);

    // 👈 2. Add path to your admin user list page so it refreshes the UI automatically
    revalidatePath('/admin/users'); // Replace with your actual admin route path

    return { success: true, message: 'User approved and email sent!' };
  } catch (error) {
    console.error('Failed to approve user:', error);
    return { success: false, error: 'Approval failed.' };
  }
}