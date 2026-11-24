"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  Calculator,
  Eye,
  Loader2,
  Printer,
  ReceiptText,
  X,
} from "lucide-react";
import LogoOficial from "@/components/LogoOficial";
import ModalPortal from "@/components/ModalPortal";
import PlanillaNominaTable from "@/components/PlanillaNominaTable";
import { PORCENTAJES_PROFESIONALIZACION } from "@/lib/cargos";
import {
  formatoMoneda,
  PORCENTAJES_DEDUCCION,
  PORCENTAJE_ANTIGUEDAD_MAXIMO,
  PORCENTAJE_ANTIGUEDAD_POR_ANIO,
  PRIMA_POR_HIJO,
  type CalculoNomina,
} from "@/lib/nomina";

interface PayrollProcessModalProps {
  open: boolean;
  onClose: () => void;
  calculos: CalculoNomina[];
  periodo: string;
  fechaPago: string;
  onVerRecibo: (calculo: CalculoNomina) => void;
  onConfirmar: () => void;
  /** Indica que la nómina viaja al backend (`POST /nominas-periodos`). */
  procesando?: boolean;
  /** Error devuelto por el backend, si lo hay. */
  error?: string;
}

export default function PayrollProcessModal({
  open,
  onClose,
  calculos,
  periodo,
  fechaPago,
  onVerRecibo,
  onConfirmar,
  procesando = false,
  error = "",
}: PayrollProcessModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const totalBase = calculos.reduce((s, c) => s + c.sueldoBase, 0);
  const totalOtorgar = calculos.reduce((s, c) => s + c.montoAOtorgar, 0);
  const totalDeducciones = calculos.reduce((s, c) => s + c.totalDed, 0);
  const totalPagar = calculos.reduce((s, c) => s + c.montoAPagar, 0);

  const porcentajesProfesionalizacion = Object.values(
    PORCENTAJES_PROFESIONALIZACION,
  ).filter((porcentaje) => porcentaje > 0);
  const minimaProfesionalizacion = Math.round(
    Math.min(...porcentajesProfesionalizacion) * 100,
  );
  const maximaProfesionalizacion = Math.round(
    Math.max(...porcentajesProfesionalizacion) * 100,
  );

  const resumenes = [
    { label: "Empleados a pagar", valor: String(calculos.length) },
    { label: "Monto a otorgar", valor: formatoMoneda(totalOtorgar) },
    { label: "Total deducciones", valor: formatoMoneda(totalDeducciones) },
    { label: "Monto a pagar", valor: formatoMoneda(totalPagar), destacado: true },
  ];

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proceso-title"
        className="flex max-h-[94vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60"
      >
        <div className="no-print flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <Calculator className="h-5 w-5" />
            </span>
            <div>
              <h2 id="proceso-title" className="text-base font-semibold text-ink">
                Planilla de Nómina · Formato Oficial
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {periodo} · {calculos.length} empleados activos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar proceso"
            className="rounded-lg p-2 text-muted transition hover:bg-card hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-card/40 p-4 sm:p-6">
          {(error || procesando) && (
            <div
              className={`no-print mb-4 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                error
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  : "border-gold/40 bg-gold/[0.08] text-gold-light"
              }`}
            >
              {error ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              )}
              {error || "Registrando el periodo y los pagos en el servidor…"}
            </div>
          )}
          <div className="print-target mx-auto max-w-[1600px] rounded-xl bg-white p-5 text-slate-900 shadow-xl sm:p-7">
            {/* Cabecera institucional con logo oficial */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#F97316] pb-4">
              <div className="flex items-center gap-3">
                <LogoOficial width={80} height={45} className="h-14 w-[90px]" />
                <div>
                  <p className="text-sm font-bold uppercase leading-tight tracking-wide text-royal-700">
                    Alcaldía Bolivariana del Municipio Guásimos
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Dirección de Recursos Humanos · Departamento de Nómina
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold tracking-tight text-slate-900">
                  PLANILLA DE NÓMINA
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-orange-600">
                  {periodo}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Fecha de pago: {fechaPago}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {resumenes.map((r) => (
                <div
                  key={r.label}
                  className={`rounded-lg border px-3 py-2.5 ${
                    r.destacado
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {r.label}
                  </p>
                  <p
                    className={`mt-1 ${
                      r.destacado
                        ? "text-xl font-bold text-orange-700"
                        : "text-base font-bold text-slate-900"
                    }`}
                  >
                    {r.valor}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <PlanillaNominaTable
                calculos={calculos}
                variant="light"
                onVerRecibo={onVerRecibo}
              />
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
              <ReceiptText className="mr-1 inline h-3 w-3 align-text-bottom" />
              Sueldo Base mensual según escala oficial · Quincena = 50% del Sueldo Base ·
              Profesionalización {minimaProfesionalizacion}% a {maximaProfesionalizacion}% según grado
              académico · Antigüedad {Math.round(PORCENTAJE_ANTIGUEDAD_POR_ANIO * 100)}% por año
              (máx. {Math.round(PORCENTAJE_ANTIGUEDAD_MAXIMO * 100)}%) · Prima por Hijo{" "}
              {formatoMoneda(PRIMA_POR_HIJO)} por hijo registrado · Deducciones: S.S.O. y P.I.E.
              fijos por cargo; F.A.O.V. {Math.round(PORCENTAJES_DEDUCCION.faov * 100)}% y T.S.S.{" "}
              {Math.round(PORCENTAJES_DEDUCCION.tss * 100)}% del Sueldo Base. Base acumulada:{" "}
              {formatoMoneda(totalBase)}.
            </p>

            <div className="no-print mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Recibos individuales:
              </span>
              {calculos.map((c) => (
                <button
                  key={c.empleado.id}
                  type="button"
                  onClick={() => onVerRecibo(c)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-royal-500 hover:text-royal-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {c.primerNombre} {c.primerApellido}
                </button>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div className="border-t border-slate-400 pt-2">
                Elaborado por · Dirección de Recursos Humanos
              </div>
              <div className="border-t border-slate-400 pt-2">
                Aprobado por · Alcaldía Bolivariana de Guásimos
              </div>
            </div>
          </div>
        </div>

        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/40 px-5 py-4 sm:px-6">
          <p className="hidden text-xs text-muted sm:block">
            {calculos.length} registros · Para imprimir use orientación horizontal.
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-gold/40 hover:text-gold"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-gold/50 hover:text-gold"
            >
              <Printer className="h-4 w-4" /> Imprimir planilla
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={procesando || calculos.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
            >
              {procesando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              {procesando ? "Procesando…" : "Confirmar y procesar"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
