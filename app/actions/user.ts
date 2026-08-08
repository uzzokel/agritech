// app/actions/user.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendApprovalEmail } from '@/lib/email';
import { isAdminUser } from '@/lib/admin';
import { Status } from '@prisma/client';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generates a collision-safe unique AGRI ID (e.g., AGRI-582910)
 */
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

// ==========================================
// ADMIN ACTIONS
// ==========================================

/**
 * Approves a registered user, generates their unique AGRI-ID,
 * updates Prisma and Clerk metadata, and dispatches approval credentials via email.
 */
export async function approveUser(userId: string) {
  try {
    // 1. STRICT SECURITY GUARD: Ensure caller is authenticated AND an Admin
    const caller = await currentUser();
    if (!caller || !isAdminUser(caller)) {
      return { success: false, error: 'Unauthorized: Admin access required.' };
    }

    // 2. Fetch target user record
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: 'User not found.' };
    }

    // 3. Reuse existing ID or generate a new collision-free AGRI ID
    const agriId = existingUser.uniqueAdminId || (await generateUniqueAgriId());

    // 4. Update database record
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: Status.APPROVED,
        uniqueAdminId: agriId,
        emailSent: true,
      },
    });

    // 5. Sync approval status to Clerk Public Metadata if clerkUserId exists
    if (existingUser.clerkUserId) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(existingUser.clerkUserId, {
          publicMetadata: {
            status: Status.APPROVED,
            agriId,
          },
        });
      } catch (clerkErr) {
        console.error('[AdminAction] Failed to update Clerk publicMetadata:', clerkErr);
      }
    }

    // 6. Send approval email with AGRI-ID and Security PIN
    await sendApprovalEmail(
      updatedUser.email,
      agriId,
      updatedUser.securityPin
    );

    // 7. Revalidate admin and dashboard routes
    revalidatePath('/admin');
    revalidatePath('/dashboard');

    return { success: true, message: 'User approved and credentials sent successfully!' };
  } catch (error) {
    console.error('[AdminAction] Failed to approve user:', error);
    return { success: false, error: 'Approval failed. Please try again.' };
  }
}

// ==========================================
// USER AUTH & REGISTRATION ACTIONS
// ==========================================

export type RegisterAgriData = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  designation?: string;
  state?: string;
  lga?: string;
  securityPin?: string;
  redirectTo?: string;
};

/**
 * Submits the registration form, creates or updates the user record,
 * updates Clerk metadata, and routes based on user role and session state.
 * Supports both direct calls registerAgriUser(data) and useActionState signatures.
 */
export async function registerAgriUser(
  arg1: any,
  arg2?: any
): Promise<{ success: boolean; error?: string }> {
  // Determine parameter structure
  let formData: FormData | null = null;
  let rawData: RegisterAgriData = {};

  if (arg1 instanceof FormData) {
    formData = arg1;
  } else if (arg2 instanceof FormData) {
    formData = arg2;
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    rawData = arg1;
  } else if (typeof arg2 === 'object' && arg2 !== null) {
    rawData = arg2;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Authentication required. Please sign in.' };
  }

  const primaryEmail = (
    rawData.email ||
    clerkUser.emailAddresses[0]?.emailAddress
  )?.toLowerCase();

  if (!primaryEmail) {
    return { success: false, error: 'No verified email address found on your profile.' };
  }

  // Form input extraction
  const fullName =
    (formData?.get('fullName') as string)?.trim() ||
    rawData.fullName?.trim() ||
    `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

  const phoneNumber =
    (formData?.get('phoneNumber') as string)?.trim() ||
    rawData.phoneNumber?.trim();

  const designation =
    (formData?.get('designation') as string)?.trim() ||
    rawData.designation?.trim();

  const state =
    (formData?.get('state') as string)?.trim() ||
    rawData.state?.trim();

  const lga =
    (formData?.get('lga') as string)?.trim() ||
    rawData.lga?.trim();

  const userSecurityPin =
    (formData?.get('securityPin') as string)?.trim() ||
    rawData.securityPin?.trim();

  const rawRedirect =
    (formData?.get('redirectTo') as string)?.trim() ||
    rawData.redirectTo?.trim();

  const targetRedirect = rawRedirect && rawRedirect.startsWith('/') ? rawRedirect : '/dashboard';

  if (!fullName || !phoneNumber || !designation || !state || !lga) {
    return { success: false, error: 'All fields are required.' };
  }

  const isAdmin = isAdminUser(clerkUser);
  const securityPin = userSecurityPin || Math.floor(100000 + Math.random() * 900000).toString();

  let userRecord;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkUserId: clerkUser.id }, { email: primaryEmail }],
      },
    });

    if (existingUser) {
      userRecord = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkUserId: clerkUser.id,
          fullName,
          phoneNumber,
          designation,
          state,
          lga,
          securityPin: userSecurityPin || existingUser.securityPin,
          status: isAdmin ? Status.APPROVED : (existingUser.status || Status.PENDING),
        },
      });
    } else {
      userRecord = await prisma.user.create({
        data: {
          clerkUserId: clerkUser.id,
          email: primaryEmail,
          fullName,
          phoneNumber,
          designation,
          state,
          lga,
          securityPin,
          status: isAdmin ? Status.APPROVED : Status.PENDING,
          uniqueAdminId: isAdmin ? `AGRI-ADMIN-${clerkUser.id.slice(-6).toUpperCase()}` : null,
        },
      });
    }

    // Sync Clerk metadata
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: {
          role: isAdmin ? 'admin' : 'user',
          status: userRecord.status,
          agriId: userRecord.uniqueAdminId || null,
        },
      });
    } catch (clerkErr) {
      console.error('[UserAction] Failed to sync Clerk publicMetadata:', clerkErr);
    }
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[UserAction] Error registering user:', error);
    return { success: false, error: 'Failed to submit application. Please try again.' };
  }

  // Handle Redirection
  if (isAdmin) {
    const cookieStore = await cookies();
    cookieStore.set('agri_session_verified', 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set('agri_session_id', userRecord.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath(targetRedirect);
    redirect(targetRedirect);
  }

  if (userRecord.status !== Status.APPROVED) {
    const pendingPath = `/pending-approval?redirect=${encodeURIComponent(targetRedirect)}`;
    revalidatePath(pendingPath);
    redirect(pendingPath);
  }

  const loginPath = `/login-agri?redirect=${encodeURIComponent(targetRedirect)}`;
  revalidatePath(loginPath);
  redirect(loginPath);
}

export type LoginAgriData = {
  agriIdOrEmail?: string;
  uniqueAdminId?: string;
  agriId?: string;
  email?: string;
  securityPin?: string;
  pin?: string;
  redirectTo?: string;
};

/**
 * Verifies AGRI-ID/Email and Security PIN for approved users,
 * establishes tier-2 session cookies, and preserves return target.
 * Supports both direct calls loginAgriUser(data) and useActionState signatures.
 */
export async function loginAgriUser(
  arg1: any,
  arg2?: any
): Promise<{ success: boolean; error?: string } | void> {
  let formData: FormData | null = null;
  let rawData: LoginAgriData = {};

  if (arg1 instanceof FormData) {
    formData = arg1;
  } else if (arg2 instanceof FormData) {
    formData = arg2;
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    rawData = arg1;
  } else if (typeof arg2 === 'object' && arg2 !== null) {
    rawData = arg2;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Authentication required. Please sign in.' };
  }

  const agriIdOrEmail = (
    formData?.get('agriIdOrEmail') ||
    formData?.get('uniqueAdminId') ||
    formData?.get('agriId') ||
    formData?.get('email') ||
    rawData.agriIdOrEmail ||
    rawData.uniqueAdminId ||
    rawData.agriId ||
    rawData.email ||
    ''
  ) as string;

  const securityPin = (
    formData?.get('securityPin') ||
    formData?.get('pin') ||
    rawData.securityPin ||
    rawData.pin ||
    ''
  ) as string;

  const rawRedirect = (
    formData?.get('redirectTo') ||
    rawData.redirectTo ||
    ''
  ) as string;
  const targetRedirect = rawRedirect && rawRedirect.startsWith('/') ? rawRedirect : '/dashboard';

  if (!agriIdOrEmail.trim() || !securityPin.trim()) {
    return { success: false, error: 'AGRI-ID/Email and Security PIN are required.' };
  }

  const cleanInput = agriIdOrEmail.trim();
  const cleanPin = securityPin.trim();

  // Admin Fast-Pass
  if (isAdminUser(clerkUser)) {
    const cookieStore = await cookies();
    cookieStore.set('agri_session_verified', 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set('agri_session_id', clerkUser.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath(targetRedirect);
    redirect(targetRedirect);
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { uniqueAdminId: cleanInput.toUpperCase() },
          { email: cleanInput.toLowerCase() },
          { clerkUserId: clerkUser.id },
        ],
      },
    });

    if (!dbUser) {
      return { success: false, error: 'No registered application found. Please complete registration.' };
    }

    if (dbUser.status !== Status.APPROVED) {
      const pendingPath = `/pending-approval?redirect=${encodeURIComponent(targetRedirect)}`;
      revalidatePath(pendingPath);
      redirect(pendingPath);
    }

    if (dbUser.securityPin !== cleanPin) {
      return { success: false, error: 'Invalid Security PIN. Please check your approval email.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('agri_session_verified', 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set('agri_session_id', dbUser.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath(targetRedirect);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[UserAction] Login verification error:', error);
    return { success: false, error: 'An unexpected error occurred during verification.' };
  }

  redirect(targetRedirect);
}

/**
 * Clears Tier-2 security session cookies while preserving Clerk primary auth.
 */
export async function logoutAgriSession() {
  const cookieStore = await cookies();
  cookieStore.delete('agri_session_verified');
  cookieStore.delete('agri_session_id');

  revalidatePath('/');
  redirect('/login-agri');
}