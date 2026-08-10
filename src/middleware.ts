import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/register/pending",
  "/forgot-password",
  "/reset-password",
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    const isPublic = publicPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isPublic && !req.nextauth.token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = req.nextauth.token?.role as string | undefined;
    const status = req.nextauth.token?.status as string | undefined;

    if (pathname.startsWith("/admin")) {
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (["/catalog", "/orders", "/account"].includes(pathname)) {
      if (status !== "active") {
        return NextResponse.redirect(new URL("/register/pending", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
