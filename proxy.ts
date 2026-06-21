import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes
        if (
          pathname.startsWith("/api/public") ||
          pathname.startsWith("/api/send-greeting") ||
          pathname.startsWith("/api/password") ||
          pathname.startsWith("/api/reset-password")
        ) {
          return true;
        }

        // Allow webhook endpoint
        if (pathname.startsWith("/api/webhook")) {
          return true;
        }

        // Allow auth-related routes
        if (
          pathname.startsWith("/api/auth") ||
          pathname === "/login" ||
          pathname === "/api/"
        ) {
          return true;
        }

        // Public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/gallery") ||
          pathname.startsWith("/contact") ||
          pathname.startsWith("/password") ||
          pathname.startsWith("/reset-password")
        ) {
          return true;
        }

        // Admin routes require admin role
        if (pathname.startsWith("/admin")) {
          return token?.role === "admin";
        }

        if (pathname.startsWith("/user")) {
          return token?.role === "admin" || token?.role === "superadmin";
        }

        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
