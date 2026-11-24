/**
 * Utilidades compartidas de la capa de integración con el backend.
 *
 * Aquí viven los helpers de conversión entre el formato institucional de la
 * UI (fechas `dd/mm/aaaa`, textos legibles) y el formato del backend
 * (`snake_case`, fechas ISO 8601, UUIDs).
 */

/** Parámetros aceptados por los helpers de consulta. */
export type ValorParametro = string | number | boolean | null | undefined;

/**
 * Construye un query string con `URLSearchParams` descartando claves vacías.
 *
 * Solo se incluyen los parámetros con valor, de modo que el backend aplique
 * sus valores por defecto (`limit` 100, orden natural, etc.) cuando un
 * filtro no se usa. Acepta cualquier objeto de filtros cuyos valores sean
 * escalares (`string`, `number`, `boolean`) o nulos.
 */
export function aQuery<T extends object>(parametros: T): string {
  const search = new URLSearchParams();
  const entradas = Object.entries(parametros) as [string, ValorParametro][];

  for (const [clave, valor] of entradas) {
    if (valor === undefined || valor === null || valor === "") continue;
    search.set(clave, String(valor));
  }

  const texto = search.toString();
  return texto ? `?${texto}` : "";
}

/** Lee una fecha del backend (`YYYY-MM-DD` o timestamp ISO) como `dd/mm/aaaa`. */
export function fechaLegible(valor?: string | null): string {
  const texto = String(valor ?? "").trim();
  if (!texto) return "";

  const soloFecha = texto.length >= 10 ? texto.slice(0, 10) : texto;
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(soloFecha);
  if (coincidencia) {
    return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
  }

  return texto;
}

/**
 * Convierte una fecha de la UI a ISO (`YYYY-MM-DD`) para el backend.
 * Acepta `dd/mm/aaaa`, `dd/mm/aa` no (solo 4 dígitos) y cadenas ISO.
 * Devuelve `null` cuando no hay una fecha válida (el backend ignora `null`).
 */
export function fechaISO(valor?: string | null): string | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  if (iso) return texto.slice(0, 10);

  const legible = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);
  if (!legible) return null;

  const dia = legible[1].padStart(2, "0");
  const mes = legible[2].padStart(2, "0");
  return `${legible[3]}-${mes}-${dia}`;
}

/** Conversión tolerante de montos del backend (numeric llega como string). */
export function numeroBackend(
  valor: string | number | null | undefined,
): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  const parseado = Number(String(valor ?? "").replace(",", "."));
  return Number.isFinite(parseado) ? parseado : 0;
}

/** `YYYY-MM-DDTHH:mm…` del backend → `dd/mm/aaaa` (solo la parte de fecha). */
export function fechaCreado(valor?: string | null): string {
  return fechaLegible(valor);
}
