"use client";

import { useEffect } from "react";
import { FileCheck2, Printer, X } from "lucide-react";
import LogoOficial from "@/components/LogoOficial";
import ModalPortal from "@/components/ModalPortal";
import {
  formatoFechaISO,
  formatoMoneda,
  nombreCompleto,
  type CalculoLiquidacion,
} from "@/lib/liquidaciones";

interface LiquidacionFiniquitoProps {
  calculo: CalculoLiquidacion;
  numero?: string;
  onClose: () => void;
}

export default function LiquidacionFiniquito({
  calculo,
  numero = "LIQ-PREVIO",
  onClose,
}: LiquidacionFiniquitoProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const { empleado } = calculo;
  const conceptos = [
    {
      codigo: "PS-010",
      concepto: "Prestaciones sociales",
      base: calculo.prestaciones.detalle,
      dias: calculo.prestaciones.dias,
      monto: calculo.prestaciones.monto,
    },
    {
      codigo: "VV-020",
      concepto: "Vacaciones vencidas / fraccionadas",
      base: calculo.vacaciones.detalle,
      dias: calculo.vacaciones.dias,
      monto: calculo.vacaciones.monto,
    },
    {
      codigo: "BV-030",
      concepto: "Bono vacacional fraccionado",
      base: calculo.bono.detalle,
      dias: calculo.bono.dias,
      monto: calculo.bono.monto,
    },
    {
      codigo: "UT-040",
      concepto: "Utilidades / aguinaldos fraccionados",
      base: calculo.utilidades.detalle,
      dias: calculo.utilidades.dias,
      monto: calculo.utilidades.monto,
    },
  ];

  const datos = [
    ["Empleado", nombreCompleto(empleado)],
    ["Cédula de identidad", empleado.cedula],
    ["Cargo", empleado.cargo],
    ["Dependencia", empleado.departamento],
    ["Fecha de ingreso", empleado.fechaIngreso],
    ["Fecha de retiro", formatoFechaISO(calculo.fechaRetiro)],
    ["Motivo de retiro", calculo.motivo],
    ["Antigüedad", calculo.antiguedad.texto],
    ["Sueldo base mensual", formatoMoneda(calculo.sueldoBase)],
    ["Sueldo diario", formatoMoneda(calculo.sueldoDiario)],
    ["Banco / Cuenta", `${empleado.banco} · ${empleado.numeroCuenta}`],
    ["Estatus del trabajador", empleado.estado],
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
        aria-labelledby="finiquito-title"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <FileCheck2 className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 id="finiquito-title" className="text-sm font-semibold text-ink">
                Vista previa · Hoja de Liquidación
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Documento oficial listo para imprimir · {numero}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="rounded-lg p-2 text-muted transition hover:bg-card hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-card/40 p-4 sm:p-6">
          <div className="print-target mx-auto max-w-3xl rounded-xl bg-slate-50 p-6 text-slate-900 shadow-xl sm:p-8">
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
                <p className="text-sm font-bold leading-tight tracking-tight text-slate-900">
                  HOJA DE LIQUIDACIÓN
                </p>
                <p className="text-sm font-bold uppercase tracking-wider text-orange-700">
                  Finiquito
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  N° {numero}
                </p>
                <p className="text-xs font-medium text-slate-400">
                  Fecha de emisión: {formatoFechaISO(calculo.fechaRetiro)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-slate-200 pb-5 text-sm">
              {datos.map(([label, valor]) => (
                <div key={label}>
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p className="mt-0.5 font-semibold text-slate-800">{valor}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-left text-sm uppercase tracking-wider text-slate-400">
                    <th className="py-2 font-semibold">Código</th>
                    <th className="py-2 font-semibold">Concepto</th>
                    <th className="py-2 font-semibold">Base de cálculo</th>
                    <th className="py-2 text-right font-semibold">Días</th>
                    <th className="py-2 text-right font-semibold">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {conceptos.map((c) => (
                    <tr key={c.codigo} className="border-b border-slate-100">
                      <td className="py-2 font-mono text-xs text-slate-400">{c.codigo}</td>
                      <td className="py-2 font-medium text-slate-800">{c.concepto}</td>
                      <td className="py-2 text-xs text-slate-400">{c.base}</td>
                      <td className="py-2 text-right font-medium text-slate-700">
                        {c.dias.toLocaleString("es-VE", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-800">
                        {formatoMoneda(c.monto)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-200 bg-rose-50">
                    <td className="py-2 font-mono text-xs text-rose-400">ANT-050</td>
                    <td className="py-2 font-medium text-rose-800">Anticipos previos</td>
                    <td className="py-2 text-xs text-rose-500">Descuento de adelantos</td>
                    <td className="py-2 text-right text-slate-400">—</td>
                    <td className="py-2 text-right font-semibold text-rose-700">
                      − {formatoMoneda(calculo.anticipos)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Subtotal de prestaciones y beneficios
              </span>
              <span className="text-base font-semibold text-slate-800">
                {formatoMoneda(calculo.subtotal)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border-2 border-[#F97316] bg-[#FBF6E7] px-4 py-4">
              <span className="text-sm font-bold uppercase tracking-wider text-orange-700">
                Monto neto total de liquidación
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {formatoMoneda(calculo.total)}
              </span>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              Se expide la presente hoja de liquidación a favor de{" "}
              <strong className="text-slate-700">{nombreCompleto(empleado)}</strong>, por
              terminación de la relación laboral con motivo de{" "}
              <strong className="text-slate-700">{calculo.motivo}</strong>, conforme a la
              normativa laboral vigente. Los cálculos se realizan con base en un sueldo
              diario de {formatoMoneda(calculo.sueldoDiario)}.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
              <div className="border-t border-slate-400 pt-2">
                Elaborado por · Dirección de Recursos Humanos
              </div>
              <div className="border-t border-slate-400 pt-2">
                Recibido por · {nombreCompleto(empleado)}
              </div>
            </div>
          </div>
        </div>

        <div className="no-print flex items-center justify-between gap-3 border-t border-line bg-surface/40 px-5 py-4">
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
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light"
          >
            <Printer className="h-4 w-4" /> Imprimir finiquito
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
