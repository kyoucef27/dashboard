import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path.startsWith('/api/auth');
  
  // If the path is public, allow access regardless of authentication
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Check if the user is authenticated
    if (!token) {
      // Redirect to login page if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Allow access to protected routes for authenticated users
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware authentication error:", error);
    // If there's an error in token verification, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Add the paths that should be checked by the middleware
export const config = {
  matcher: [
    '/((?!api/order|api/auth|_next|login|favicon.ico|images|fonts).*)',
  ],
};

