"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, Landmark } from "lucide-react";
import FechaActual from "@/components/FechaActual";
import { formatoMoneda } from "@/lib/empleados";
import type { RespuestaTasaBcv } from "@/lib/tasa-bcv";

type EstadoTasa = "cargando" | "en-vivo" | "sin-conexion";

/** Tarjeta del indicador BCV: solo muestra la tasa vigente consultada en tiempo real. */
export default function TasaBcvCard() {
  const [tasa, setTasa] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoTasa>("cargando");

  useEffect(() => {
    const controlador = new AbortController();

    fetch("/api/tasa-bcv", {
      signal: controlador.signal,
      cache: "no-store",
    })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("No se pudo obtener la tasa");
        return respuesta.json() as Promise<RespuestaTasaBcv>;
      })
      .then((datos) => {
        if (
          datos?.esFallback ||
          typeof datos?.tasa !== "number" ||
          !Number.isFinite(datos.tasa) ||
          datos.tasa <= 0
        ) {
          setTasa(null);
          setEstado("sin-conexion");
          return;
        }
        setTasa(datos.tasa);
        setEstado("en-vivo");
      })
      .catch(() => {
        setTasa(null);
        setEstado("sin-conexion");
      });

    return () => controlador.abort();
  }, []);

  const monto =
    estado === "en-vivo" && tasa !== null ? formatoMoneda(tasa) : "Bs. 00,00";
  const detalle =
    estado === "en-vivo"
      ? "En tiempo real"
      : estado === "cargando"
        ? "Consultando tasa…"
        : "Sin conexión";
  const indicador =
    estado === "en-vivo"
      ? "bg-emerald-500 dark:bg-emerald-400"
      : estado === "cargando"
        ? "bg-amber-500 animate-pulse"
        : "bg-amber-500";

  return (
    <section className="card relative overflow-hidden border-gold/25 p-5">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-70 blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.22), transparent 70%)" }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="section-label text-gold/70">Indicador económico</p>
          <h2 className="mt-1.5 text-sm font-semibold text-ink">Tasa BCV vigente</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
          <CircleDollarSign className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </span>
      </div>

      <div className="relative mt-5 flex items-end gap-2">
        <span className="text-4xl font-semibold leading-none tracking-tight text-ink">
          <span className="gold-text">{monto}</span>
        </span>
      </div>
      <p
        className="relative mt-1.5 flex items-center gap-1.5 text-sm text-muted"
        aria-live="polite"
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${indicador}`} />
        Bs. por 1 USD · {detalle}
      </p>

      {estado === "sin-conexion" && (
        <p className="relative mt-2 text-xs text-subtle">
          No se pudo consultar la tasa actual. Verifique su conexión.
        </p>
      )}

      <div className="relative mt-4 -mx-1">
        <svg viewBox="0 0 240 64" className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 52 L24 47 L48 50 L72 39 L96 43 L120 31 L144 34 L168 23 L192 27 L216 15 L240 10 L240 64 L0 64 Z"
            fill="url(#sparkFill)"
          />
          <path
            d="M0 52 L24 47 L48 50 L72 39 L96 43 L120 31 L144 34 L168 23 L192 27 L216 15 L240 10"
            fill="none"
            stroke="#F97316"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative flex items-center justify-between border-t border-gold/15 pt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Landmark className="h-3 w-3 text-gold/70" /> Banco Central de Venezuela
        </span>
        <FechaActual variante="extensa" />
      </div>
    </section>
  );
}
