"use client";

import Link from "next/link";
import Image from "next/image";
import { theme } from "../Styles";

export default function Logo() {
  const handleClick = () => {
    // Smoothly scroll the entire window back to the top
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  
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
          style={{ color: theme.primaryColor }} 
          className="text-2xl italic font-bold"
        >
          <span style={{ color: theme.secondaryColor }}>Agri</span>Tech
        </span>
      </Link>
    </div>
  );
}