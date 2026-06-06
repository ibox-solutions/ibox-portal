import { withAuth } from "next-auth/middleware"

export const middleware = withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/auth/login",
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard", "/presentations/:path*", "/admin/:path*"],
}
