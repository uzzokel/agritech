"use client";

import Link from "next/link";
import Image from "next/image";
import { theme } from "../Styles";

// Added the prop interface to read the scroll state
interface LogoProps {
  isScrolled: boolean;
}

export default function Logo({ isScrolled }: LogoProps) {
  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  
  // FIX: Swaps the "Tech" text color between white (unscrolled) and your primary color (scrolled)
  const techTextColor = isScrolled ? theme.primaryColor : "#ffffff";

  return (
    <div className="flex flex-col leading-tight z-50">
      <Link 
        href="#" 
        onClick={handleClick} 
        className="flex items-center gap-2 font-semibold"
      >
        <Image 
          src="/agricultural-gear-logo.jpg" 
          alt="logo"
          width={80} 
          height={80}
          priority 
          className="w-15 h-15 object-cover rounded-full"
        />
        
        <span 
          style={{ color: techTextColor }} 
          className="text-2xl italic font-bold transition-colors duration-300"
        >
          <span style={{ color: theme.secondaryColor }}>Agri</span>Tech
        </span>
      </Link>
    </div>
  );
}