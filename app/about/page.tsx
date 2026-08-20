"use client";

import React, { useState } from "react";
import { theme } from "@/app/components/Styles";
import { sendContactEmail } from "@/app/actions/sendEmail";

// ============================================================================
// COMPONENT 1: AGRICULTURAL METRICS & OBJECTIVES
// ============================================================================
function SustainableMetrics() {
  const metrics = [
    { label: "Active Farmer Cooperatives", value: "250+", target: "Expanding Nationally" },
    { label: "Produce Traded Safely", value: "15,000+ Tons", target: "Zero-Waste Logistics" },
    { label: "Verified Buyer Network", value: "1,200+", target: "Growing Daily" },
  ];

  return (
    <section className="bg-slate-100 border-y border-slate-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
            AgriTech Impact & Scale
          </h2>
          <p className="text-slate-600 text-sm mt-1">Empowering agricultural trade and digital supply chain visibility.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="block text-3xl font-extrabold mb-1" style={{ color: theme.secondaryColor }}>
                {metric.value}
              </span>
              <span className="block font-semibold text-slate-800 text-sm mb-2">{metric.label}</span>
              <span 
                className="inline-block text-xs px-2.5 py-1 rounded-full font-medium" 
                style={{ backgroundColor: `${theme.secondaryColor}15`, color: theme.secondaryColor }}
              >
                {metric.target}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// COMPONENT 2: AGRICULTURAL PROGRAMS
// ============================================================================
function AgriculturalPrograms() {
  const programs = [
    {
      title: "Digital Farmer Onboarding",
      description: "Equipping rural farming cooperatives with intuitive registration systems to list and price farm-gate produce directly.",
    },
    {
      title: "Direct Produce Marketplace",
      description: "Connecting smallholder farmers directly with wholesale buyers, processors, and aggregators to eliminate middlemen markup.",
    },
  ];

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: theme.primaryColor }}>
        Our Core Operations
      </h2>
      <p className="text-slate-600 text-center max-w-xl mx-auto mb-10 text-sm">
        How we connect technology directly to agricultural production on the ground.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        {programs.map((program, idx) => (
          <div 
            key={idx} 
            className="p-6 rounded-2xl border flex flex-col justify-between"
            style={{ backgroundColor: `${theme.secondaryColor}08`, borderColor: `${theme.secondaryColor}25` }}
          >
            <div>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4 shadow-sm"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                {idx === 0 ? "🌾" : "🛒"}
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: theme.primaryColor }}>{program.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{program.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function AboutUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const result = await sendContactEmail(formData);

    setLoading(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setErrorMessage(result.error || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. HERO SECTION WITH BACKGROUND PICTURE */}
      <section 
        className="relative h-[60vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/pics/Agriculture.jpg')` }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: theme.primaryColor, opacity: 0.85 }} />
        
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Digitizing the Agricultural Value Chain
          </h1>
          <p className="text-lg md:text-xl text-slate-200 font-medium">
            Bridging smallholder farmers, digital marketplaces, and wholesale buyers for transparent, efficient produce trading.
          </p>
        </div>
      </section>

      {/* 2. CORE CONTENT SECTION */}
      <section className="py-16 px-4 max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: theme.primaryColor }}>Our Mission & Vision</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            AgriTech is engineered to solve supply chain fragmentation by providing a unified digital platform where agricultural producers can register, list yields, and securely connect with verified buyers.
          </p>
          <p className="text-slate-600 leading-relaxed">
            We value price transparency, reliable farm-gate logistics, and cooperative empowerment—transforming seasonal trading challenges into streamlined opportunities.
          </p>
        </div>
        <div 
          className="p-8 rounded-2xl border"
          style={{ backgroundColor: `${theme.secondaryColor}08`, borderColor: `${theme.secondaryColor}20` }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: theme.primaryColor }}>Why Choose AgriTech?</h3>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-center gap-2">
              <span className="font-bold" style={{ color: theme.secondaryColor }}>✓</span> Direct Farm-Gate Produce Listing
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold" style={{ color: theme.secondaryColor }}>✓</span> Verified Farmer & Buyer Profiles
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold" style={{ color: theme.secondaryColor }}>✓</span> Real-Time Order & Inquiry Management
            </li>
          </ul>
        </div>
      </section>

      {/* NEW INTEGRATED COMPONENTS */}
      <SustainableMetrics />
      <AgriculturalPrograms />

      {/* 3. CONTACT US SECTION */}
      <section className="text-white py-16 px-4" style={{ backgroundColor: theme.primaryColor }}>
        <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-12">
          
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Connect With Us</h2>
              <p className="text-slate-200/75 text-sm">
                Have questions about bulk sourcing, farmer cooperative registration, or platform features? Leave us a message.
              </p>
            </div>
            
            <div className="space-y-4 text-sm text-slate-200/90">
              <p>📍 AgriTech Headquarters, Regional Cluster Hub</p>
              <p>✉️ support@agritechhub.com</p>
              <p>📞 +234 (800) AGRI-TECH</p>
            </div>
          </div>

          <div className="md:col-span-3 bg-white text-slate-900 p-8 rounded-2xl shadow-xl">
            {submitted ? (
              <div className="text-center py-12">
                <span className="text-4xl">🌱</span>
                <h3 className="text-2xl font-bold mt-4" style={{ color: theme.secondaryColor }}>Inquiry Dispatched!</h3>
                <p className="text-slate-600 mt-2 text-sm">Our team will look over your query and get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                    {errorMessage}
                  </div>
                )}
                
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none text-sm transition-shadow"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none text-sm transition-shadow"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Inquiry Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none text-sm resize-none transition-shadow"
                    placeholder="How can we assist your agricultural trade needs?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 text-white font-medium rounded-lg transition-opacity text-sm shadow-sm hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: theme.secondaryColor }}
                >
                  {loading ? "Dispatching..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}