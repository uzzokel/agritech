// app/actions/logout-agri.ts
"use server";

import { cookies } from "next/headers";

export async function deleteAgriSessionCookie() {
  const cookieStore = await cookies();

  // Clear both Tier-2 verification cookies across the entire domain
  cookieStore.delete({ name: "agri_session_verified", path: "/" });
  cookieStore.delete({ name: "agri_session_id", path: "/" });
}