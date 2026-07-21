"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // 👈 1. Added Link import
import Logo from "./Logo";
import Menus from "./Menus";
import Social from "./Social";
import LoginButton from "./SignIn";
import MobileMenu from "./MobileMenu"; 
import { HiMenu, HiX } from "react-icons/hi"; 
import { SignInButton, UserButton, Show, useUser } from "@clerk/nextjs"; // 👈 2. Added useUser import

// ⚠️ Put your actual Clerk email address here!
const ADMIN_EMAILS = [
    "uzzokel@gmail.com", // <-- Replace with your email
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false); 

  // 👈 3. Get the logged-in user & check if their email matches ADMIN_EMAILS
  const { user } = useUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = primaryEmail ? ADMIN_EMAILS.includes(primaryEmail) : false;

  // Lock scrolling when the mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white shadow-sm border-b border-gray-100 py-3" 
          : "bg-transparent py-5" 
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between h-16">
          {/* Left Side: Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Right Side: Navigation controls */}
          <div className="flex items-center gap-4 lg:gap-16">
            <nav className="hidden lg:block">
              <Menus isScrolled={isScrolled} />
            </nav>
            
            <div className="flex items-center gap-2 sm:gap-4 z-50">
              <div className="hidden lg:block">
                <Social isScrolled={isScrolled} />
              </div>
              
              {/* Clerk Dynamic Authentication Interface */}
              <div className="flex items-center">
                {/* 1. Show your custom LoginButton when signed out */}
                <Show when="signed-out">
                  <LoginButton />
                </Show>

                {/* 2. Show Clerk's secure user profile menu when signed in */}
                <Show when="signed-in">
                  <div className="flex items-center gap-3">
                    {/* 🔒 4. Admin Button (Renders ONLY if logged in as an Admin) */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                      >
                        Admin
                      </Link>
                    )}

                    <UserButton 
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "w-9 h-9 border border-emerald-500/20 hover:scale-105 transition duration-200",
                        }
                      }}
                    />
                  </div>
                </Show>
              </div>

              {/* Mobile Hamburger Toggle Button */}
              <button 
                className={`lg:hidden text-3xl focus:outline-none transition-all duration-300 hover:scale-110 cursor-pointer ${
                  isScrolled ? "text-slate-800" : "text-slate-800 lg:text-white"
                }`}
                onClick={() => setMenuOpen(!menuOpen)} 
                aria-label="Toggle menu"
              >
                {menuOpen ? <HiX /> : <HiMenu />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rendering our sliding Mobile Menu */}
      <MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    </header>
  );
}