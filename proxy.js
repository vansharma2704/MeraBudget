import arcjet, { createMiddleware, detectBot, shield } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/account(.*)',
  '/transaction(.*)',
  '/bills(.*)',
  '/goals(.*)',
  '/split(.*)',
  '/reports(.*)',
  '/subscriptions(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({
      mode: process.env.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN',
    }),
    detectBot({
      mode: process.env.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN',
      allow: ['CATEGORY:SEARCH_ENGINE', 'GO_HTTP'],
    }),
  ],
});

const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }
  
  return NextResponse.next();
});

// Arcjet calls its remote API on every request; skip it locally where it only runs in DRY_RUN anyway
export const proxy = process.env.NODE_ENV === 'production' ? createMiddleware(aj, clerk) : clerk;
export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};