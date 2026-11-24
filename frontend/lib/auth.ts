/**
 * Servicio de autenticación del frontend.
 *
 * Centraliza el login contra `POST /api/auth/login`, la persistencia de la
 * sesión y la marca de navegación que usa el middleware para proteger el
 * panel. El token se guarda en `localStorage`; la cookie solo indica que hay
 * una sesión y se valida de verdad con `GET /api/auth/me`.
 */

import {
  API_URL,
  CLAVE_COOKIE_SESION,
  DURACION_SESION_SEGUNDOS,
} from "./config";

const CLAVE_SESION = "sesion-guasimos";

export interface CredencialesLogin {
  identificador: string;
  contrasena: string;
}

/** Proyección pública del usuario que devuelve el backend. */
export interface UsuarioSesion {
  id: string;
  usuario: string;
  email?: string;
  nombre?: string;
  rol?: string;
  activo?: boolean;
  ultimo_login?: string | null;
}

export interface Sesion {
  token: string;
  usuario?: UsuarioSesion;
  obtenidoEn: string;
}

export type AuthErrorCode =
  | "credenciales"
  | "inactivo"
  | "servicio"
  | "red"
  | "respuesta";

export class AuthError extends Error {
  readonly codigo: AuthErrorCode;
  readonly status?: number;

  constructor(mensaje: string, codigo: AuthErrorCode, status?: number) {
    super(mensaje);
    this.name = "AuthError";
    this.codigo = codigo;
    this.status = status;
  }
}

function comoRegistro(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() ? valor.trim() : undefined;
}

function extraerToken(cuerpo: unknown): string | undefined {
  const raiz = comoRegistro(cuerpo);
  if (!raiz) return undefined;

  const datos = comoRegistro(raiz.data) ?? raiz;
  const sesion = comoRegistro(datos.session);

  return (
    texto(raiz.token) ??
    texto(datos.token) ??
    texto(datos.access_token) ??
    texto(datos.accessToken) ??
    texto(sesion?.access_token) ??
    texto(sesion?.token)
  );
}

function extraerUsuario(cuerpo: unknown): UsuarioSesion | undefined {
  const raiz = comoRegistro(cuerpo);
  if (!raiz) return undefined;
  const datos = comoRegistro(raiz.data) ?? raiz;
  const candidato = datos.usuario ?? datos.user ?? raiz.usuario ?? raiz.user;
  const usuario = comoRegistro(candidato);
  return usuario ? (usuario as unknown as UsuarioSesion) : undefined;
}

function extraerMensaje(cuerpo: unknown): string | undefined {
  const raiz = comoRegistro(cuerpo);
  if (!raiz) return undefined;
  const error = comoRegistro(raiz.error);
  return texto(error?.message) ?? texto(raiz.message);
}

/**
 * Envía las credenciales a la API. Centraliza la URL base, el contenido
 * JSON y la interpretación de errores para que el formulario solo muestre
 * mensajes amigables.
 */
export async function iniciarSesion(
  credenciales: CredencialesLogin,
): Promise<Sesion> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identificador: credenciales.identificador.trim(),
        contrasena: credenciales.contrasena,
      }),
    });
  } catch {
    throw new AuthError(
      "No fue posible conectar con el servidor. Revise su conexión e intente nuevamente.",
      "red",
    );
  }

  let cuerpo: unknown = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  if (!respuesta.ok) {
    const mensajeServidor = extraerMensaje(cuerpo);

    if (respuesta.status === 401) {
      throw new AuthError(
        "El usuario o la contraseña son incorrectos.",
        "credenciales",
        401,
      );
    }
    if (respuesta.status === 403) {
      throw new AuthError(
        "Este usuario está inactivo. Comuníquese con el administrador del sistema.",
        "inactivo",
        403,
      );
    }
    if (respuesta.status === 404 || respuesta.status === 501) {
      throw new AuthError(
        "El servicio de autenticación aún no está disponible. Intente más tarde.",
        "servicio",
        respuesta.status,
      );
    }
    if (respuesta.status >= 500) {
      throw new AuthError(
        "El servidor no pudo procesar la solicitud. Intente nuevamente en unos minutos.",
        "servicio",
        respuesta.status,
      );
    }

    throw new AuthError(
      mensajeServidor ??
        "No se pudo iniciar sesión. Revise sus datos e intente nuevamente.",
      "respuesta",
      respuesta.status,
    );
  }

  const token = extraerToken(cuerpo);
  if (!token) {
    throw new AuthError(
      "El servidor no devolvió un token de sesión válido.",
      "respuesta",
      respuesta.status,
    );
  }

  const sesion: Sesion = {
    token,
    usuario: extraerUsuario(cuerpo),
    obtenidoEn: new Date().toISOString(),
  };

  guardarSesion(sesion);
  return sesion;
}

/** Marca de navegación para que el middleware deje pasar al panel. */
function marcarCookieSesion(): void {
  if (typeof document === "undefined") return;
  const seguro =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${CLAVE_COOKIE_SESION}=1; Path=/; Max-Age=${DURACION_SESION_SEGUNDOS}; SameSite=Lax${seguro}`;
}

function borrarCookieSesion(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CLAVE_COOKIE_SESION}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Persiste la sesión de forma ordenada y tolerante a almacenamiento bloqueado. */
export function guardarSesion(sesion: Sesion): void {
  try {
    window.localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Modo incógnito o almacenamiento deshabilitado: la sesión vive en memoria.
  }
  marcarCookieSesion();
}

export function obtenerSesion(): Sesion | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE_SESION);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as Partial<Sesion>;
    return typeof datos.token === "string" && datos.token
      ? (datos as Sesion)
      : null;
  } catch {
    return null;
  }
}

/**
 * Refresca los datos públicos del usuario (por ejemplo, después de `/me`)
 * sin alterar el token ni la fecha original de obtención.
 */
export function actualizarUsuarioSesion(usuario: UsuarioSesion | undefined): void {
  if (!usuario) return;
  const actual = obtenerSesion();
  if (!actual) return;
  guardarSesion({ ...actual, usuario });
}

export function cerrarSesion(): void {
  try {
    window.localStorage.removeItem(CLAVE_SESION);
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
  borrarCookieSesion();
}
