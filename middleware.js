// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
    if (request.nextUrl.pathname === '/login') {
        return NextResponse.next();
    }

    // Middleware akan membiarkan request ke dashboard, 
    // karena pengecekan auth akan dilakukan di level komponen
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};