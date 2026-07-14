"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";
import Menus from "./Menus";
import Social from "./Social";
import SignIn from "./SignIn";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Listen to the window scroll event
  useEffect(() => {
    const handleScroll = () => {
      // Sets true if scrolled down more than 20 pixels, false otherwise
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Clean up the event listener when the navbar unmounts
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Right Side: Navigation Menus and Social Links aligned together */}
          <div className="flex items-center gap-16">
            <nav>
              <Menus isScrolled={isScrolled} />
            </nav>
            
            <div className="flex items-center gap-4 z-50">
              <Social isScrolled={isScrolled} />
              {/* We will add the Clerk login button here later! */}
              <SignIn isScrolled={isScrolled} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}