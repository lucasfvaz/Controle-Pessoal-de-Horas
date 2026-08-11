import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/",
    "/ponto/:path*",
    "/semana/:path*",
    "/aulas/:path*",
    "/calendario/:path*",
    "/historico/:path*",
    "/banco/:path*",
    "/configuracoes/:path*",
    "/api/settings/:path*",
    "/api/punches/:path*",
    "/api/classes/:path*",
    "/api/planning/:path*",
    "/api/dashboard/:path*",
    "/api/history/:path*",
    "/api/bank/:path*",
    "/api/calendar/:path*",
    "/api/holidays/:path*",
  ],
};
