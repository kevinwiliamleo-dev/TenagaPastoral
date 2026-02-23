import { auth } from "@/auth"
import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"

const intlMiddleware = createMiddleware({
  locales: ["id", "en"],
  defaultLocale: "id",
  localePrefix: "always"
})

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  if (isApiAuthRoute) return null;

  // Let intlMiddleware handle public pages defined in matcher
  // Auth.js middleware will only run on matched routes

  // If logged in and trying to access login, redirect to dashboard
  if (isLoggedIn && nextUrl.pathname.includes("/login")) {
      const locale = nextUrl.pathname.split('/')[1] || 'id';
      const validLocale = ["id", "en"].includes(locale) ? locale : "id";
      return NextResponse.redirect(new URL(`/${validLocale}/dashboard`, nextUrl));
  }

  return intlMiddleware(req);
})

export const config = {
  // Matcher:
  // 1. /((?!api|_next|...)) -> Match all except static/api
  // 2. / -> Match root
  // 3. /(id|en)/... -> Match locale routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/', '/(id|en)/:path*']
}
