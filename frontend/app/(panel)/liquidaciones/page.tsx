"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  BadgeDollarSign,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileCheck2,
  FileText,
  Gift,
  Hourglass,
  Info,
  Landmark,
  Loader2,
  Save,
  Sparkles,
  Umbrella,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import LiquidacionFiniquito from "@/components/LiquidacionFiniquito";
import MiniStat from "@/components/MiniStat";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { useSession } from "@/components/SessionProvider";
import { ApiError } from "@/lib/api";
import { cargarCatalogos } from "@/lib/api/catalogos";
import { listarEmpleados } from "@/lib/api/empleados";
import {
  crearLiquidacion,
  listarLiquidaciones,
  listarPrestaciones,
  listarUtilidades,
  type PrestacionRow,
  type UtilidadRow,
} from "@/lib/api/liquidaciones";
import type { Empleado } from "@/lib/empleados";
import {
  calcularLiquidacion,
  formatoFechaISO,
  formatoMoneda,
  isoDesdeTexto,
  motivosRetiro,
  nombreCompleto,
  type LiquidacionRegistro,
  type MotivoRetiro,
} from "@/lib/liquidaciones";
import { numeroBackend } from "@/lib/api/comunes";

const selectCls =
  "w-full appearance-none rounded-lg border border-line/70 bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/10";
const inputCls =
  "w-full rounded-lg border border-line/70 bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-subtle focus:border-gold/60 focus:ring-2 focus:ring-gold/10 [color-scheme:light] dark:[color-scheme:dark]";
const labelCls = "mb-1.5 block text-sm font-medium text-muted";

type PestannaHistorial = "liquidaciones" | "prestaciones" | "utilidades";

function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

export default function LiquidacionesPage() {
  const { usuario } = useSession();
  const [empleadoId, setEmpleadoId] = useState("");
  const [fechaRetiro, setFechaRetiro] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState<MotivoRetiro>("Renuncia");
  const [diasVacaciones, setDiasVacaciones] = useState("15");
  const [anticipos, setAnticipos] = useState("0");
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [historial, setHistorial] = useState<LiquidacionRegistro[]>([]);
  const [prestaciones, setPrestaciones] = useState<PrestacionRow[]>([]);
  const [utilidades, setUtilidades] = useState<UtilidadRow[]>([]);
  const [pestanna, setPestanna] = useState<PestannaHistorial>("liquidaciones");
  const [documento, setDocumento] = useState<LiquidacionRegistro | null>(null);
  const [notice, setNotice] = useState("");
  const [errorAviso, setErrorAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const resolverEmpleado = useCallback(
    (id: string): Empleado | undefined => empleados.find((emp) => emp.id === id),
    [empleados],
  );

  /** Carga los tres historiales reales del backend. */
  const cargarHistoriales = useCallback(async (listaEmpleados: Empleado[]) => {
    const resolver = (id: string) => listaEmpleados.find((e) => e.id === id);
    const [liq, prest, util] = await Promise.all([
      listarLiquidaciones({ limit: 100 }, resolver),
      listarPrestaciones({ limit: 100 }),
      listarUtilidades({ limit: 100 }),
    ]);
    setHistorial(liq.registros);
    setPrestaciones(prest.filas);
    setUtilidades(util.filas);
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCargando(true);
      setErrorAviso("");
      try {
        const catalogos = await cargarCatalogos();
        const { empleados: lista } = await listarEmpleados(
          { limit: 500, orderBy: "apellidos", orderDir: "asc" },
          catalogos,
        );
        if (cancelado) return;
        setEmpleados(lista);
        setEmpleadoId((prev) =>
          prev && lista.some((e) => e.id === prev) ? prev : (lista[0]?.id ?? ""),
        );
        await cargarHistoriales(lista);
      } catch (error) {
        if (!cancelado) setErrorAviso(mensajeDeError(error));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [cargarHistoriales]);

  const empleado =
    empleados.find((e) => e.id === empleadoId) ?? empleados[0] ?? null;
  const ingresoISO = empleado ? isoDesdeTexto(empleado.fechaIngreso) : "";
  const fechaValida = Boolean(empleado && fechaRetiro && fechaRetiro >= ingresoISO);

  const calculo = useMemo(
    () =>
      empleado
        ? calcularLiquidacion(
            empleado,
            fechaRetiro,
            motivo,
            Number(diasVacaciones) || 0,
            Number(anticipos) || 0,
          )
        : null,
    [empleado, fechaRetiro, motivo, diasVacaciones, anticipos],
  );

  const pagadas = historial.filter((h) => h.estado === "Pagado").length;
  const enRevision = historial.filter((h) => h.estado === "En revisión").length;
  const pendientes = historial.filter((h) => h.estado === "Pendiente").length;

  const conceptos: {
    label: string;
    dias: number;
    monto: number;
    detalle: string;
    icon: LucideIcon;
    tone: string;
  }[] = calculo
    ? [
        {
          label: "Prestaciones Sociales",
          dias: calculo.prestaciones.dias,
          monto: calculo.prestaciones.monto,
          detalle: calculo.prestaciones.detalle,
          icon: Landmark,
          tone: "border-gold/30 bg-gold/[0.06] text-gold",
        },
        {
          label: "Vacaciones Vencidas o Fraccionadas",
          dias: calculo.vacaciones.dias,
          monto: calculo.vacaciones.monto,
          detalle: calculo.vacaciones.detalle,
          icon: Umbrella,
          tone: "border-sky-500/25 bg-sky-500/[0.06] text-sky-300",
        },
        {
          label: "Bono Vacacional Fraccionado",
          dias: calculo.bono.dias,
          monto: calculo.bono.monto,
          detalle: calculo.bono.detalle,
          icon: Gift,
          tone: "border-violet-500/25 bg-violet-500/[0.06] text-violet-300",
        },
        {
          label: "Utilidades / Aguinaldos Fraccionados",
          dias: calculo.utilidades.dias,
          monto: calculo.utilidades.monto,
          detalle: calculo.utilidades.detalle,
          icon: Wallet,
          tone: "border-emerald-500/25 bg-emerald-500/[0.06] text-gold-light",
        },
      ]
    : [];

  const verDocumentoActual = () => {
    if (!calculo || !fechaValida) return;
    setDocumento({
      ...calculo,
      id: "LIQ-PREVIO",
      estado: "En revisión",
      fechaRegistro: formatoFechaISO(new Date().toISOString().slice(0, 10)),
    });
  };

  /** `POST /api/liquidaciones` con el desglose completo del cálculo. */
  const registrarLiquidacion = async () => {
    if (!calculo || !fechaValida || !empleado) return;
    setGuardando(true);
    setErrorAviso("");
    try {
      await crearLiquidacion(calculo, empleado.id, usuario.id || undefined);
      await cargarHistoriales(empleados);
      setNotice(
        `Liquidación registrada para ${nombreCompleto(empleado)} · ${formatoMoneda(calculo.total)}.`,
      );
    } catch (error) {
      setErrorAviso(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Finiquitos y prestaciones"
        title="Liquidaciones"
        description="Calcule y genere la hoja de liquidación por terminación de la relación laboral, con el desglose de prestaciones y beneficios proporcionales."
        icon={FileText}
        action={
          <button
            type="button"
            onClick={() =>
              document.getElementById("calculo-liquidacion")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light"
          >
            <Sparkles className="h-4 w-4" /> Nueva liquidación
          </button>
        }
      />

      {notice && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/[0.08] px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-light" />
          <p className="flex-1 text-sm text-gold-light">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Cerrar aviso"
            className="rounded-md p-1 text-gold-light/70 transition hover:bg-gold/10 hover:text-gold-light"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorAviso && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
          <p className="flex-1 text-sm text-rose-700 dark:text-rose-200">{errorAviso}</p>
          <button
            type="button"
            onClick={() => setErrorAviso("")}
            aria-label="Cerrar aviso"
            className="rounded-md p-1 text-muted transition hover:bg-card hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat
          label="Pagadas en el directorio"
          value={String(pagadas)}
          hint={`Última: ${historial.find((h) => h.estado === "Pagado")?.fechaRegistro ?? "—"}`}
          icon={BadgeDollarSign}
        />
        <MiniStat
          label="En revisión"
          value={String(enRevision)}
          hint="Documentación en trámite"
          icon={Hourglass}
        />
        <MiniStat
          label="Pendientes"
          value={String(pendientes)}
          hint="Requieren cálculo / aprobación"
          icon={FileCheck2}
        />
      </div>

      {/* Cálculo de liquidación */}
      <section id="calculo-liquidacion" className="card mt-5 scroll-mt-6 p-5">
        <div className="flex items-start gap-3 border-b border-line/80 pb-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <p className="section-label mb-1 text-gold/70">Calculadora y generador de finiquito</p>
            <h2 className="text-sm font-semibold text-ink">Calcular liquidación</h2>
            <p className="mt-1 text-sm text-muted">
              Seleccione al empleado, la fecha y el motivo de retiro. Los conceptos se
              actualizan automáticamente.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="sm:col-span-2 xl:col-span-1">
            <span className={labelCls}>Empleado</span>
            <div className="relative">
              <select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                className={`${selectCls} pr-8`}
                aria-label="Empleado a liquidar"
              >
                {empleados.length === 0 && <option value="">Sin empleados</option>}
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {nombreCompleto(e)} · {e.cedula}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          </label>

          <label>
            <span className={labelCls}>Fecha de retiro</span>
            <input
              type="date"
              value={fechaRetiro}
              onChange={(e) => setFechaRetiro(e.target.value)}
              className={inputCls}
              aria-label="Fecha de retiro"
            />
          </label>

          <label>
            <span className={labelCls}>Motivo de retiro</span>
            <div className="relative">
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as MotivoRetiro)}
                className={`${selectCls} pr-8`}
                aria-label="Motivo de retiro"
              >
                {motivosRetiro.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          </label>

          <label>
            <span className={labelCls}>Días de vacaciones pendientes</span>
            <input
              type="number"
              min="0"
              max="90"
              step="1"
              value={diasVacaciones}
              onChange={(e) => setDiasVacaciones(e.target.value)}
              className={inputCls}
              aria-label="Días de vacaciones pendientes"
            />
          </label>

          <label>
            <span className={labelCls}>Anticipos previos (Bs.)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={anticipos}
              onChange={(e) => setAnticipos(e.target.value)}
              className={inputCls}
              aria-label="Anticipos previos"
            />
          </label>
        </div>

        {calculo && empleado && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line/80 pt-5 sm:grid-cols-4">
            {[
              ["Fecha de ingreso", empleado.fechaIngreso || "—"],
              ["Antigüedad", calculo.antiguedad.texto],
              ["Sueldo base", formatoMoneda(empleado.sueldoBase)],
              ["Sueldo diario", formatoMoneda(calculo.sueldoDiario)],
            ].map(([label, valor]) => (
              <div key={label} className="rounded-xl border border-line bg-surface/50 p-3">
                <p className="text-sm font-medium uppercase tracking-wider text-muted">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{valor}</p>
              </div>
            ))}
          </div>
        )}

      {!fechaValida && empleado && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            La fecha de retiro debe ser igual o posterior a la fecha de ingreso (
            {empleado.fechaIngreso}).
          </div>
        )}

        {/* Conceptos calculados */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {conceptos.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`card relative overflow-hidden border p-4 ${item.tone}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-card/40">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className="text-right">
                    <span className="block text-lg font-bold leading-none">
                      {item.dias.toLocaleString("es-VE", { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm uppercase tracking-wider opacity-70">días</span>
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-tight text-ink">
                  {item.label}
                </p>
                <p className="mt-1.5 text-lg font-bold text-ink">
                  {formatoMoneda(item.monto)}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted">{item.detalle}</p>
              </div>
            );
          })}
        </div>

        {calculo && (
          <>
            <div className="mt-3 flex flex-col gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300">
                  <ArrowDownRight className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Anticipos previos</p>
                  <p className="text-xs text-muted">Adelantos descontados del finiquito</p>
                </div>
              </div>
              <p className="text-lg font-bold text-rose-300">
                − {formatoMoneda(calculo.anticipos)}
              </p>
            </div>

            {/* Total */}
            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/[0.12] via-gold/[0.05] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-label text-gold/70">Monto Neto Total de Liquidación</p>
                <p className="mt-1 text-sm text-muted">
                  Subtotal {formatoMoneda(calculo.subtotal)} − Anticipos{" "}
                  {formatoMoneda(calculo.anticipos)}
                </p>
              </div>
              <p className="gold-text text-3xl font-bold tracking-tight sm:text-4xl">
                {formatoMoneda(calculo.total)}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Prestaciones: 15 días por trimestre (5 por mes) según antigüedad. Bono
                vacacional y utilidades: proporcionales al tiempo trabajado en el año.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={verDocumentoActual}
                  disabled={!fechaValida}
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye className="h-4 w-4" /> Ver hoja de liquidación
                </button>
                <button
                  type="button"
                  onClick={registrarLiquidacion}
                  disabled={!fechaValida || guardando}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light disabled:cursor-wait disabled:opacity-50"
                >
                  {guardando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {guardando ? "Registrando…" : "Registrar liquidación"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Historial con pestañas: liquidaciones, prestaciones y utilidades */}
      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Historial</h2>
            <p className="mt-0.5 text-sm text-muted">
              Finiquitos, prestaciones sociales y utilidades registrados en el backend
            </p>
          </div>
          <div className="flex gap-1 rounded-xl border border-line bg-surface/60 p-1">
            {(
              [
                { key: "liquidaciones" as const, label: "Liquidaciones", cantidad: historial.length },
                { key: "prestaciones" as const, label: "Prestaciones", cantidad: prestaciones.length },
                { key: "utilidades" as const, label: "Utilidades", cantidad: utilidades.length },
              ]
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPestanna(item.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  pestanna === item.key
                    ? "bg-gold/10 text-gold-light"
                    : "text-muted hover:bg-card/60 hover:text-ink"
                }`}
              >
                {item.label}
                <span className="ml-1.5 text-[11px] opacity-70">{item.cantidad}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center gap-3 px-5 py-16 text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              <span className="text-sm">Cargando historiales desde el servidor…</span>
            </div>
          ) : pestanna === "liquidaciones" ? (
            historial.length > 0 ? (
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="border-b border-line/80 bg-surface/40">
                    <th className="table-head">Registro</th>
                    <th className="table-head">Empleado</th>
                    <th className="table-head">Cargo</th>
                    <th className="table-head">Motivo</th>
                    <th className="table-head">Fecha retiro</th>
                    <th className="table-head text-right">Monto neto</th>
                    <th className="table-head text-right">Estatus</th>
                    <th className="table-head text-right">Finiquito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {historial.map((registro) => (
                    <tr key={registro.id} className="transition hover:bg-card/25">
                      <td className="table-cell">
                        <span
                          className="block font-mono text-sm text-muted"
                          title={registro.id}
                        >
                          {registro.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="mt-0.5 block text-xs text-subtle">
                          {registro.fechaRegistro}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="block text-base font-medium text-ink">
                          {nombreCompleto(registro.empleado)}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {registro.empleado.cedula}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="block text-sm text-muted">
                          {registro.empleado.cargo}
                        </span>
                        <span className="mt-0.5 block text-xs text-subtle">
                          {registro.empleado.departamento}
                        </span>
                      </td>
                      <td className="table-cell text-base text-muted">{registro.motivo}</td>
                      <td className="table-cell text-base text-muted">
                        {formatoFechaISO(registro.fechaRetiro)}
                      </td>
                      <td className="table-cell text-right text-base font-semibold text-gold-light">
                        {formatoMoneda(registro.total)}
                      </td>
                      <td className="table-cell text-right">
                        <StatusBadge status={registro.estado} />
                      </td>
                      <td className="table-cell text-right">
                        <button
                          type="button"
                          onClick={() => setDocumento(registro)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 px-2.5 py-1.5 text-sm font-medium text-muted transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver finiquito
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-14 text-center">
                <FileText className="mx-auto h-7 w-7 text-subtle" />
                <p className="mt-3 text-sm font-medium text-muted">
                  No hay liquidaciones registradas
                </p>
                <p className="mt-1 text-sm text-muted">
                  Calcule y registre un finiquito para verlo aquí (`/api/liquidaciones`).
                </p>
              </div>
            )
          ) : pestanna === "prestaciones" ? (
            prestaciones.length > 0 ? (
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-line/80 bg-surface/40">
                    <th className="table-head">Registro</th>
                    <th className="table-head">Empleado</th>
                    <th className="table-head">Año</th>
                    <th className="table-head">Trimestre</th>
                    <th className="table-head text-right">Días acreditados</th>
                    <th className="table-head text-right">Sueldo integral diario</th>
                    <th className="table-head text-right">Monto del trimestre</th>
                    <th className="table-head text-right">Anticipos</th>
                    <th className="table-head text-right">Intereses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {prestaciones.map((fila) => {
                    const emp = resolverEmpleado(fila.empleado_id);
                    return (
                      <tr key={fila.id} className="transition hover:bg-card/25">
                        <td className="table-cell font-mono text-sm text-muted" title={fila.id}>
                          {fila.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="table-cell">
                          <span className="block text-base font-medium text-ink">
                            {emp ? nombreCompleto(emp) : "Empleado no encontrado"}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {emp?.cedula ?? "—"}
                          </span>
                        </td>
                        <td className="table-cell text-base text-muted">{fila.anio ?? "—"}</td>
                        <td className="table-cell text-base text-muted">
                          {fila.trimestre ? `${fila.trimestre}º` : "—"}
                        </td>
                        <td className="table-cell text-right text-base font-medium text-ink">
                          {numeroBackend(fila.dias_acreditados).toLocaleString("es-VE", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="table-cell text-right text-base text-muted">
                          {formatoMoneda(numeroBackend(fila.sueldo_integral_diario))}
                        </td>
                        <td className="table-cell text-right text-base font-semibold text-gold-light">
                          {formatoMoneda(numeroBackend(fila.monto_trimestre))}
                        </td>
                        <td className="table-cell text-right text-base text-muted">
                          {formatoMoneda(numeroBackend(fila.anticipos))}
                        </td>
                        <td className="table-cell text-right text-base text-muted">
                          {formatoMoneda(numeroBackend(fila.intereses_prestaciones))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-14 text-center">
                <Landmark className="mx-auto h-7 w-7 text-subtle" />
                <p className="mt-3 text-sm font-medium text-muted">
                  No hay prestaciones sociales registradas
                </p>
                <p className="mt-1 text-sm text-muted">
                  Los abonos trimestrales aparecerán aquí (`/api/prestaciones-sociales`).
                </p>
              </div>
            )
          ) : utilidades.length > 0 ? (
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-line/80 bg-surface/40">
                  <th className="table-head">Registro</th>
                  <th className="table-head">Empleado</th>
                  <th className="table-head">Año</th>
                  <th className="table-head text-right">Días pagados</th>
                  <th className="table-head text-right">Monto de utilidades</th>
                  <th className="table-head">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {utilidades.map((fila) => {
                  const emp = resolverEmpleado(fila.empleado_id);
                  return (
                    <tr key={fila.id} className="transition hover:bg-card/25">
                      <td className="table-cell font-mono text-sm text-muted" title={fila.id}>
                        {fila.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="table-cell">
                        <span className="block text-base font-medium text-ink">
                          {emp ? nombreCompleto(emp) : "Empleado no encontrado"}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {emp?.cedula ?? "—"}
                        </span>
                      </td>
                      <td className="table-cell text-base text-muted">{fila.anio ?? "—"}</td>
                      <td className="table-cell text-right text-base font-medium text-ink">
                        {Number(fila.dias_pagados ?? 0) || "—"}
                      </td>
                      <td className="table-cell text-right text-base font-semibold text-gold-light">
                        {formatoMoneda(numeroBackend(fila.monto_utilidades))}
                      </td>
                      <td className="table-cell text-base text-muted">
                        {fila.observaciones || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-14 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-subtle" />
              <p className="mt-3 text-sm font-medium text-muted">
                No hay utilidades registradas
              </p>
              <p className="mt-1 text-sm text-muted">
                Los pagos de utilidades aparecerán aquí (`/api/utilidades`).
              </p>
            </div>
          )}
        </div>
      </section>

      {documento && (
        <LiquidacionFiniquito
          calculo={documento}
          numero={documento.id === "LIQ-PREVIO" ? "LIQ-PREVIO" : documento.id.slice(0, 8).toUpperCase()}
          onClose={() => setDocumento(null)}
        />
      )}
    </>
  );
}
