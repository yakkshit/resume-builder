import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkKeyValid = Boolean(
  publishableKey &&
  (publishableKey.startsWith("pk_test_") || publishableKey.startsWith("pk_live_")) &&
  !publishableKey.includes("placeholder") &&
  !publishableKey.includes("your_clerk") &&
  publishableKey.length > 20
);

export function proxy(req: NextRequest, event: NextFetchEvent) {
  if (isClerkKeyValid) {
    return clerkMiddleware()(req, event);
  }
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
