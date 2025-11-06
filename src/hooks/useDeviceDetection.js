"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for detecting device type and environment
 * Follows best practices from Next.js and React documentation
 */
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isPortrait: false,
    isLandscape: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    isVercelDeployment: false,
    userAgent: '',
  });

  useEffect(() => {
    // Check if we're on Vercel deployment
    const isVercel = 
      window.location.hostname.includes('vercel.app') ||
      process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined ||
      process.env.VERCEL_ENV !== undefined;

    const detectDevice = () => {
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Mobile detection using user agent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUA = mobileRegex.test(ua);
      
      // Tablet detection
      const tabletRegex = /iPad|Android(?!.*Mobile)/i;
      const isTabletUA = tabletRegex.test(ua);
      
      // Viewport-based detection (more reliable for responsive design)
      const isMobileViewport = width < 768;
      const isTabletViewport = width >= 768 && width < 1024;
      const isDesktopViewport = width >= 1024;
      
      // Combine UA and viewport detection
      const isMobile = isMobileUA || isMobileViewport;
      const isTablet = !isMobile && (isTabletUA || isTabletViewport);
      const isDesktop = !isMobile && !isTablet && isDesktopViewport;
      
      // Touch device detection
      const isTouchDevice = 
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0;
      
      // Orientation detection
      const isPortrait = height > width;
      const isLandscape = width >= height;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        isPortrait,
        isLandscape,
        screenWidth: width,
        screenHeight: height,
        isVercelDeployment: isVercel,
        userAgent: ua,
      });
    };

    // Initial detection
    detectDevice();

    // Re-detect on resize and orientation change
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}

/**
 * Hook to get breakpoint-specific value
 * Usage: const padding = useBreakpointValue({ mobile: 2, tablet: 4, desktop: 6 })
 */
export function useBreakpointValue(values) {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();
  
  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  }
  if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  if (isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  
  // Fallback
  return values.desktop || values.tablet || values.mobile;
}

