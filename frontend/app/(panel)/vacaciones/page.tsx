"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Gift,
  Loader2,
  PlaneTakeoff,
  Plus,
  X,
} from "lucide-react";
import MiniStat from "@/components/MiniStat";
import PageHeader from "@/components/PageHeader";
import VacacionFormModal from "@/components/VacacionFormModal";
import { ApiError } from "@/lib/api";
import { cargarCatalogos } from "@/lib/api/catalogos";
import { listarEmpleadosActivos } from "@/lib/api/empleados";
import {
  actualizarEstadoVacacion,
  actualizarPagoBono,
  crearBonoVacacional,
  crearVacacion,
  listarBonos,
  listarVacaciones,
} from "@/lib/api/vacaciones";
import type { Empleado } from "@/lib/empleados";
import {
  formatoFecha,
  formatoMoneda,
  type EstadoVacacion,
  type ModalidadVacacion,
  type VacacionRegistro,
} from "@/lib/vacaciones";

const estadoCls: Record<EstadoVacacion, string> = {
  Pendiente: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "En Disfrute": "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Pagado: "border-emerald-500/30 bg-emerald-500/10 text-gold-light",
};

const selectEstadoCls =
  "appearance-none rounded-full border py-1.5 pl-3 pr-7 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-gold/10";

function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

export default function VacacionesPage() {
  const [tab, setTab] = useState<ModalidadVacacion>("Disfrute");
  const [registros, setRegistros] = useState<VacacionRegistro[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState("");
  const [notice, setNotice] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [cargando, setCargando] = useState(true);

  const resolverEmpleado = useCallback(
    (empleadoId: string): Empleado | undefined =>
      empleados.find((emp) => emp.id === empleadoId),
    [empleados],
  );

  /**
   * Carga disfrutes (`GET /vacaciones`) y bonos (`GET /bonos-vacacionales`)
   * y los combina en el modelo de la pestaña Disfrute/Bono.
   */
  const cargar = useCallback(
    async (listaEmpleados: Empleado[]) => {
      const resolver = (id: string) => listaEmpleados.find((e) => e.id === id);
      const [disfrutes, bonos] = await Promise.all([
        listarVacaciones({ limit: 500 }, resolver),
        listarBonos({ limit: 500 }, resolver),
      ]);
      setRegistros([...disfrutes.registros, ...bonos.registros]);
    },
    [],
  );

  // Carga inicial: catálogos + empleados activos + registros reales.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCargando(true);
      setErrorCarga("");
      try {
        const catalogos = await cargarCatalogos();
        const activos = await listarEmpleadosActivos(catalogos);
        if (cancelado) return;
        setEmpleados(activos);
        await cargar(activos);
      } catch (error) {
        if (!cancelado) setErrorCarga(mensajeDeError(error));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [cargar]);

  const visibles = useMemo(
    () => registros.filter((r) => r.modalidad === tab),
    [registros, tab],
  );

  const enDisfrute = visibles.filter((r) => r.estado === "En Disfrute").length;
  const pendientes = visibles.filter((r) => r.estado === "Pendiente").length;
  const pagados = visibles.filter((r) => r.estado === "Pagado").length;
  const totalDias = visibles.reduce((s, r) => s + r.diasHabiles, 0);
  const totalMonto = visibles.reduce((s, r) => s + r.montoBono, 0);

  /** Cambio de estatus: `PATCH /vacaciones/:id` o `/bonos-vacacionales/:id`. */
  const cambiarEstado = async (
    registro: VacacionRegistro,
    estado: EstadoVacacion,
  ) => {
    try {
      if (registro.modalidad === "Bono Vacacional") {
        await actualizarPagoBono(registro.id, estado === "Pagado");
      } else {
        await actualizarEstadoVacacion(registro.id, estado);
      }
      setRegistros((prev) =>
        prev.map((r) => (r.id === registro.id ? { ...r, estado } : r)),
      );
    } catch (error) {
      setNotice("");
      setErrorGuardado(mensajeDeError(error));
    }
  };

  /** Registro nuevo: `POST /vacaciones` o `POST /bonos-vacacionales`. */
  const guardarRegistro = async (borrador: VacacionRegistro) => {
    setGuardando(true);
    setErrorGuardado("");
    try {
      if (borrador.modalidad === "Bono Vacacional") {
        const empleado = empleados.find((e) => e.id === borrador.empleadoId);
        await crearBonoVacacional({
          empleadoId: borrador.empleadoId,
          anio: borrador.anio,
          sueldoBase: empleado?.sueldoBase ?? 0,
        });
      } else {
        await crearVacacion({
          empleadoId: borrador.empleadoId,
          anio: borrador.anio,
          fechaInicio: borrador.fechaInicio,
          fechaFin: borrador.fechaFin,
          diasHabiles: borrador.diasHabiles,
        });
      }
      await cargar(empleados);
      setModalOpen(false);
      setTab(borrador.modalidad);
      setNotice(
        `${borrador.modalidad === "Disfrute" ? "Disfrute" : "Bono Vacacional"} registrado para ${borrador.nombre} · Año ${borrador.anio}.`,
      );
    } catch (error) {
      setErrorGuardado(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Planificación de ausencias"
        title="Vacaciones y Bono Vacacional"
        description="Controle el disfrute de las vacaciones y la Liquidación del Bono Vacacional, con cálculo automático de 15 días por el sueldo diario del empleado."
        icon={CalendarDays}
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={empleados.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Registrar vacaciones
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

      {(errorCarga || errorGuardado) && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
          <p className="flex-1 text-sm text-rose-700 dark:text-rose-200">
            {errorCarga || errorGuardado}
          </p>
          <button
            type="button"
            onClick={() => {
              setErrorCarga("");
              setErrorGuardado("");
            }}
            aria-label="Cerrar aviso"
            className="rounded-md p-1 text-muted transition hover:bg-card hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pestañas */}
      <div className="card mb-5 flex gap-1 p-1.5">
        {(
          [
            { key: "Disfrute" as const, label: "Control de Disfrute", icon: PlaneTakeoff },
            { key: "Bono Vacacional" as const, label: "Bono Vacacional", icon: Gift },
          ]
        ).map((item) => {
          const Icon = item.icon;
          const activo = tab === item.key;
          const cantidad = registros.filter((r) => r.modalidad === item.key).length;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activo
                  ? "bg-gold/10 text-gold-light shadow-gold"
                  : "text-muted hover:bg-card/50 hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                  activo ? "bg-gold/20 text-gold-light" : "bg-card text-muted"
                }`}
              >
                {cantidad}
              </span>
            </button>
          );
        })}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tab === "Disfrute" ? (
          <>
            <MiniStat
              label="En disfrute"
              value={String(enDisfrute)}
              hint="Empleados disfrutando actualmente"
              icon={PlaneTakeoff}
            />
            <MiniStat
              label="Pendientes"
              value={String(pendientes)}
              hint="Solicitudes por aprobar"
              icon={CalendarDays}
            />
            <MiniStat
              label="Días hábiles programados"
              value={String(totalDias)}
              hint={`${visibles.length} registros de disfrute`}
              icon={CalendarCheck}
            />
          </>
        ) : (
          <>
            <MiniStat
              label="Total a pagar"
              value={formatoMoneda(totalMonto)}
              hint="15 días × sueldo diario"
              icon={Gift}
            />
            <MiniStat label="Pagados" value={String(pagados)} hint="Beneficios cancelados" icon={CheckCircle2} />
            <MiniStat label="Pendientes" value={String(pendientes)} hint="Por procesar" icon={CalendarDays} />
          </>
        )}
      </div>

      {/* Historial */}
      <section className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line/80 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Historial · {tab === "Disfrute" ? "Control de Disfrute" : "Bono Vacacional"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {visibles.length} registros · Actualice el estatus directamente en la tabla
            </p>
          </div>
          <span className="hidden rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted sm:block">
            Datos reales de `/api/{tab === "Disfrute" ? "vacaciones" : "bonos-vacacionales"}`
          </span>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center gap-3 px-5 py-16 text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              <span className="text-sm">Cargando registros desde el servidor…</span>
            </div>
          ) : visibles.length > 0 ? (
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="border-b border-line/80 bg-surface/40">
                  <th className="table-head">Registro</th>
                  <th className="table-head">Empleado</th>
                  <th className="table-head">Año</th>
                  {tab === "Disfrute" ? (
                    <>
                      <th className="table-head">Desde</th>
                      <th className="table-head">Hasta</th>
                      <th className="table-head text-right">Días hábiles</th>
                    </>
                  ) : (
                    <>
                      <th className="table-head text-right">Sueldo diario</th>
                      <th className="table-head text-right">Días</th>
                    </>
                  )}
                  <th className="table-head text-right">Monto bono</th>
                  <th className="table-head text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {visibles.map((registro) => (
                  <tr key={registro.id} className="transition hover:bg-card/25">
                    <td className="table-cell">
                      <span
                        className="block font-mono text-sm text-muted"
                        title={registro.id}
                      >
                        {registro.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="mt-0.5 block text-xs text-subtle">{registro.cargo}</span>
                    </td>
                    <td className="table-cell">
                      <span className="block text-base font-medium text-ink">{registro.nombre}</span>
                      <span className="mt-0.5 block text-xs text-muted">{registro.cedula}</span>
                    </td>
                    <td className="table-cell text-base text-muted">{registro.anio}</td>
                    {tab === "Disfrute" ? (
                      <>
                        <td className="table-cell text-base text-muted">
                          {formatoFecha(registro.fechaInicio)}
                        </td>
                        <td className="table-cell text-base text-muted">
                          {formatoFecha(registro.fechaFin)}
                        </td>
                        <td className="table-cell text-right text-base font-medium text-ink">
                          {registro.diasHabiles}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="table-cell text-right text-base text-muted">
                          {formatoMoneda(registro.sueldoDiario)}
                        </td>
                        <td className="table-cell text-right text-base font-medium text-ink">15</td>
                      </>
                    )}
                    <td className="table-cell text-right text-base font-semibold text-gold-light">
                      {formatoMoneda(registro.montoBono)}
                    </td>
                    <td className="table-cell text-right">
                      <div className="relative inline-flex items-center">
                        <select
                          value={registro.estado}
                          onChange={(e) =>
                            cambiarEstado(registro, e.target.value as EstadoVacacion)
                          }
                          aria-label={`Estatus de ${registro.nombre}`}
                          className={`${selectEstadoCls} ${estadoCls[registro.estado]}`}
                        >
                          {registro.modalidad === "Bono Vacacional" ? (
                            <>
                              <option value="Pendiente">Pendiente</option>
                              <option value="Pagado">Pagado</option>
                            </>
                          ) : (
                            <>
                              <option value="Pendiente">Pendiente</option>
                              <option value="En Disfrute">En Disfrute</option>
                              <option value="Pagado">Pagado</option>
                            </>
                          )}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 opacity-70" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-16 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-subtle" />
              <p className="mt-3 text-base font-medium text-muted">
                No hay registros de {tab === "Disfrute" ? "disfrute" : "bonos vacacionales"}
              </p>
              <p className="mt-1 text-sm text-muted">
                Registre una solicitud para verla aquí, tomada del backend.
              </p>
            </div>
          )}
        </div>
      </section>

      <VacacionFormModal
        open={modalOpen}
        empleados={empleados}
        guardando={guardando}
        error={errorGuardado}
        onClose={() => {
          setModalOpen(false);
          setErrorGuardado("");
        }}
        onSave={guardarRegistro}
      />
    </>
  );
}
