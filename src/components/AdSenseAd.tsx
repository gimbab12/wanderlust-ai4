import React, { useEffect, useState } from 'react';
import { Sparkles, DollarSign, ExternalLink, Info } from 'lucide-react';

interface AdSenseAdProps {
  slot?: string;
  client?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdSenseAd({
  slot,
  client,
  format = 'auto',
  responsive = true,
  className = '',
}: AdSenseAdProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fallback values from environment variables, localStorage, or direct parameters
  const adClient = client || localStorage.getItem('adsense_client') || (import.meta as any).env.VITE_ADSENSE_CLIENT || 'ca-pub-8139972839007359';
  const adSlot = slot || localStorage.getItem('adsense_slot') || (import.meta as any).env.VITE_ADSENSE_SLOT || '2141105845';

  const isRealConfig = adClient && adClient.startsWith('ca-pub-') && adSlot && !adClient.includes('~');

  // AdSense does not load in local development, sandboxes, or iframes because of domain authorization.
  // We detect this to show a gorgeous high-fidelity preview instead of a broken blank space.
  const isLocalOrSandbox = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.run.app') ||
    window.location.hostname.includes('aistudio') ||
    window.self !== window.top
  );

  useEffect(() => {
    if (!isRealConfig || isLocalOrSandbox) {
      return;
    }

    let timeoutId: any;

    try {
      // 1. Dynamic injection of AdSense script if it hasn't been added yet
      const scriptId = 'google-adsense-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // 2. Initialize the specific ad instance with safety checks and delay
      const initializeAd = () => {
        try {
          if (window.adsbygoogle) {
            // Check if there's an uninitialized adsbygoogle ins element in the DOM
            // to prevent calling push() more times than physical ins elements exist
            const uninitializedAds = document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status="done"])');
            if (uninitializedAds.length > 0) {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              setIsAdLoaded(true);
            }
          }
        } catch (err) {
          console.warn("AdSense push inner warning (safe fallback):", err);
          setHasError(true);
        }
      };

      // Add a brief timeout to let the React DOM fully settle before triggering AdSense
      timeoutId = setTimeout(initializeAd, 100);

    } catch (error) {
      console.warn('Error initializing Google AdSense safely:', error);
      setHasError(true);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [adClient, adSlot, isRealConfig, isLocalOrSandbox]);

  // If in local/sandbox mode, show a high-fidelity visual mock ad with live config data
  if (!isRealConfig || isLocalOrSandbox || hasError) {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 flex flex-col relative overflow-hidden group ${className}`}>
        {/* Glow Effects */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-amber-200/20 rounded-full blur-xl group-hover:scale-125 transition-all duration-500" />
        <div className="absolute -left-8 -top-8 w-24 h-24 bg-orange-200/20 rounded-full blur-xl group-hover:scale-125 transition-all duration-500" />

        <div className="flex items-center justify-between mb-2 z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-sm">
              <DollarSign className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-black text-amber-800 tracking-wider uppercase flex items-center gap-1">
              Google AdSense Active
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            </span>
          </div>
          <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <Info className="w-2.5 h-2.5" /> AdSense Preview
          </span>
        </div>
        
        <p className="text-[11px] text-neutral-700 font-extrabold leading-snug z-10">
          🎉 세계 각국의 여행지에서 가장 저렴한 비행기 표와 호텔을 예약해 보세요! (Wanderlust Premium Ad)
        </p>

        {/* AdSense ID Debug footer */}
        <div className="mt-2 pt-2 border-t border-amber-100/40 flex flex-col gap-0.5 font-mono text-[8px] text-neutral-400 z-10">
          <div className="flex justify-between">
            <span>Publisher ID:</span>
            <span className="font-semibold text-neutral-600">{adClient}</span>
          </div>
          <div className="flex justify-between">
            <span>Ad Slot:</span>
            <span className="font-semibold text-amber-600 font-bold">{adSlot}</span>
          </div>
          <div className="mt-1 text-[8px] text-amber-700/80 italic">
            * Sandbox Preview Mode: Real ads display on authorized domains.
          </div>
        </div>
      </div>
    );
  }

  // Real Google AdSense Container (rendered in authorized production domain environments)
  return (
    <div className={`my-4 w-full overflow-hidden flex justify-center items-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '250px', minHeight: '90px' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
