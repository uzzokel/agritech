"use client";

import { useState } from "react";
import Link from "next/link";
import { theme } from "../Styles";

interface MobileMenuProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

export default function MobileMenu({ menuOpen, setMenuOpen }: MobileMenuProps) {
  // Synchronized to match the exact order in Menus.tsx
  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/features" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Blog", path: "/blog" }, // Added Blog!
    { label: "Projects", path: "/projects" },
  ];

  const dashboardDropdownItems = [
    { label: "Overview", path: "/dashboard" },
    { label: "Predict Impact", path: "/dashboard/predict-impact" },
    { label: "Reports", path: "/dashboard/reports" }
  ];

  const [activeMenuItem, setActiveMenuItem] = useState<string>("Home");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState<boolean>(false);

  return (
    <div 
      className={`fixed inset-0 top-0 left-0 h-screen w-full bg-white transform transition-transform duration-300 ease-in-out lg:hidden z-40 ${
        menuOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Scrollable Container (In case of small screen heights containing many links) */}
      <div className="flex flex-col h-full pt-24 px-6 pb-8 overflow-y-auto gap-6 text-xl font-medium">
        
        {/* Standard Links */}
        {menuItems.map((item, i) => {
          const isActive = activeMenuItem === item.label;
          return (
            <Link 
              key={i}
              href={item.path} 
              onClick={() => {
                setActiveMenuItem(item.label);
                setIsMobileDropdownOpen(false);
                setMenuOpen(false); // Close the whole slider overlay
              }} 
              className="border-b border-slate-100 pb-3 transition-colors duration-200"
              style={{
                color: isActive ? theme.secondaryColor : theme.primaryColor,
              }}
            >
              {item.label}
            </Link> 
          );
        })}

        {/* Accordion-Style Mobile Dashboard Dropdown Toggle Button */}
        <div className="border-b border-slate-100 pb-3 flex flex-col">
          <button
            onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
            className="flex items-center justify-between w-full text-left font-medium text-xl bg-transparent border-none outline-none cursor-pointer"
            style={{
              color: activeMenuItem === "Dashboard" ? theme.secondaryColor : theme.primaryColor,
            }}
          >
            <span>Dashboard</span>
            <span className={`text-sm transition-transform duration-200 ${isMobileDropdownOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {/* Expanded Nested Submenu Links */}
          <div 
            className={`flex flex-col gap-3 pl-4 transition-all duration-300 overflow-hidden ${
              isMobileDropdownOpen ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"
            }`}
          >
            {dashboardDropdownItems.map((subItem, index) => (
              <Link
                key={index}
                href={subItem.path}
                onClick={() => {
                  setActiveMenuItem("Dashboard");
                  setIsMobileDropdownOpen(false);
                  setMenuOpen(false);
                }}
                className="text-lg font-medium transition-colors duration-200"
                style={{ color: `${theme.primaryColor}aa` }} // Semi-transparent text for sub-items
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}