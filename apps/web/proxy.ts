import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Log token presence for debugging

  // Verify token using /api/auth/profile
  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include", // Match authApi's setup
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error("Middleware: Token verification failed:", error);
      // If it's a network error or timeout, assume token is valid to prevent unnecessary redirects
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("fetch"))
      ) {
        return true; // Allow access if there's a network issue
      }
      return false;
    }
  };

  // For success page, allow access if token exists (bypass verification to prevent Stripe redirect issues)
  if (pathname === "/success") {
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      return NextResponse.redirect(signInUrl);
    }
    // Always allow access to success page if token exists to prevent Stripe redirect issues
    return NextResponse.next();
  }

  const isAuthenticated = token ? await verifyToken(token) : false;

  // Protect /user routes
  if (pathname.startsWith("/user")) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/auth/signin", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Restrict /auth routes for authenticated users
  if (pathname.startsWith("/auth")) {
    if (isAuthenticated) {
      const userUrl = new URL("/user/profile", request.url);
      return NextResponse.redirect(userUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/auth/:path*", "/success"],
};
