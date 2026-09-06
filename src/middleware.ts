import { NextRequest, NextResponse } from 'next/server';

const SESSION_SECRET = process.env.AUTH_SECRET || 'safenexa_enterprise_security_secret_key_2026_salt_token';

// Paths that do not require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/logout',
];

async function verifyTokenInEdge(token: string): Promise<{ valid: boolean; payload?: any }> {
  try {
    if (!token || typeof token !== 'string') return { valid: false };
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadStr, sigStr] = parts;

    // 1. Decode payload and check expiration
    const rawJson = atob(payloadStr.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(rawJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false };
    }

    if (!payload.userId || !payload.email || !payload.role) {
      return { valid: false };
    }

    // 2. Verify HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBinary = atob(sigStr.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(payloadStr)
    );

    return { valid: isValid, payload: isValid ? payload : undefined };
  } catch (err) {
    return { valid: false };
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, Next.js internal requests, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  const tokenCookie = req.cookies.get('safenexa_session')?.value;
  const { valid } = await verifyTokenInEdge(tokenCookie || '');

  // If user is already authenticated and visits an auth page (/login, /register, /forgot-password), redirect to dashboard
  if (valid && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If path is public, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // If unauthenticated and accessing a protected path, redirect to login
  if (!valid) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required to access this resource.' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
