import { NextResponse, type NextRequest } from 'next/server'

const DASHBOARD_PREFIXES = [
  '/dashboard', '/library', '/progress', '/profile', '/food-check',
  '/seasonal-plan', '/community', '/workshops', '/loyalty', '/constitution',
  '/membership',
]

function isDashboard(pathname: string) {
  return DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p))
}

function hasAuthCookie(request: NextRequest): boolean {
  // Supabase sets a cookie starting with 'sb-' containing the session
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = hasAuthCookie(request)

  if (isDashboard(pathname) && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/onboarding' && !isAuthenticated) {
    return NextResponse.redirect(new URL('/signup', request.url))
  }

  if (pathname.startsWith('/admin') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
