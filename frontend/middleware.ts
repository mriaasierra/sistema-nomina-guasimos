import { NextResponse, type NextRequest } from "next/server";
import { CLAVE_COOKIE_SESION } from "./lib/config";

/**
 * Protección de navegación del panel.
 *
 * La cookie `guasimos_sesion` es solo una marca: no contiene el token.
 * Si no existe, el usuario nunca inició sesión (o cerró sesión), así que
 * se le redirige a `/login` antes de renderizar el panel.
 *
 * La validación real del token ocurre en `SessionProvider` mediante
 * `GET /api/auth/me`. Si el token expiró o el usuario fue desactivado,
 * el provider limpia la sesión y vuelve a `/login`.
 */
export function middleware(request: NextRequest) {
  const tieneMarca =
    request.cookies.get(CLAVE_COOKIE_SESION)?.value === "1";

  if (tieneMarca) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Solo las rutas del panel. `/login`, `/api` y los assets quedan fuera.
  matcher: [
    "/",
    "/personal/:path*",
    "/nomina/:path*",
    "/vacaciones/:path*",
    "/liquidaciones/:path*",
  ],
};
