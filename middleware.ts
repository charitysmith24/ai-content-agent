import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import arcjet, { shield, detectBot } from "@arcjet/next";
import { NextResponse } from "next/server";

// /video and all its subroutes are protected
const isProtectedRoute = createRouteMatcher(["/video(.*)", "/manage-plan"]);

// Configure Arcjet with security rules
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Protect against common attacks with Shield
    shield({
      mode: "DRY_RUN", // Start in DRY_RUN mode to monitor without blocking
    }),
    // Add bot protection, allowing legitimate search engines
    detectBot({
      mode: "DRY_RUN", // Start in DRY_RUN mode
      allow: ["CATEGORY:SEARCH_ENGINE"], // Allow search engines to crawl the site
    }),
  ],
});

// Use Clerk middleware directly with auth.protect() for protected routes
export default clerkMiddleware(async (auth, req) => {
  // First apply Arcjet security checks
  const decision = await aj.protect(req);

  // If Arcjet blocks the request, return that response
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    } else {
      return NextResponse.json(
        { error: "Request blocked for security reasons." },
        { status: 403 }
      );
    }
  }

  // Protected route check
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Maintain the existing matcher configuration
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
