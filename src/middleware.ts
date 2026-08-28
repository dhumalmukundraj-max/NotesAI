import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request)

  const path = request.nextUrl.pathname

  // Protected paths
  const isProtectedPath = 
    path.startsWith('/dashboard') ||
    path.startsWith('/upload') ||
    path.startsWith('/saved') ||
    path.startsWith('/my-notes') ||
    path.startsWith('/ai') ||
    path.startsWith('/profile') ||
    path.startsWith('/admin') ||
    path.startsWith('/notes')

  // Auth pages
  const isAuthPath = 
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/forgot-password')

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, vector icons, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
