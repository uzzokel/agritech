"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; // Import the Next.js router
import { FaUserGraduate } from 'react-icons/fa';

export default function LoginButton() {
  const router = useRouter(); // Initialize the router

  const handleSignIn = () => {
    // Smoothly redirect the user to the homepage
    router.push('/');
  };

  return (
    <button
      onClick={handleSignIn}
      className="flex border items-center gap-1.5 sm:gap-2 rounded-full px-2.5 py-1 sm:px-4 sm:py-1.5 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 transition-all duration-300 cursor-pointer font-medium text-xs sm:text-sm shadow-sm"
    >
      <FaUserGraduate className="text-slate-600 scale-90 sm:scale-100" size={14} />
      <span>Sign In</span>
    </button>
  );
}