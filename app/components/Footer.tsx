"use client";

import Link from "next/link";
import { theme } from "@/app/components/Styles"; //  Fixed: Absolute path resolution
import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram, 
  FaEnvelope, 
  FaMapMarkerAlt 
} from "react-icons/fa";

export default function Footer() {
  const { primaryColor, secondaryColor } = theme;
  const white = "#ffffff";
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="w-full border-t border-white/10 pt-16 pb-8 selection:bg-green-600/30" 
      style={{ backgroundColor: primaryColor }}
    >
      <div className="px-[5%] md:px-[8%] lg:px-[12%] w-full max-w-7xl mx-auto">
        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand / Philosophy */}
          <div className="flex flex-col gap-4">
            <Link href="#" className="text-2xl italic font-bold text-white tracking-tight">
              <span style={{ color: secondaryColor }}>Agri</span>Tech
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cultivating connections, harvesting ideas. Your ultimate digital hub for sharing premier farming insights and agricultural excellence.
            </p>
            {/* Embedded Mini Social Row */}
            <div className="flex items-center gap-4 mt-2">
              {[
                { icon: FaFacebook, href: "https://facebook.com" },
                { icon: FaTwitter, href: "https://twitter.com" },
                { icon: FaLinkedin, href: "https://linkedin.com" },
                { icon: FaInstagram, href: "https://instagram.com" }
              ].map((social, idx) => (
                <a 
                  key={idx} 
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:scale-110 transition-transform duration-200"
                  style={{ "--hover-color": secondaryColor } as React.CSSProperties}
                  onMouseEnter={(e) => e.currentTarget.style.color = secondaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgb(148, 163, 184)"}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Platform Links
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm font-medium">
              {[
                { label: "Home Elements", path: "/" },
                { label: "Key Features", path: "/features" },
                { label: "Platform Services", path: "/services" },
                { label: "Community Blog", path: "/blog" },
                { label: "Agri Projects", path: "/projects" }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    href={link.path} 
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Dashboard Resources */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Analysis Portal
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm font-medium">
              {[
                { label: "Overview Panel", path: "/dashboard" },
                { label: "Predict Impact Tool", path: "/dashboard/predict-impact" },
                { label: "Yield Reports", path: "/dashboard/reports" }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    href={link.path} 
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Location / Details */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Hub Info
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-400 font-medium">
              <li className="flex items-start gap-2.5">
                <FaMapMarkerAlt className="mt-1 flex-shrink-0" style={{ color: secondaryColor }} />
                <span>Lagos Technology Sector, Nigeria</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FaEnvelope className="flex-shrink-0" style={{ color: secondaryColor }} />
                <a href="mailto:support@agritech.com" className="hover:text-white transition-colors">
                  support@agritech.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© {currentYear} AgriTech Hub. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Charter</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Usage Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
}