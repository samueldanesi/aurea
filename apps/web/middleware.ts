import { NextResponse, type NextRequest } from 'next/server';

// Lightweight visit log for the shared demo link -- prints one line per real
// page view to stdout (captured in the server's log file) so we can tell who's
// dropped by without adding any analytics service or storing data anywhere.
// Skips static assets/API polling so the log stays readable.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? 'unknown';
  console.log(`[visit] ${new Date().toISOString()} ip=${ip} path=${pathname} ua="${ua}"`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
