"use client";

import React from 'react';
import { FaUserGraduate } from 'react-icons/fa';

export default function LoginButton() {
  const handleSignIn = () => {
    // Add your navigation or authentication trigger here
    console.log("Redirecting to login...");
  };

  return (
    <button
      onClick={handleSignIn}
      className="hidden sm:flex border items-center gap-2 rounded-full px-4 py-1.5 border-gray-300 text-black hover:bg-gray-100 transition-colors cursor-pointer font-medium text-sm"
    >
      <FaUserGraduate size={14} />
      Sign In
    </button>
  );
}