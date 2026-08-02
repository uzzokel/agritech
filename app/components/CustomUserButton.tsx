"use client";

import { UserButton } from "@clerk/nextjs";

export default function CustomUserButton() {
  return (
    <UserButton
      userProfileProps={{
        additionalOAuthScopes: undefined,
      }}
      appearance={{
        elements: {
          avatarBox:
            "w-10 h-10 border border-slate-700 hover:border-emerald-500 transition",
        },
      }}
    />
  );
}