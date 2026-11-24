/**
 * Configuración compartida del frontend.
 *
 * `API_URL` apunta al backend Express. El valor se normaliza sin barra final
 * para que las rutas se construyan siempre como `${API_URL}/api/...`.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/+$/, "");

/**
 * Marca de sesión legible por el middleware de Next.
 *
 * No contiene el token ni datos sensibles: solo indica que el navegador
 * tiene una sesión guardada. La validación real la hace `/api/auth/me`.
 */
export const CLAVE_COOKIE_SESION = "guasimos_sesion";

/** Duración de la marca de sesión, alineada con la expiración del JWT. */
export const DURACION_SESION_SEGUNDOS = 8 * 60 * 60;
