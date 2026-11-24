/** Respuesta normalizada del endpoint interno `/api/tasa-bcv`. */
export interface RespuestaTasaBcv {
  /** 0 cuando no se pudo consultar la API; nunca se devuelve un valor histórico. */
  tasa: number;
  fechaActualizacion: string | null;
  esFallback: boolean;
}

const formateadorFecha = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formatea la fecha de la API sin depender de la zona horaria del navegador. */
export function formatearFechaTasa(valor?: string | null): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return formateadorFecha.format(fecha);
}
