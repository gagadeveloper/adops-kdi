import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Path yang tidak memerlukan autentikasi
  const publicPaths = [
    '/login',
    '/auth/error',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/callback',
    '/api/auth/providers',
    '/api/auth/error'
  ];
  
  // Cek apakah path saat ini adalah public path
  const isPublicPath = publicPaths.some(pp => 
    path === pp || path.startsWith('/api/auth/callback/') || path.startsWith('/_next/')
  );
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Cek token autentikasi
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Redirect ke login jika tidak ada token
  if (!token && !path.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Jika API request tanpa token, return unauthorized
  if (!token && path.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Kecualikan files static, favicon, dll
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};