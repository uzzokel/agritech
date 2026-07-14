"use client";

import Link from "next/link";
import Image from "next/image";
import { theme } from "../Styles";

export default function Logo() {
  const handleClick = () => {
    // Smoothly scroll the screen back to the top navbar header if scrolled down
    const navbarElement = document.getElementById("global-site-navbar");
    if (navbarElement) {
      navbarElement.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  return (
    <div className="flex flex-col leading-tight z-50">
      <Link 
        href="#global-site-navbar" 
        onClick={handleClick} 
        className="flex items-center gap-2 font-semibold"
      >
        <Image 
          src="/agricultural-gear-logo.jpg" // 👈 FIXED: Removed /public prefix for Next.js routing
          alt="logo"
          width={80} 
          height={80}
          priority 
          className="w-15 h-15 object-contain"
        />
        
        <span 
          style={{ color: theme.primaryColor }} 
          className="text-2xl italic font-bold"
        >
          <span style={{ color: theme.secondaryColor }}>Agri</span>Tech
        </span>
      </Link>
    </div>
  );
}