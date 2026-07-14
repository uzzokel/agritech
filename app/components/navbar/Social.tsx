"use client";

import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram 
} from "react-icons/fa";
import { theme } from "../Styles"; // Adjust path if your Styles file is elsewhere

// 1. Defining the contract for the props this component needs
interface SocialProps {
  isScrolled: boolean;
}

export default function Social({ isScrolled }: SocialProps) {
  // 2. The social media data array
  const socialMedia = [
    { label: "Facebook", url: "https://facebook.com/yourprofile", icon: FaFacebook },
    { label: "Twitter", url: "https://twitter.com/yourprofile", icon: FaTwitter },
    { label: "LinkedIn", url: "https://linkedin.com/in/yourprofile", icon: FaLinkedin },
    { label: "Instagram", url: "https://instagram.com/yourprofile", icon: FaInstagram }
  ];

  // 3. Dynamic styling to match the scrolling state of your Navbar!
  const getIconStyle = () => {
    if (isScrolled) {
      return { color: theme.primaryColor, opacity: 1 };
    }
    return { color: theme.primaryColor, opacity: 0.65 };
  };

  return (
    <ul className="hidden lg:flex items-center gap-5">
      {socialMedia.map((site, i) => {
        // 4. Storing the icon component in a Capitalized variable so React can render it
        const IconComponent = site.icon; 

        return (
          <li key={i}>
            <a 
              href={site.url} 
              target="_blank"             // Opens the link in a brand new tab
              rel="noopener noreferrer"   // Security protection for opening external tabs
              aria-label={site.label}     // Helps screen readers read what this link is
              style={getIconStyle()}      // Applies our dynamic scroll color
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