// lib/admin.ts

const HARDCODED_ADMINS = ["uzzokel@gmail.com"];

const ENV_ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const ADMIN_EMAILS = Array.from(
  new Set([...HARDCODED_ADMINS, ...ENV_ADMINS])
);

/**
 * Pure check function — completely safe for Client Components, Server Components & Middleware
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false;

  // 1. Check Clerk Metadata Role
  const role =
    user?.publicMetadata?.role ||
    user?.unsafeMetadata?.role ||
    user?.sessionClaims?.metadata?.role ||
    user?.sessionClaims?.publicMetadata?.role;

  if (role === "admin") {
    return true;
  }

  // 2. Check Primary Email against ADMIN_EMAILS list
  const email = (
    user?.email ||
    user?.emailAddress ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.sessionClaims?.email
  )
    ?.toLowerCase()
    ?.trim();

  return Boolean(email && ADMIN_EMAILS.includes(email));
}