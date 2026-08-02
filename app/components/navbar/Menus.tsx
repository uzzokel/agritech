"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { theme } from "../Styles";

interface MenusProps {
  isScrolled: boolean;
  isAdmin?: boolean;
}

export default function Menus({ isScrolled, isAdmin = false }: MenusProps) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/features" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Blog", path: "/blog" },
    { label: "Projects", path: "/projects" },
  ];

  // Dynamic filter based on admin clearance
  const dashboardDropdownItems = [
    { label: "Overview", path: "/dashboard", adminOnly: false },
    { label: "Predict Impact", path: "/dashboard/predict-impact", adminOnly: true },
    { label: "Reports", path: "/dashboard/reports", adminOnly: false }
  ].filter(item => !item.adminOnly || isAdmin);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDashboardActive = pathname?.startsWith("/dashboard");

  const getRestingStyle = () => {
    if (isScrolled) {
      return { color: theme.primaryColor, opacity: 1 };
    }
    return { color: "#ffffff", opacity: 0.75 };
  };

  return (
    <ul className="hidden lg:flex text-lg items-center gap-5 font-medium">
      {/* Standard Links */}
      {menuItems.map((item, i) => {
        const isActive = pathname === item.path;
        const linkStyle = isActive ? { color: theme.secondaryColor } : getRestingStyle();

        return (
          <li key={i}>
            <Link 
              href={item.path} 
              onClick={() => setIsDropdownOpen(false)} 
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
          style={isDashboardActive ? { color: theme.secondaryColor } : getRestingStyle()}
          className="flex items-center gap-1 transition-all duration-300 cursor-pointer hover:opacity-100 font-medium text-lg bg-transparent border-none outline-none"
        >
          Dashboard
          <span className={`text-xs transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {/* Glossy & Translucent Dropdown Menu Container Panel */}
        {isDropdownOpen && (
          <div 
            className="absolute left-0 mt-2 w-48 rounded-lg border border-white/20 p-1 z-50 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200"
            style={{ 
              backgroundColor: `${theme.primaryColor}cc`
            }}
          >
            {dashboardDropdownItems.map((subItem, index) => {
              const isSubActive = pathname === subItem.path;
              
              return (
                <Link
                  key={index}
                  href={subItem.path}
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover:bg-white/10"
                  style={{
                    color: isSubActive ? theme.secondaryColor : "rgba(255, 255, 255, 0.9)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.secondaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isSubActive ? theme.secondaryColor : "rgba(255, 255, 255, 0.9)";
                  }}
                >
                  {subItem.label}
                </Link>
              );
            })}
          </div>
        )}
      </li>
    </ul>
  );
}