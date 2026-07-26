// app/actions/logout-agri.ts
"use server";

import { cookies } from "next/headers";

export async function deleteAgriSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("agri_session_id");
}