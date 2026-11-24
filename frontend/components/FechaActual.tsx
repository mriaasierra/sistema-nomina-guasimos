"use client";

import { useEffect, useState } from "react";

type Variante = "extensa" | "mesAnio" | "actualizacion" | "corta";

interface FechaActualProps {
  variante?: Variante;
  className?: string;
}

const LOCALE = "es-VE";

function capitalizar(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase(LOCALE) + texto.slice(1);
}

function formatearFecha(fecha: Date, variante: Variante): string {
  switch (variante) {
    case "mesAnio": {
      const mes = capitalizar(
        new Intl.DateTimeFormat(LOCALE, { month: "long" }).format(fecha),
      );
      const anio = new Intl.DateTimeFormat(LOCALE, { year: "numeric" }).format(fecha);
      return `${mes} ${anio}`;
    }
    case "actualizacion":
      return new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(fecha);
    case "corta":
      return capitalizar(
        new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long" }).format(fecha),
      );
    case "extensa":
    default:
      return capitalizar(
        new Intl.DateTimeFormat(LOCALE, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(fecha),
      );
  }
}

/**
 * Fecha del sistema en español. El primer render es estable (sin `new Date`)
 * para evitar desfases entre servidor y cliente; después se actualiza cada minuto.
 */
export default function FechaActual({
  variante = "extensa",
  className,
}: FechaActualProps) {
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const actualizar = () => setTexto(formatearFecha(new Date(), variante));
    actualizar();
    const temporizador = window.setInterval(actualizar, 60_000);
    return () => window.clearInterval(temporizador);
  }, [variante]);

  return <span className={className}>{texto || "…"}</span>;
}
