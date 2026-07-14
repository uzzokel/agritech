"use client";

import Link from "next/link";
import { theme } from "../Styles"; // Adjust path to match your Styles file

interface SignInProps {
  isScrolled: boolean;
}

export default function SignIn({ isScrolled }: SignInProps) {
  
  // Dynamic styles based on scrolling
  const getButtonStyle = () => {
    if (isScrolled) {
      // Scrolled state: High contrast solid brand color
      return {
        backgroundColor: theme.primaryColor,
        color: "#ffffff",
        border: `1px solid ${theme.primaryColor}`,
      };
    }
    // Top-of-page state: Glossy, semi-transparent glass look
    return {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: theme.primaryColor, // Or keep it white/primary depending on your hero background
      border: "1px solid rgba(255, 255, 255, 0.25)",
    };
  };

  return (
    <div className="flex items-center gap-3">
      {/* Sign In Link (Subtle) */}
      <Link
        href="/sign-in"
        className="text-sm font-semibold transition-all duration-300 hover:opacity-80 px-3 py-2 rounded-md"
        style={{ color: isScrolled ? theme.primaryColor : "rgba(255, 255, 255, 0.85)" }}
      >
        Sign In
      </Link>

      {/* Join / Register Button (Primary Action) */}
      <Link
        href="/sign-up"
        style={getButtonStyle()}
        className="text-sm font-semibold px-5 py-2.5 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg inline-block"
        onMouseEnter={(e) => {
          // Hover effect: transition to secondary theme color smoothly
          e.currentTarget.style.backgroundColor = theme.secondaryColor;
          e.currentTarget.style.borderColor = theme.secondaryColor;
          e.currentTarget.style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          // Revert to computed resting styles on leave
          const restStyle = getButtonStyle();
          e.currentTarget.style.backgroundColor = restStyle.backgroundColor;
          e.currentTarget.style.borderColor = restStyle.border.split("solid ")[1] || restStyle.border;
          e.currentTarget.style.color = restStyle.color;
        }}
      >
        Register
      </Link>
    </div>
  );
}