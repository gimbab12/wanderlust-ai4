import React, { useEffect, useRef } from 'react';

interface KakaoAdFitProps {
  unitId?: string;
  width?: string;
  height?: string;
  className?: string;
}

export function KakaoAdFit({ 
  unitId = 'DAN-NGAfHzTd4HK6donL', 
  width = '320', 
  height = '100',
  className = ''
}: KakaoAdFitProps) {
  const adRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent multiple script injections
    if (adRef.current) return;
    adRef.current = true;

    // Create a new ins element inside the container to ensure AdFit runs on it properly
    if (containerRef.current) {
      // Create ins element
      const ins = document.createElement('ins');
      ins.className = 'kakao_ad_area';
      ins.style.display = 'none';
      ins.setAttribute('data-ad-unit', unitId);
      ins.setAttribute('data-ad-width', width);
      ins.setAttribute('data-ad-height', height);
      
      containerRef.current.appendChild(ins);

      // Create and append the script
      const script = document.createElement('script');
      script.src = '//t1.kakaocdn.net/kas/static/ba.min.js';
      script.async = true;
      script.type = 'text/javascript';
      
      containerRef.current.appendChild(script);
    }
  }, [unitId, width, height]);

  return (
    <div className={`flex justify-center items-center w-full ${className}`} ref={containerRef}>
      {/* Ad will be injected here */}
    </div>
  );
}
