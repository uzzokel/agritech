"use client";

import React, { useState, useEffect } from "react";

// Define your target date here (YYYY-MM-DDTHH:MM:SS)
const TARGET_DATE = new Date("2026-09-01T00:00:00");

export default function LiveTimer() {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    function calculateTimeLeft() {
      const difference = TARGET_DATE.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft("LAUNCHED");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      // Pad numbers with leading zeros for a clean look
      const formatNum = (num: number) => String(num).padStart(2, "0");

      setTimeLeft(`${days}d : ${formatNum(hours)}h : ${formatNum(minutes)}m : ${formatNum(seconds)}s`);
    }

    // Run immediately on mount
    calculateTimeLeft();

    // Update every single second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  // Soft placeholder while mounting to avoid layout shifts (Increased to text-sm)
  if (!timeLeft) {
    return (
      <div className="text-sm font-mono text-slate-500 animate-pulse">
        Calculating launch time...
      </div>
    );
  }

  return (
    // FIX: Increased text-xs to text-sm for better readability
    <div className="flex items-center gap-2 text-sm font-mono tracking-wider text-slate-400 uppercase">
      {/* Slightly upscaled blinking indicator dot to match the text size */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
      </span>
      <span>
        Next Harvest Launch: <strong className="text-white font-semibold">{timeLeft}</strong>
      </span>
    </div>
  );
}