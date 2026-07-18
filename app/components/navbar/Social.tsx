"use client";

import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram 
} from "react-icons/fa";
import { theme } from "../Styles"; 

interface SocialProps {
  isScrolled: boolean;
}

export default function Social({ isScrolled }: SocialProps) {
  const socialMedia = [
    { label: "Facebook", url: "https://facebook.com/yourprofile", icon: FaFacebook },
    { label: "Twitter", url: "https://twitter.com/yourprofile", icon: FaTwitter },
    { label: "LinkedIn", url: "https://linkedin.com/in/yourprofile", icon: FaLinkedin },
    { label: "Instagram", url: "https://instagram.com/yourprofile", icon: FaInstagram }
  ];

  // FIX: When NOT scrolled, icons become crisp white to stand out against the dark hero background
  const getIconStyle = () => {
    if (isScrolled) {
      return { color: theme.primaryColor, opacity: 1 };
    }
    return { color: "#ffffff", opacity: 0.75 };
  };

  return (
    <ul className="hidden lg:flex items-center gap-5">
      {socialMedia.map((site, i) => {
        const IconComponent = site.icon; 

        return (
          <li key={i}>
            <a 
              href={site.url} 
              target="_blank"            
              rel="noopener noreferrer"   
              aria-label={site.label}    
              style={getIconStyle()}      
              className="transition-all duration-300 transform hover:-translate-y-1 block hover:scale-110"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.secondaryColor;
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                const restStyle = getIconStyle();
                e.currentTarget.style.color = restStyle.color;
                e.currentTarget.style.opacity = restStyle.opacity.toString();
              }}
            >
              <IconComponent size={22} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}