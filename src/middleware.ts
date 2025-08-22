import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if we're accessing a protected route
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/chat')) {
    const idToken = request.cookies.get('id_token')?.value;
    
    if (!idToken) {
      // No token, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // For now, just check if token exists
    // Token validation will happen server-side in the actual chat actions
    if (!idToken || idToken.length < 10) {
      // Invalid token format, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*']
};
