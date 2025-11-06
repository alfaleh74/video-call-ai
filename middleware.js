import { NextResponse } from 'next/server';

/**
 * Next.js Middleware for server-side device detection
 * This runs before the page is rendered, allowing for optimized initial load
 */
export function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Device detection patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;
  
  const isMobile = mobileRegex.test(userAgent);
  const isTablet = tabletRegex.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  // Create response
  const response = NextResponse.next();
  
  // Add custom headers for device info
  response.headers.set('x-device-type', isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop');
  response.headers.set('x-is-mobile', isMobile.toString());
  response.headers.set('x-user-agent', userAgent);
  
  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

