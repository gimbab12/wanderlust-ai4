import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Shield, Monitor, Smartphone } from 'lucide-react';

interface PhoneContainerProps {
  children: React.ReactNode;
}

export default function PhoneContainer({ children }: PhoneContainerProps) {
  const [time, setTime] = useState('12:00');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const timeString = `${hours}:${minutes} ${ampm}`;
      setTime(timeString);
    };

    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Wide Desktop View
  if (viewMode === 'desktop') {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900 antialiased relative">
        {/* Floating View Mode Switcher (Visible only on PC screens) */}
        <div className="hidden md:flex fixed bottom-6 right-6 z-50 items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-neutral-200/80 text-xs font-bold transition-all duration-300 hover:scale-105">
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all bg-gradient-to-tr from-rose-600 to-orange-500 text-white shadow-sm"
          >
            <Monitor className="w-4 h-4" />
            <span>PC 넓은 화면</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-neutral-600 hover:bg-neutral-100"
          >
            <Smartphone className="w-4 h-4" />
            <span>모바일 앱</span>
          </button>
        </div>

        {/* Wide responsive layout wrapper */}
        <div className="w-full flex-1 flex flex-col bg-neutral-50">
          <div className="w-full max-w-5xl mx-auto min-h-screen bg-white shadow-xl shadow-neutral-200/50 border-x border-neutral-200/30 flex flex-col relative overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Mobile Mockup View (iPhone Shell)
  return (
    <div className="min-h-screen bg-slate-900 md:bg-gradient-to-tr md:from-slate-950 md:via-zinc-900 md:to-indigo-950 flex flex-col items-center justify-center py-0 md:py-8 px-0 md:px-4 font-sans text-neutral-100 overflow-x-hidden antialiased">
      <div className="hidden md:flex fixed bottom-6 right-6 z-50 items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-neutral-200/80 text-xs font-bold transition-all duration-300 hover:scale-105">
        <button
          type="button"
          onClick={() => setViewMode('desktop')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-neutral-600 hover:bg-neutral-100"
        >
          <Monitor className="w-4 h-4" />
          <span className="text-neutral-600">PC 넓은 화면</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('mobile')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all bg-gradient-to-tr from-rose-600 to-orange-500 text-white shadow-sm"
        >
          <Smartphone className="w-4 h-4" />
          <span>모바일 앱</span>
        </button>
      </div>

      {/* Decorative background elements for desktop */}
      <div className="hidden md:block absolute top-10 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="hidden md:block absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Desktop App Store style description on side (visible only on large screens) */}
      <div className="hidden xl:flex absolute left-12 top-1/2 -translate-y-1/2 w-80 flex-col gap-6 text-white/90 p-6 pointer-events-none">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit">
          <Shield className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-300">Travel AI Navigator</span>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-rose-100 to-orange-200 bg-clip-text text-transparent">
            Wanderlust AI
          </h2>
          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
            Discover personalized vacations, exquisite culinary spots, and traveler stories in a compact mobile app design.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-xs text-neutral-500 border-t border-white/5 pt-4">
          <p>⚡ Designed with responsive mobile views</p>
          <p>🔒 Secure Firebase storage active</p>
          <p>🤖 Real-time Gemini API generator</p>
        </div>
      </div>

      {/* Smartphone Outer Shell */}
      <div className="relative w-full md:w-[385px] h-screen md:h-[812px] bg-black md:rounded-[50px] md:shadow-2xl md:ring-[14px] md:ring-neutral-900 flex flex-col overflow-hidden transition-all duration-300 md:border-[4px] md:border-neutral-800">
        
        {/* Physical side buttons (purely visual for exquisite design) */}
        <div className="hidden md:block absolute left-[-17px] top-[120px] w-[3px] h-[35px] bg-neutral-800 rounded-l-md border-r border-black/30"></div>
        <div className="hidden md:block absolute left-[-17px] top-[165px] w-[3px] h-[50px] bg-neutral-800 rounded-l-md border-r border-black/30"></div>
        <div className="hidden md:block absolute left-[-17px] top-[225px] w-[3px] h-[50px] bg-neutral-800 rounded-l-md border-r border-black/30"></div>
        <div className="hidden md:block absolute right-[-17px] top-[165px] w-[3px] h-[65px] bg-neutral-800 rounded-r-md border-l border-black/30"></div>

        {/* Mock Status Bar */}
        <div className="h-10 bg-white/95 backdrop-blur-md px-5 flex items-center justify-between select-none text-xs text-neutral-900 font-semibold z-40 border-b border-neutral-100/50 shrink-0">
          {/* Time */}
          <div className="w-16 text-left text-[11px] font-bold tracking-tight text-neutral-800">
            {time}
          </div>

          {/* Dynamic Island (Speaker & Camera pill) */}
          <div className="w-20 h-[18px] bg-black rounded-full flex items-center justify-center relative shadow-inner">
            <div className="w-2 h-2 rounded-full bg-neutral-950 absolute left-2.5 border border-neutral-800"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-950 absolute right-4 opacity-70"></div>
          </div>

          {/* Network & Battery Status Icons */}
          <div className="w-16 flex items-center justify-end gap-1.5 text-neutral-800">
            {/* Cellular Bars */}
            <div className="flex items-end gap-0.5 h-2.5">
              <div className="w-[2px] h-1 bg-current rounded-full"></div>
              <div className="w-[2px] h-1.5 bg-current rounded-full"></div>
              <div className="w-[2px] h-2 bg-current rounded-full"></div>
              <div className="w-[2px] h-2.5 bg-current rounded-full"></div>
            </div>
            
            {/* Wifi Icon */}
            <Wifi className="w-3.5 h-3.5" />
            
            {/* Battery Indicator */}
            <div className="flex items-center gap-0.5">
              <Battery className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Inner Phone Content (Scrollable & Responsive) */}
        <div className="flex-1 bg-neutral-50 text-neutral-900 flex flex-col relative overflow-hidden h-full">
          {children}
        </div>

        {/* Home Indicator bar for iOS style */}
        <div className="h-4 bg-white flex items-center justify-center pb-1.5 shrink-0 select-none pointer-events-none z-35">
          <div className="w-28 h-1 bg-neutral-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
