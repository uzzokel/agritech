"use client";

import { UserButton, useClerk } from "@clerk/nextjs";
import { deleteAgriSessionCookie } from "@/app/actions/logout-agri";
import { LogOut } from "lucide-react";

export default function CustomUserButton() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      // 1. Delete the custom AGRI session cookie on the server
      await deleteAgriSessionCookie();

      // 2. Sign out of Clerk and redirect to the ID & PIN login form
      await signOut({ redirectUrl: "/login-agri" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-10 h-10 border border-slate-700 hover:border-emerald-500 transition",
        },
      }}
    >
      <UserButton.MenuItems>
        {/* Custom item inside Clerk's dropdown that clears both sessions */}
        <UserButton.Action
          label="Log out of AgriTech"
          labelIcon={<LogOut className="w-4 h-4 text-red-400" />}
          onClick={handleSignOut}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}