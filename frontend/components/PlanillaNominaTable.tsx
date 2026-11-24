"use client";

import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { formatoMoneda, type CalculoNomina } from "@/lib/nomina";

interface PlanillaNominaTableProps {
  calculos: CalculoNomina[];
  /** `auto` sigue el tema activo; `light`/`dark` fuerzan el formato (documentos imprimibles). */
  variant?: "auto" | "dark" | "light";
  mostrarTotales?: boolean;
  /** Si se indica, la cédula se convierte en acción para ver el recibo individual. */
  onVerRecibo?: (calculo: CalculoNomina) => void;
}

/** Columnas institucionales exactas del formato oficial de nómina. */
export const columnasPlanilla = [
  "Cédula",
  "Primer Nombre",
  "Primer Apellido",
  "Fecha de Ingreso",
  "Cargo",
  "Sueldo Base",
  "Quincena",
  "Prima de Profesionalización",
  "Prima de Antigüedad",
  "Prima por Hijo",
  "Monto a Otorgar",
  "Pago Mensual",
  "S.S.O.",
  "P.I.E.",
  "F.A.O.V.",
  "TSS",
  "Total Ded.",
  "Monto a Pagar",
] as const;

const suma = (calculos: CalculoNomina[], clave: keyof CalculoNomina) =>
  calculos.reduce((total, c) => total + Number(c[clave] ?? 0), 0);

export default function PlanillaNominaTable({
  calculos,
  variant = "auto",
  mostrarTotales = true,
  onVerRecibo,
}: PlanillaNominaTableProps) {
  const thCls =
    "whitespace-nowrap border-b px-2.5 py-2.5 text-left text-[11px] font-bold uppercase leading-tight tracking-wide " +
    (variant === "light"
      ? "border-slate-400 bg-slate-100 text-slate-800"
      : variant === "dark"
        ? "border-slate-700 bg-slate-900/70 text-slate-300"
        : "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300");

  const tdBase =
    "whitespace-nowrap border-b px-2.5 py-2.5 text-sm " +
    (variant === "light"
      ? "border-slate-200 text-slate-800"
      : variant === "dark"
        ? "border-slate-800 text-slate-200"
        : "border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-200");

  const tdNum = `${tdBase} text-right font-medium tabular-nums`;
  const tdTexto = `${tdBase} font-medium`;
  const highlight =
    variant === "light"
      ? "font-bold text-orange-700"
      : variant === "dark"
        ? "font-bold text-gold-light"
        : "font-bold text-orange-700 dark:text-gold-light";

  const totales = {
    sueldoBase: suma(calculos, "sueldoBase"),
    quincena: suma(calculos, "quincena"),
    primaProfesionalizacion: suma(calculos, "primaProfesionalizacion"),
    primaAntiguedad: suma(calculos, "primaAntiguedad"),
    primaPorHijo: suma(calculos, "primaPorHijo"),
    montoAOtorgar: suma(calculos, "montoAOtorgar"),
    pagoMensual: suma(calculos, "pagoMensual"),
    sso: suma(calculos, "sso"),
    pje: suma(calculos, "pje"),
    faov: suma(calculos, "faov"),
    tss: suma(calculos, "tss"),
    totalDed: suma(calculos, "totalDed"),
    montoAPagar: suma(calculos, "montoAPagar"),
  };

  const celdasTotales: ReactNode[] = [
    formatoMoneda(totales.sueldoBase),
    formatoMoneda(totales.quincena),
    formatoMoneda(totales.primaProfesionalizacion),
    formatoMoneda(totales.primaAntiguedad),
    formatoMoneda(totales.primaPorHijo),
    formatoMoneda(totales.montoAOtorgar),
    formatoMoneda(totales.pagoMensual),
    formatoMoneda(totales.sso),
    formatoMoneda(totales.pje),
    formatoMoneda(totales.faov),
    formatoMoneda(totales.tss),
    formatoMoneda(totales.totalDed),
    <span key="monto" className={highlight}>
      {formatoMoneda(totales.montoAPagar)}
    </span>,
  ];

  return (
    <div
      className={`planilla-print-wrapper overflow-x-auto rounded-xl border ${
        variant === "light"
          ? "border-slate-300"
          : variant === "dark"
            ? "border-slate-700/80"
            : "border-slate-300 dark:border-slate-700/80"
      }`}
    >
      <table className={`planilla-table w-full min-w-[2100px] border-collapse text-sm`}>
        <thead>
          <tr>
            {columnasPlanilla.map((columna) => (
              <th key={columna} scope="col" className={thCls}>
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calculos.map((c) => (
            <tr
              key={c.empleado.id}
              className={
                variant === "light"
                  ? "hover:bg-slate-50"
                  : variant === "dark"
                    ? "transition hover:bg-slate-800/30"
                    : "transition hover:bg-slate-50 dark:hover:bg-slate-800/30"
              }
            >
              <td className={`${tdTexto} font-mono text-xs`}>
                {onVerRecibo ? (
                  <button
                    type="button"
                    onClick={() => onVerRecibo(c)}
                    title="Ver recibo individual"
                    aria-label={`Ver recibo de ${c.primerNombre} ${c.primerApellido}`}
                    className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 font-mono text-xs font-semibold text-orange-700 transition hover:bg-orange-50 hover:text-orange-800 dark:text-gold-light dark:hover:bg-gold/10 dark:hover:text-gold"
                  >
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    <span>{c.cedula}</span>
                  </button>
                ) : (
                  c.cedula
                )}
              </td>
              <td className={tdTexto}>{c.primerNombre}</td>
              <td className={tdTexto}>{c.primerApellido}</td>
              <td className={tdBase}>{c.fechaIngreso}</td>
              <td className={tdTexto}>{c.cargo}</td>
              <td className={tdNum}>{formatoMoneda(c.sueldoBase)}</td>
              <td className={tdNum}>
                {formatoMoneda(c.quincena)}
                <span
                  className={`mt-0.5 block text-[10px] font-normal ${
                    variant === "light"
                      ? "text-slate-500"
                      : variant === "dark"
                        ? "text-slate-400"
                        : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {c.quincenaNumero}ª
                </span>
              </td>
              <td className={tdNum}>{formatoMoneda(c.primaProfesionalizacion)}</td>
              <td className={tdNum}>{formatoMoneda(c.primaAntiguedad)}</td>
              <td className={tdNum}>{formatoMoneda(c.primaPorHijo)}</td>
              <td className={tdNum}>{formatoMoneda(c.montoAOtorgar)}</td>
              <td className={tdNum}>{formatoMoneda(c.pagoMensual)}</td>
              <td className={tdNum}>{formatoMoneda(c.sso)}</td>
              <td className={tdNum}>{formatoMoneda(c.pje)}</td>
              <td className={tdNum}>{formatoMoneda(c.faov)}</td>
              <td className={tdNum}>{formatoMoneda(c.tss)}</td>
              <td className={tdNum}>{formatoMoneda(c.totalDed)}</td>
              <td className={`${tdNum} ${highlight}`}>{formatoMoneda(c.montoAPagar)}</td>
            </tr>
          ))}
        </tbody>
        {mostrarTotales && calculos.length > 0 && (
          <tfoot>
            <tr
              className={`border-t-2 border-gold font-bold ${
                variant === "light"
                  ? "bg-orange-50 text-slate-900"
                  : variant === "dark"
                    ? "bg-royal-900/40 text-white"
                    : "bg-orange-50 text-slate-900 dark:bg-royal-900/40 dark:text-white"
              }`}
            >
              <td colSpan={5} className="whitespace-nowrap border-b px-3 py-3 text-sm uppercase tracking-wide">
                Totales · {calculos.length} empleados
              </td>
              {celdasTotales.map((celda, indice) => (
                <td
                  key={indice}
                  className={`whitespace-nowrap border-b px-2.5 py-3 text-right text-sm font-bold tabular-nums ${
                    indice === celdasTotales.length - 1 ? highlight : ""
                  }`}
                >
                  {celda}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
