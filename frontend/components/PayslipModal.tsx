"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, Printer, ReceiptText, X } from "lucide-react";
import LogoOficial from "@/components/LogoOficial";
import ModalPortal from "@/components/ModalPortal";
import PlanillaNominaTable from "@/components/PlanillaNominaTable";
import { formatoMoneda, nombreCompleto, type CalculoNomina } from "@/lib/nomina";

interface PayslipModalProps {
  calculo: CalculoNomina | null;
  periodo: string;
  fechaPago: string;
  onClose: () => void;
  onEnviado: (correo: string) => void;
}

export default function PayslipModal({
  calculo,
  periodo,
  fechaPago,
  onClose,
  onEnviado,
}: PayslipModalProps) {
  const [enviando, setEnviando] = useState(false);
  const [confirmandoCorreo, setConfirmandoCorreo] = useState(false);
  const [correo, setCorreo] = useState(calculo?.empleado.correo ?? "");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  useEffect(() => {
    if (!calculo) return;
    setCorreo(calculo.empleado.correo);
    setConfirmandoCorreo(false);
    setEnviando(false);
  }, [calculo]);

  useEffect(() => {
    if (!calculo) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmandoCorreo) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [calculo, confirmandoCorreo, onClose]);

  if (!calculo) return null;

  const { empleado } = calculo;
  const numeroRecibo = `RP-${empleado.id.replace("EMP-", "")}-${periodo.replace(/\D/g, "").slice(0, 6)}`;

  const enviarCorreo = () => {
    const destino = correo.trim();
    if (!destino || enviando) return;
    setEnviando(true);
    temporizador.current = setTimeout(() => {
      setEnviando(false);
      setConfirmandoCorreo(false);
      onEnviado(destino);
    }, 900);
  };

  const desglose = [
    ["Sueldo base", calculo.sueldoBase],
    ["Monto de quincena", calculo.quincena],
    ["Prima de profesionalización", calculo.primaProfesionalizacion],
    ["Prima de antigüedad", calculo.primaAntiguedad],
    ["Prima por hijo", calculo.primaPorHijo],
    ["Monto a otorgar", calculo.montoAOtorgar],
    ["S.S.O.", calculo.sso],
    ["P.I.E.", calculo.pje],
    ["F.A.O.V.", calculo.faov],
    ["T.S.S.", calculo.tss],
    ["Total deducciones", calculo.totalDed],
  ] as const;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !confirmandoCorreo) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recibo-title"
          className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60"
        >
          <div className="no-print flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                <ReceiptText className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h2 id="recibo-title" className="text-sm font-semibold text-ink">
                  Recibo de Pago Individual
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Formato oficial · {periodo}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar recibo"
              className="rounded-lg p-2 text-muted transition hover:bg-card hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-card/40 p-4 sm:p-6">
            <div className="print-target mx-auto max-w-6xl rounded-xl bg-white p-5 text-slate-900 shadow-xl sm:p-7">
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
                    RECIBO DE PAGO
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">N° {numeroRecibo}</p>
                  <p className="text-xs font-medium text-slate-500">{periodo}</p>
                  <p className="mt-1 text-xs font-bold text-orange-600">
                    Fecha de pago: {fechaPago}
                  </p>
                </div>
              </div>

              {/* Datos del trabajador */}
              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-slate-200 pb-5 text-sm sm:grid-cols-5">
                {[
                  ["Empleado", nombreCompleto(empleado)],
                  ["Cédula de identidad", empleado.cedula],
                  ["Cargo", empleado.cargo],
                  ["Fecha de ingreso", empleado.fechaIngreso],
                  ["Correo electrónico", empleado.correo],
                ].map(([label, valor]) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-0.5 break-all font-semibold text-slate-800">{valor}</p>
                  </div>
                ))}
              </div>

              {/* Desglose limpio de pagos y deducciones */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-royal-700">
                  Desglose individual · Importes en Bs.
                </p>
                <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  {desglose.map(([label, monto]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 border-b border-slate-200/80 py-1.5"
                    >
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {formatoMoneda(monto)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t-2 border-[#F97316] pt-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-orange-800">
                    Neto a cobrar
                  </span>
                  <span className="text-xl font-bold tabular-nums text-slate-900">
                    {formatoMoneda(calculo.montoAPagar)}
                  </span>
                </div>
              </div>

              {/* Planilla institucional: columnas oficiales exactas */}
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-royal-700">
                  Planilla institucional · 18 columnas · {calculo.quincenaNumero}ª quincena
                </p>
                <PlanillaNominaTable
                  calculos={[calculo]}
                  variant="light"
                  mostrarTotales={false}
                />
              </div>

              <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
                <div className="border-t border-slate-400 pt-2">
                  Elaborado por · Dirección de RRHH
                </div>
                <div className="border-t border-slate-400 pt-2">
                  Recibido por · {nombreCompleto(empleado)}
                </div>
              </div>
            </div>
          </div>

          <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/40 px-5 py-4">
            {confirmandoCorreo ? (
              <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-gold/40 bg-gold/[0.06] px-3 py-2">
                <Mail className="h-4 w-4 shrink-0 text-orange-700 dark:text-gold-light" />
                <label htmlFor="correo-recibo" className="text-xs font-semibold text-ink">
                  Correo del empleado:
                </label>
                <input
                  id="correo-recibo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="min-w-[220px] flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none transition focus:border-gold/60"
                />
                <button
                  type="button"
                  onClick={enviarCorreo}
                  disabled={enviando || !correo.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light disabled:cursor-wait disabled:opacity-70"
                >
                  {enviando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {enviando ? "Enviando..." : "Confirmar envío"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoCorreo(false)}
                  disabled={enviando}
                  className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-gold/40 hover:text-gold disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <p className="hidden text-xs text-muted sm:block">
                Para imprimir, seleccione orientación horizontal.
              </p>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={confirmandoCorreo}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-gold/40 hover:text-gold disabled:opacity-60"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-gold/40 hover:text-gold"
              >
                <Printer className="h-4 w-4" /> Imprimir recibo
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoCorreo(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light"
              >
                <Mail className="h-4 w-4" /> Enviar al correo
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
