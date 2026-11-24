"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronRight,
  FileText,
  LoaderCircle,
  ReceiptText,
  TrendingUp,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import FechaActual from "@/components/FechaActual";
import StatusBadge from "@/components/StatusBadge";
import TasaBcvCard from "@/components/TasaBcvCard";
import { vencimientos, type MovementType } from "@/lib/data";
import {
  cargarDashboard,
  type DatosDashboard,
} from "@/lib/api/dashboard";

const movementIcons: Record<MovementType, LucideIcon> = {
  Nómina: WalletCards,
  Vacaciones: CalendarDays,
  "Bono Vacacional": Banknote,
  Liquidación: FileText,
  Personal: UsersRound,
};

export default function DashboardPage() {
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [error, setError] = useState("");

  // Carga el resumen ejecutivo desde los endpoints reales del backend.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const resumen = await cargarDashboard();
        if (!cancelado) setDatos(resumen);
      } catch (e) {
        if (!cancelado) {
          setError(
            e instanceof Error
              ? e.message
              : "No fue posible cargar el resumen del panel.",
          );
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  if (!datos) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        {error ? (
          <p className="max-w-md text-sm text-rose-700 dark:text-rose-300">{error}</p>
        ) : (
          <>
            <LoaderCircle
              className="h-6 w-6 animate-spin text-gold"
              aria-hidden="true"
            />
            <p className="text-sm text-muted">
              Cargando el resumen ejecutivo desde el servidor…
            </p>
          </>
        )}
      </div>
    );
  }

  const { resumen, movimientos, distribucion } = datos;

  const stats = [
    {
      label: "Total Empleados Activos",
      value: String(resumen.empleadosActivos),
      hint: resumen.empleadosDelta,
      icon: UsersRound,
      accent: "from-gold/20 to-transparent",
      iconClass: "border-gold/30 bg-gold/10 text-gold",
    },
    {
      label: "Última Nómina Procesada",
      value: resumen.nominaMonto,
      hint: resumen.nominaPeriodo,
      icon: WalletCards,
      accent: "from-sky-500/15 to-transparent",
      iconClass: "border-sky-500/25 bg-sky-500/10 text-sky-300",
      money: true,
    },
    {
      label: "Vacaciones en Curso",
      value: String(resumen.vacacionesEnCurso),
      hint: resumen.vacacionesDetalle,
      icon: CalendarDays,
      accent: "from-violet-500/15 to-transparent",
      iconClass: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    },
    {
      label: "Liquidaciones Pendientes",
      value: String(resumen.liquidacionesPendientes),
      hint: resumen.liquidacionesDetalle,
      icon: FileText,
      accent: "from-amber-500/15 to-transparent",
      iconClass: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    },
  ];

  return (
    <>
      {/* Encabezado del dashboard */}
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label mb-2 flex items-center gap-2 text-gold/80">
            <span className="h-px w-6 bg-gold/60" />
            Panel de control · <FechaActual variante="mesAnio" />
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink lg:text-3xl">
            Resumen Ejecutivo
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
            Bienvenido a la plataforma de gestión de nómina y liquidaciones de la
            Alcaldía Bolivariana del Municipio Guásimos.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start rounded-full border border-emerald-300 bg-emerald-100 px-3.5 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06] lg:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-600 opacity-60 dark:bg-emerald-400" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          </span>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-200/80">
            Datos actualizados · <FechaActual variante="actualizacion" />
          </span>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="card card-hover relative overflow-hidden p-5">
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${stat.accent}`}
              />
              <div className="relative flex items-start justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stat.iconClass}`}
                >
                  <Icon className="h-[19px] w-[19px]" strokeWidth={1.9} />
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-gold/20 bg-gold/[0.07] px-2 py-1 text-xs font-semibold text-gold-light">
                  <TrendingUp className="h-3 w-3" />
                  {stat.money ? "Cerrada" : "En línea"}
                </span>
              </div>
              <p className="relative mt-5 text-sm font-medium uppercase tracking-wider text-muted">
                {stat.label}
              </p>
              <p
                className={`relative mt-1.5 font-semibold tracking-tight text-ink ${
                  stat.money ? "text-2xl" : "text-3xl"
                }`}
              >
                {stat.value}
              </p>
              <div className="relative mt-4 flex items-center gap-1.5 border-t border-line/80 pt-3 text-sm text-muted">
                <ArrowUpRight className="h-3.5 w-3.5 text-gold/70" />
                {stat.hint}
              </div>
            </article>
          );
        })}
      </div>

      {/* Movimientos + indicadores laterales */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-line/80 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Movimientos recientes</h2>
              <p className="mt-0.5 text-sm text-muted">
                Últimas operaciones registradas en el sistema
              </p>
            </div>
            <Link
              href="/nomina"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gold transition hover:bg-gold/10"
            >
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {movimientos.length > 0 ? (
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-line/80 bg-surface/40">
                    <th className="table-head">Tipo</th>
                    <th className="table-head">Detalle</th>
                    <th className="table-head">Fecha</th>
                    <th className="table-head text-right">Monto</th>
                    <th className="table-head text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {movimientos.map((mov) => {
                    const Icon = movementIcons[mov.type];
                    return (
                      <tr key={`${mov.type}-${mov.id}`} className="group transition hover:bg-card/25">
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-card/50 text-muted transition group-hover:border-gold/30 group-hover:text-gold">
                              <Icon className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <div>
                              <span className="block text-base font-medium text-ink">
                                {mov.type}
                              </span>
                              <span className="block text-xs text-subtle">{mov.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="block max-w-[260px] truncate text-base text-muted">
                            {mov.detail}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {mov.reference}
                          </span>
                        </td>
                        <td className="table-cell text-base text-muted">{mov.date}</td>
                        <td className="table-cell text-right text-base font-medium text-ink">
                          {mov.amount ?? <span className="text-subtle">—</span>}
                        </td>
                        <td className="table-cell text-right">
                          <StatusBadge status={mov.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-14 text-center">
                <WalletCards className="mx-auto h-7 w-7 text-subtle" />
                <p className="mt-3 text-sm font-medium text-muted">
                  Aún no hay movimientos registrados
                </p>
                <p className="mt-1 text-sm text-muted">
                  Procese una nómina o registre vacaciones para verlos aquí.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="space-y-5">
          <TasaBcvCard />

          {/* Próximos vencimientos */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Próximos vencimientos</h2>
              <ReceiptText className="h-4 w-4 text-subtle" />
            </div>
            <ul className="mt-4 space-y-3">
              {vencimientos.map((item) => (
                <li key={item.titulo} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-line/70 bg-card/50 leading-none">
                    <span className="text-base font-semibold text-gold-light">{item.dia}</span>
                    <span className="mt-0.5 text-xs font-semibold tracking-wider text-muted">
                      {item.mes}
                    </span>
                  </span>
                  <span className="min-w-0 border-l border-line pl-3">
                    <span className="block truncate text-sm font-medium text-ink">
                      {item.titulo}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {item.detalle}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Distribución del personal */}
      <section className="card mt-5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Distribución del personal por dependencia
            </h2>
            <p className="mt-1 text-sm text-muted">
              {resumen.empleadosActivos} empleados activos distribuidos en{" "}
              {distribucion.length} oficina{distribucion.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/personal"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-line/70 px-3 py-2 text-sm font-medium text-muted transition hover:border-gold/40 hover:text-gold"
          >
            Ver personal <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
          {distribucion.map((dependencia) => (
            <div key={dependencia.dependencia}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-muted">
                  <span className={`h-2 w-2 rounded-full ${dependencia.color}`} />
                  {dependencia.dependencia}
                </span>
                <span className="text-muted">
                  <span className="font-semibold text-ink">{dependencia.cantidad}</span> · {dependencia.porcentaje}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-card">
                <div
                  className={`h-full rounded-full ${dependencia.color}`}
                  style={{ width: `${dependencia.porcentaje}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-subtle">
        Alcaldía Bolivariana del Municipio Guásimos · Sistema Web para la Gestión de Nómina y
        Liquidaciones
      </p>
    </>
  );
}
