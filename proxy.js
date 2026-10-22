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

const protectedProxy = createMiddleware(aj, clerk);

// Clerk's sign-in/sign-up pages and callbacks must remain publicly reachable.
// Running Arcjet Shield/Bot detection in front of them can reject Clerk's
// redirect query parameters with a 403 before Clerk can complete authentication.
export const proxy = (req, event) => {
  if (isPublicRoute(req) || process.env.NODE_ENV !== 'production') {
    return clerk(req, event);
  }

  return protectedProxy(req, event);
};
export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
