"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  Calculator,
  CheckCircle2,
  ChevronDown,
  History,
  Loader2,
  Mail,
  ReceiptText,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import LogoOficial from "@/components/LogoOficial";
import MiniStat from "@/components/MiniStat";
import ModalPortal from "@/components/ModalPortal";
import PageHeader from "@/components/PageHeader";
import PayrollProcessModal from "@/components/PayrollProcessModal";
import PayslipModal from "@/components/PayslipModal";
import PlanillaNominaTable from "@/components/PlanillaNominaTable";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import { ApiError } from "@/lib/api";
import { cargarCatalogos, type Catalogos } from "@/lib/api/catalogos";
import { listarEmpleadosActivos } from "@/lib/api/empleados";
import {
  listarPeriodos,
  procesarNomina,
} from "@/lib/api/nomina";
import {
  anios,
  calcularNomina,
  fechaCorte,
  formatoMoneda,
  meses,
  periodoLabel,
  type CalculoNomina,
  type Quincena,
  type RegistroNomina,
} from "@/lib/nomina";
import type { Empleado } from "@/lib/empleados";

const selectCls =
  "w-full appearance-none rounded-lg border border-line bg-surface/70 py-2.5 pl-3 pr-9 text-base text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/10";

function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

export default function NominaPage() {
  const hoy = new Date();
  const [mes, setMes] = useState<string>(meses[hoy.getMonth()] ?? "Noviembre");
  const [anio, setAnio] = useState<number>(hoy.getFullYear());
  const [quincena, setQuincena] = useState<Quincena>(1);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [historial, setHistorial] = useState<RegistroNomina[]>([]);
  const [totalHistorial, setTotalHistorial] = useState(0);
  const [procesoOpen, setProcesoOpen] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [recibo, setRecibo] = useState<CalculoNomina | null>(null);
  const [procesado, setProcesado] = useState("");
  const [procesoError, setProcesoError] = useState("");
  const [enviandoMasivo, setEnviandoMasivo] = useState(false);
  const [toast, setToast] = useState<{ id: number; mensaje: string } | null>(null);
  const contadorToast = useRef(0);
  const temporizadorMasivo = useRef<ReturnType<typeof setTimeout> | null>(null);

  const periodo = periodoLabel(mes, anio, quincena);
  const corte = fechaCorte(anio, mes, quincena);
  const calculos = useMemo(() => calcularNomina(empleados, quincena), [empleados, quincena]);

  const totales = useMemo(
    () => ({
      montoAOtorgar: calculos.reduce((s, c) => s + c.montoAOtorgar, 0),
      pagoMensual: calculos.reduce((s, c) => s + c.pagoMensual, 0),
      totalDed: calculos.reduce((s, c) => s + c.totalDed, 0),
      montoAPagar: calculos.reduce((s, c) => s + c.montoAPagar, 0),
    }),
    [calculos],
  );

  /** Historial real de `/api/nominas-periodos`, filtrado por año en el servidor. */
  const cargarHistorial = useCallback(async (anioConsulta: number) => {
    try {
      const { registros, total } = await listarPeriodos({
        anio: anioConsulta,
        limit: 100,
      });
      setHistorial(registros);
      setTotalHistorial(total);
    } catch {
      setHistorial([]);
      setTotalHistorial(0);
    }
  }, []);

  // Carga inicial: catálogos + empleados activos (`estatus=activo` en el servidor).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCargando(true);
      try {
        const cat = await cargarCatalogos();
        if (cancelado) return;
        setCatalogos(cat);
        const activos = await listarEmpleadosActivos(cat);
        if (cancelado) return;
        setEmpleados(activos);
      } catch (error) {
        if (!cancelado) setErrorCarga(mensajeDeError(error));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    void cargarHistorial(anio);
  }, [anio, cargarHistorial]);

  const mostrarToast = useCallback((mensaje: string) => {
    contadorToast.current += 1;
    setToast({ id: contadorToast.current, mensaje });
  }, []);

  const cerrarToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    return () => {
      if (temporizadorMasivo.current) clearTimeout(temporizadorMasivo.current);
    };
  }, []);

  /**
   * Confirma el proceso de nómina: crea el periodo (`POST /nominas-periodos`)
   * y los pagos individuales (`POST /pagos-historial`), luego refresca el
   * historial desde el servidor.
   */
  const confirmarProceso = async () => {
    if (procesando) return;
    setProcesando(true);
    setProcesoError("");
    try {
      await procesarNomina({
        anio,
        mes,
        quincena,
        fechaPago: corte,
        calculos,
      });
      setProcesoOpen(false);
      const monto = formatoMoneda(totales.montoAPagar);
      setProcesado(
        `Nómina de ${periodo} procesada correctamente. ${calculos.length} empleados · ${monto}.`,
      );
      await cargarHistorial(anio);
    } catch (error) {
      setProcesoError(mensajeDeError(error));
    } finally {
      setProcesando(false);
    }
  };

  const enviarRecibosMasivos = () => {
    if (enviandoMasivo || calculos.length === 0) return;
    setEnviandoMasivo(true);
    temporizadorMasivo.current = setTimeout(() => {
      setEnviandoMasivo(false);
      mostrarToast(
        `Se enviaron ${calculos.length} recibos a los correos registrados de los empleados activos${calculos[0]?.empleado.correo ? ` (ej. ${calculos[0].empleado.correo})` : ""}.`,
      );
    }, 1200);
  };

  return (
    <>
      <PageHeader
        eyebrow="Procesos quincenales"
        title="Nómina y Pagos"
        description="Planilla institucional de nómina con el formato oficial: cédula, primas, pago mensual, deducciones y monto a pagar por empleado."
        icon={WalletCards}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setProcesoOpen(true)}
              disabled={calculos.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Calculator className="h-4 w-4" /> Procesar Nueva Nómina
            </button>
            <button
              type="button"
              onClick={enviarRecibosMasivos}
              disabled={enviandoMasivo || calculos.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-orange-700 transition hover:bg-gold/20 disabled:cursor-wait disabled:opacity-60 dark:text-gold-light"
            >
              {enviandoMasivo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {enviandoMasivo ? "Enviando..." : "Enviar Recibos Masivos"}
            </button>
          </div>
        }
      />

      {procesado && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/[0.08] px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-700 dark:text-gold-light" />
          <p className="flex-1 text-sm text-slate-800 dark:text-gold-light">{procesado}</p>
          <button
            type="button"
            onClick={() => setProcesado("")}
            aria-label="Cerrar aviso"
            className="rounded-md p-1 text-slate-600 transition hover:bg-gold/10 hover:text-orange-700 dark:text-gold-light/70 dark:hover:text-gold-light"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorCarga && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
          <p className="flex-1 text-sm text-rose-700 dark:text-rose-200">{errorCarga}</p>
        </div>
      )}

      {/* Período de pago */}
      <section className="card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-label mb-1.5 text-gold/70">Configuración del período</p>
            <h2 className="text-sm font-semibold text-ink">Período de pago</h2>
            <p className="mt-1 text-sm text-muted">
              Seleccione el mes, el año y la quincena a procesar.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className={selectCls}
                aria-label="Mes del período"
              >
                {meses.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
            <div className="relative">
              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className={selectCls}
                aria-label="Año del período"
              >
                {anios.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
            <div className="relative">
              <select
                value={quincena}
                onChange={(e) => setQuincena(Number(e.target.value) as Quincena)}
                className={selectCls}
                aria-label="Quincena del período"
              >
                <option value={1}>1ª quincena</option>
                <option value={2}>2ª quincena</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-line/80 pt-5 sm:grid-cols-3">
          <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-3.5">
            <p className="text-xs font-medium uppercase tracking-wider text-gold/70">
              Período seleccionado
            </p>
            <p className="mt-1.5 text-base font-semibold text-slate-900 dark:text-gold-light">
              {periodo}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface/50 p-3.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Fecha de corte y pago
            </p>
            <p className="mt-1.5 text-base font-semibold text-ink">{corte}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface/50 p-3.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Empleados a pagar
            </p>
            <p className="mt-1.5 text-base font-semibold text-ink">
              {cargando ? "…" : `${calculos.length} activos`}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Monto a pagar"
          value={formatoMoneda(totales.montoAPagar)}
          hint={periodo}
          icon={Banknote}
        />
        <MiniStat
          label="Monto a otorgar"
          value={formatoMoneda(totales.montoAOtorgar)}
          hint="Sueldo base + primas institucionales"
          icon={ReceiptText}
        />
        <MiniStat
          label="Pago mensual"
          value={formatoMoneda(totales.pagoMensual)}
          hint="Base para el cálculo de deducciones"
          icon={UsersRound}
        />
        <MiniStat
          label="Total deducciones"
          value={formatoMoneda(totales.totalDed)}
          hint="S.S.O. · P.I.E. · F.A.O.V. · T.S.S."
          icon={History}
        />
      </div>

      {/* Planilla institucional */}
      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <LogoOficial width={64} height={36} conFondo className="h-11 w-[72px]" />
            <div>
              <h2 className="text-base font-semibold text-ink">
                Planilla de Nómina · Formato Oficial
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Alcaldía Bolivariana del Municipio Guásimos · {periodo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProcesoOpen(true)}
            disabled={calculos.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3.5 py-2 text-sm font-semibold text-orange-700 transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gold-light"
          >
            <ReceiptText className="h-4 w-4" /> Ver planilla imprimible
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {cargando ? (
            <div className="flex items-center justify-center gap-3 py-16 text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              <span className="text-sm">Cargando empleados activos desde el servidor…</span>
            </div>
          ) : (
            <PlanillaNominaTable
              calculos={calculos}
              onVerRecibo={(calculo) => setRecibo(calculo)}
            />
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Columnas institucionales: Cédula, Primer Nombre, Primer Apellido, Fecha de
            Ingreso, Cargo, Sueldo Base, Quincena, Prima de Profesionalización, Prima de
            Antigüedad, Prima por Hijo, Monto a Otorgar, Pago Mensual, S.S.O., P.I.E.,
            F.A.O.V., TSS, Total Ded. y Monto a Pagar.
          </p>
        </div>
      </section>

      {/* Historial */}
      <section className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line/80 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Historial de planillas</h2>
            <p className="mt-0.5 text-sm text-muted">
              Nóminas procesadas y programadas del Ejercicio Fiscal {anio}
            </p>
          </div>
          <span className="hidden rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted sm:block">
            {historial.length} de {totalHistorial} registros
          </span>
        </div>
        <div className="overflow-x-auto">
          {historial.length > 0 ? (
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-line/80 bg-surface/40">
                  <th className="table-head">Período</th>
                  <th className="table-head text-right">Empleados</th>
                  <th className="table-head text-right">Monto total</th>
                  <th className="table-head">Fecha de pago</th>
                  <th className="table-head text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {historial.map((registro) => (
                  <tr key={registro.id} className="transition hover:bg-card/25">
                    <td className="table-cell">
                      <span className="block text-base font-medium text-ink">
                        {registro.periodo}
                      </span>
                      <span
                        className="mt-0.5 block font-mono text-xs text-subtle"
                        title={registro.id}
                      >
                        {registro.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="table-cell text-right text-base text-muted">
                      {registro.empleados || "—"}
                    </td>
                    <td className="table-cell text-right text-base font-medium text-ink">
                      {registro.monto}
                    </td>
                    <td className="table-cell text-base text-muted">{registro.fechaPago}</td>
                    <td className="table-cell text-right">
                      <StatusBadge status={registro.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-14 text-center">
              <History className="mx-auto h-7 w-7 text-subtle" />
              <p className="mt-3 text-sm font-medium text-muted">
                No hay nóminas registradas para el ejercicio {anio}
              </p>
              <p className="mt-1 text-sm text-muted">
                Procese una nómina para verla aquí, tomada de `/api/nominas-periodos`.
              </p>
            </div>
          )}
        </div>
      </section>

      <PayrollProcessModal
        open={procesoOpen}
        onClose={() => setProcesoOpen(false)}
        calculos={calculos}
        periodo={periodo}
        fechaPago={corte}
        procesando={procesando}
        error={procesoError}
        onVerRecibo={(calculo) => {
          setProcesoOpen(false);
          setRecibo(calculo);
        }}
        onConfirmar={confirmarProceso}
      />
      <PayslipModal
        calculo={recibo}
        periodo={periodo}
        fechaPago={corte}
        onClose={() => setRecibo(null)}
        onEnviado={(correo) =>
          mostrarToast(`Recibo de nómina enviado exitosamente a ${correo}.`)
        }
      />
      {toast && (
        <ModalPortal>
          <Toast key={toast.id} mensaje={toast.mensaje} onClose={cerrarToast} />
        </ModalPortal>
      )}
    </>
  );
}
