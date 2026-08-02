// lib/admin.ts

export const ADMIN_EMAILS = [
  "uzzokel@gmail.com",
  // Add future admin emails here
];

export function isAdminUser(user: any): boolean {
  if (!user) return false;

  const email =
    user?.email ||
    user?.emailAddress ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.sessionClaims?.email;

  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase().trim()));
}