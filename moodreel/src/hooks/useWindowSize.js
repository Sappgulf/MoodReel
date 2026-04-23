import { useState, useEffect } from 'react';

const HAS_WINDOW = typeof window !== 'undefined';

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState(() => ({
    width: HAS_WINDOW ? window.innerWidth : 1024,
    height: HAS_WINDOW ? window.innerHeight : 768,
  }));

  useEffect(() => {
    if (!HAS_WINDOW) return;
    let raf;
    let tick = false;
    function handleResize() {
      if (!tick) {
        raf = requestAnimationFrame(() => {
          setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
          });
          tick = false;
        });
        tick = true;
      }
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  return { ...windowSize, isMobile, isTablet, isDesktop };
}
