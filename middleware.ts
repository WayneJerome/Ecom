import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isRiderRoute = createRouteMatcher(['/rider(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isProtectedCustomerRoute = createRouteMatcher([
  '/orders(.*)',
  '/wishlist(.*)',
  '/account(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Rider routes — must be authenticated + have rider role
  if (isRiderRoute(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    if (role !== 'rider' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Admin routes — must be authenticated + have admin role
  if (isAdminRoute(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protected customer routes — must be signed in
  if (isProtectedCustomerRoute(request)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
