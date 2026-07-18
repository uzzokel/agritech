"use client";

import Image from 'next/image';
import { theme } from "@/app/components/Styles";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs';
import RollingTicker from './components/RollingTicker';
import LiveTimer from './components/LiveTimer'; // 1. Imported the countdown timer here

export default function Page() {
  const { primaryColor, secondaryColor } = theme;
  const white = "#ffffff";

  return (
    // 60% Dominant Background
    <main className="w-full selection:bg-green-600/30" style={{ backgroundColor: primaryColor }}>
      
      {/* 
        FIX: Increased top padding to pt-36 on small screens and pt-44 on larger screens. 
        This completely brings the entire hero container down past your navigation layer.
      */}
      <section className="relative w-full flex items-center justify-center pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden isolate">
        
        {/* Subtle background glow from your growth green color */}
        <div 
          className="absolute inset-0 -z-10 opacity-10" 
          style={{ backgroundImage: `radial-gradient(circle at top right, ${secondaryColor}, transparent)` }} 
        />

        <div className="px-[5%] md:px-[8%] lg:px-[12%] w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Typography & Action Buttons */}
            <div className="flex flex-col justify-center text-left">

              {/* 2. Live Countdown Timer placed directly above the ticker */}
              <div className="mb-2 pl-1">
                <LiveTimer />
              </div>

              {/* 3. The Ticker fits right here, contained to the left column */}
              {/* Added mb-8 to push the content below down, and rounded-xl to shape it cleanly */}
              <div className="w-full mb-8 overflow-hidden rounded-xl">
                <RollingTicker />
              </div>

              {/* 30% Secondary Accent */}
              <span className="font-bold uppercase tracking-wider text-sm mb-3 block" style={{ color: secondaryColor }}>
                Welcome to the AgriTech
              </span>
              
              {/* 10% High-Contrast White */}
              <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-6" style={{ color: white }}>
                Cultivating Connections, <br />
                <span style={{ color: secondaryColor }}>Harvesting Ideas.</span>
              </h1>
              
              {/* ... The rest of your code remains unchanged ... */}
              <h2 className="text-lg sm:text-xl text-slate-300 font-medium leading-relaxed max-w-xl">
                <span className="font-semibold" style={{ color: secondaryColor }}>Connect, cultivate, and trade:</span>{" "}
                your ultimate hub for sharing farming insights and premier agricultural products.
              </h2>
              
              {/* Action Buttons */}
              <div className="pt-8 flex flex-wrap gap-4 items-center">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="px-8 py-3 text-white font-semibold rounded-full text-base shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer hover:brightness-110" style={{ backgroundColor: secondaryColor }}>
                      Sign In
                    </button>
                  </SignInButton>
                  
                  <SignUpButton mode="modal">
                    <button className="px-8 py-3 border border-white/20 bg-transparent text-white font-semibold rounded-full text-base hover:bg-white/5 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer">
                      Register Account
                    </button>
                  </SignUpButton>
                </Show>

                <Show when="signed-in">
                  <Link href="/features" className="px-8 py-3 text-white font-semibold rounded-full text-base shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-center" style={{ backgroundColor: secondaryColor }}>
                    Explore Features
                  </Link>
                  
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 py-2 px-4 rounded-full shadow-sm">
                    <span className="text-sm font-medium text-slate-300">Account:</span>
                    <UserButton />
                  </div>
                </Show>
              </div>
            </div>
                        
            {/* Right Column: Clean Grid matching original imports */}
            <div className="flex flex-col justify-center w-full">
              
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 border-l-4 pl-4 lg:max-w-lg" style={{ borderColor: secondaryColor }}>
                Celebrating the journey from the soil (our roots) to a thriving, nourished community (rising together). 
                It highlights both agricultural abundance and human connection.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full aspect-square max-w-md lg:max-w-lg mx-auto">
                <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 shadow-md hover:shadow-xl transition-shadow duration-300">
                  <Image
                    src="/images (3).jpeg"
                    alt="Farming community hub overview"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 shadow-md hover:shadow-xl transition-shadow duration-300">
                  <Image
                    src="/images (6).jpeg"
                    alt="Agricultural products showcase"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 shadow-md hover:shadow-xl transition-shadow duration-300">
                  <Image
                    src="/images (8).jpeg"
                    alt="Farmers sharing insights"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 shadow-md hover:shadow-xl transition-shadow duration-300">
                  <Image
                    src="/images (10).jpeg"
                    alt="Fresh local farm produce"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

            </div>
              
          </div>
        </div>

      </section>
    </main>
  );
}