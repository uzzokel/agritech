"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { theme } from "../Styles";

interface MenusProps {
  isScrolled: boolean;
}

export default function Menus({ isScrolled }: MenusProps) {
  // 🟢 Fixed: Swapped Neon DB out for Prisma/Supabase tracking context
  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/features" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Projects", path: "/projects" },
  ];

  // Specific dropdown files under the Dashboard umbrella
  const dashboardDropdownItems = [
    { label: "Overview", path: "/dashboard" },
    { label: "Predict Impact", path: "/dashboard/predict-impact" },
    { label: "Reports", path: "/dashboard/reports" }
  ];

  const [activeMenuItem, setActiveMenuItem] = useState<string>("Home");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRestingStyle = () => {
    if (isScrolled) {
      return { color: theme.primaryColor, opacity: 1 };
    }
    return { color: theme.primaryColor, opacity: 0.65 };
  };

  return (
    <ul className="hidden lg:flex text-lg items-center gap-5 font-medium">
      {/* Standard Links */}
      {menuItems.map((item, i) => {
        const isActive = activeMenuItem === item.label;
        const linkStyle = isActive ? { color: theme.secondaryColor } : getRestingStyle();

        return (
          <li key={i}>
            <Link 
              href={item.path} 
              onClick={() => {
                setActiveMenuItem(item.label);
                setIsDropdownOpen(false);
              }} 
              style={linkStyle}
              className="relative nav-menu transition-all duration-300 cursor-pointer hover:opacity-100"
            >
              {item.label}
            </Link>   
          </li>
        );
      })}

      {/* Interactive Dashboard Dropdown Link Item */}
      <li className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={activeMenuItem === "Dashboard" ? { color: theme.secondaryColor } : getRestingStyle()}
          className="flex items-center gap-1 transition-all duration-300 cursor-pointer hover:opacity-100 font-medium text-lg bg-transparent border-none outline-none"
        >
          Dashboard
          <span className={`text-xs transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {/* Dropdown Menu Container Panel */}
        {isDropdownOpen && (
          <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
            {dashboardDropdownItems.map((subItem, index) => (
              <Link
                key={index}
                href={subItem.path}
                onClick={() => {
                  setActiveMenuItem("Dashboard");
                  setIsDropdownOpen(false);
                }}
                className="block px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
                style={{ color: theme.primaryColor }}
                onMouseEnter={(e) => (e.currentTarget.style.color = theme.secondaryColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.primaryColor)}
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        )}
      </li>
    </ul>
  );
}