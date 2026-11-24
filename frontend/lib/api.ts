/**
 * Cliente HTTP centralizado del frontend.
 *
 * Responsabilidades:
 *  - Adjuntar `Authorization: Bearer <token>` a toda petición a `/api/*`.
 *  - Interpretar el envelope del backend: `{ ok, data, meta }` y
 *    `{ ok: false, error: { message, details } }`.
 *  - Ante un `401`, limpiar la sesión local y redirigir a `/login`.
 */

import { cerrarSesion, obtenerSesion } from "./auth";
import { API_URL } from "./config";

export interface ApiMeta {
  total?: number;
  limit?: number;
  offset?: number;
  [clave: string]: unknown;
}

export interface ApiRespuesta<T> {
  data: T;
  meta?: ApiMeta;
  status: number;
}

export interface ApiInit extends Omit<RequestInit, "body"> {
  /** Cuerpo JSON: se serializa y se marca el Content-Type automáticamente. */
  json?: unknown;
  body?: BodyInit | null;
  /**
   * Si es `true` (por defecto), un 401 limpia la sesión y navega a `/login`.
   * El provider de sesión lo desactiva para manejar la redirección él mismo.
   */
  redirigir401?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly detalles?: unknown;

  constructor(mensaje: string, status: number, detalles?: unknown) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.detalles = detalles;
  }
}

function comoRegistro(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null;
}

function mensajeDeError(cuerpo: unknown): string | undefined {
  const raiz = comoRegistro(cuerpo);
  const error = comoRegistro(raiz?.error);
  const mensaje = error?.message ?? raiz?.message ?? raiz?.error;
  return typeof mensaje === "string" && mensaje.trim()
    ? mensaje.trim()
    : undefined;
}

function detallesDeError(cuerpo: unknown): unknown {
  const raiz = comoRegistro(cuerpo);
  const error = comoRegistro(raiz?.error);
  return error?.details ?? raiz?.details;
}

/** Evita duplicar `/api` si el llamador ya incluyó el prefijo. */
function normalizarRuta(ruta: string): string {
  const limpia = ruta.startsWith("/") ? ruta : `/${ruta}`;
  return limpia.startsWith("/api/") ? limpia.slice(4) : limpia;
}

/** Redirección completa: descarta estado en memoria y vuelve a montar `/login`. */
export function redirigirALogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.assign("/login");
}

/**
 * Ejecuta una petición autenticada contra `${API_URL}/api/*`.
 *
 * Devuelve `data` ya desempaquetado y, cuando existe, `meta` para paginación.
 * Los endpoints de autenticación (`/auth/login`, `/auth/me`) no usan `data`,
 * por lo que se devuelve el cuerpo completo como `data`.
 */
export async function apiFetch<T = unknown>(
  ruta: string,
  init: ApiInit = {},
): Promise<ApiRespuesta<T>> {
  const {
    redirigir401 = true,
    json,
    headers: headersInit,
    body: bodyInit,
    ...resto
  } = init;

  const sesion = obtenerSesion();
  if (!sesion?.token) {
    cerrarSesion();
    if (redirigir401) redirigirALogin();
    throw new ApiError("No hay una sesión activa.", 401);
  }

  const headers = new Headers(headersInit);
  headers.set("Authorization", `Bearer ${sesion.token}`);
  headers.set("Accept", "application/json");

  let body = bodyInit;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/api${normalizarRuta(ruta)}`, {
      ...resto,
      headers,
      body,
      cache: resto.cache ?? "no-store",
    });
  } catch {
    throw new ApiError(
      "No fue posible conectar con el servidor. Revise su conexión e intente nuevamente.",
      0,
    );
  }

  let cuerpo: unknown = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      cerrarSesion();
      if (redirigir401) redirigirALogin();
    }

    throw new ApiError(
      mensajeDeError(cuerpo) ?? `La solicitud falló (HTTP ${respuesta.status}).`,
      respuesta.status,
      detallesDeError(cuerpo),
    );
  }

  const registro = comoRegistro(cuerpo);
  const tieneEnvelope = registro !== null && "data" in registro;
  const data = (tieneEnvelope ? registro.data : registro) as T;
  const meta =
    registro !== null && "meta" in registro
      ? (registro.meta as ApiMeta)
      : undefined;

  return { data, meta, status: respuesta.status };
}

/** Atajos para los verbos más usados. */
export const api = {
  get: <T>(ruta: string, init: Omit<ApiInit, "method"> = {}) =>
    apiFetch<T>(ruta, { ...init, method: "GET" }),

  post: <T>(ruta: string, json?: unknown, init: Omit<ApiInit, "method"> = {}) =>
    apiFetch<T>(ruta, { ...init, method: "POST", json }),

  put: <T>(ruta: string, json?: unknown, init: Omit<ApiInit, "method"> = {}) =>
    apiFetch<T>(ruta, { ...init, method: "PUT", json }),

  patch: <T>(ruta: string, json?: unknown, init: Omit<ApiInit, "method"> = {}) =>
    apiFetch<T>(ruta, { ...init, method: "PATCH", json }),

  delete: <T>(ruta: string, init: Omit<ApiInit, "method"> = {}) =>
    apiFetch<T>(ruta, { ...init, method: "DELETE" }),
};
