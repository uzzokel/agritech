// components/RollingTicker.tsx
"use client"; // Required because react-fast-marquee uses client-side effects

import React from "react";
import Marquee from "react-fast-marquee";

const RollingTicker = () => {
  return (
    <div className="w-full bg-white/5 py-2 border border-white/10 rounded-xl">
      <Marquee speed={50} pauseOnHover gradient={false}>
        <span className="mx-4 text-sm font-medium text-slate-300">
          Your rolling information goes here! • 
        </span>
        <span className="mx-4 text-sm font-medium text-slate-300">
          Another piece of updates! • 
        </span>
      </Marquee>
    </div>
  );
}

export default RollingTicker;