/**
 * Adaptador de vacaciones y bonos vacacionales: combina dos endpoints del
 * backend (`/vacaciones` y `/bonos-vacacionales`) en el modelo combinado
 * `VacacionRegistro` que usa la pestaña Disfrute/Bono de la UI.
 */

import { api } from "@/lib/api";
import {
  nombreCompleto,
  sueldoDiario,
  bonoVacacional,
  type EstadoVacacion,
  type ModalidadVacacion,
  type VacacionRegistro,
} from "@/lib/vacaciones";
import type { Empleado } from "@/lib/empleados";
import { aQuery, fechaLegible, numeroBackend } from "./comunes";

/** Fila de `vacaciones`. */
export interface VacacionRow {
  id: string;
  empleado_id: string;
  anio_correspondiente?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  dias_habiles?: number | null;
  dias_pendientes?: number | null;
  tipo?: string | null;
  estatus?: string | null;
  observaciones?: string | null;
  created_at?: string | null;
}

/** Fila de `bonos_vacacionales`. */
export interface BonoVacacionalRow {
  id: string;
  empleado_id: string;
  anio?: number | null;
  dias_bono?: number | null;
  sueldo_base_calculo?: string | number | null;
  monto_bono?: string | number | null;
  pagado?: boolean | null;
  fecha_pago?: string | null;
  created_at?: string | null;
}

export interface FiltrosVacaciones {
  empleado_id?: string;
  anio_correspondiente?: number;
  estatus?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
  limit?: number;
  offset?: number;
}

export interface FiltrosBonos {
  empleado_id?: string;
  anio?: number;
  pagado?: boolean;
  desde?: string;
  hasta?: string;
  limit?: number;
  offset?: number;
}

/** Normaliza el `estatus` del backend a los tres estados de la UI. */
export function mapearEstadoVacacion(estatus?: string | null): EstadoVacacion {
  const valor = String(estatus ?? "").trim().toLowerCase();
  if (valor.includes("disfrut")) return "En Disfrute";
  if (valor.includes("pagad") || valor.includes("disfrutado")) return "Pagado";
  return "Pendiente";
}

/** `tipo` del backend → modalidad de la UI. */
function mapearModalidad(tipo?: string | null): ModalidadVacacion {
  const valor = String(tipo ?? "").trim().toLowerCase();
  return valor.includes("bono") ? "Bono Vacacional" : "Disfrute";
}

interface ResolvedorEmpleado {
  (empleadoId: string): Empleado | undefined;
}

function datosEmpleado(
  empleadoId: string,
  resolver: ResolvedorEmpleado,
): Pick<VacacionRegistro, "cedula" | "nombre" | "cargo"> {
  const empleado = resolver(empleadoId);
  return {
    cedula: empleado?.cedula ?? "—",
    nombre: empleado ? nombreCompleto(empleado) : "Empleado no encontrado",
    cargo: empleado?.cargo ?? "—",
  };
}

/** Fila de `/vacaciones` → `VacacionRegistro` (id = UUID real). */
export function mapearVacacion(
  fila: VacacionRow,
  resolver: ResolvedorEmpleado,
): VacacionRegistro {
  const empleado = resolver(fila.empleado_id);
  const sueldo = empleado?.sueldoBase ?? 0;

  return {
    id: fila.id,
    empleadoId: fila.empleado_id,
    ...datosEmpleado(fila.empleado_id, resolver),
    anio: Number(fila.anio_correspondiente ?? 0) || new Date().getFullYear(),
    fechaInicio: fechaLegible(fila.fecha_inicio) || "—",
    fechaFin: fechaLegible(fila.fecha_fin) || "—",
    diasHabiles: Number(fila.dias_habiles ?? 0) || 0,
    sueldoDiario: sueldoDiario(sueldo),
    montoBono: bonoVacacional(sueldo),
    estado: mapearEstadoVacacion(fila.estatus),
    modalidad: mapearModalidad(fila.tipo),
  };
}

/** Fila de `/bonos-vacacionales` → `VacacionRegistro` (id = UUID real). */
export function mapearBono(
  fila: BonoVacacionalRow,
  resolver: ResolvedorEmpleado,
): VacacionRegistro {
  const empleado = resolver(fila.empleado_id);
  const sueldo = numeroBackend(fila.sueldo_base_calculo) || empleado?.sueldoBase || 0;

  return {
    id: fila.id,
    empleadoId: fila.empleado_id,
    ...datosEmpleado(fila.empleado_id, resolver),
    anio: Number(fila.anio ?? 0) || new Date().getFullYear(),
    fechaInicio: fechaLegible(fila.fecha_pago) || "—",
    fechaFin: fechaLegible(fila.fecha_pago) || "—",
    diasHabiles: Number(fila.dias_bono ?? 0) || 15,
    sueldoDiario: sueldoDiario(sueldo),
    montoBono: numeroBackend(fila.monto_bono) || bonoVacacional(sueldo),
    estado: fila.pagado ? "Pagado" : "Pendiente",
    modalidad: "Bono Vacacional",
  };
}

export async function listarVacaciones(
  filtros: FiltrosVacaciones,
  resolver: ResolvedorEmpleado,
): Promise<{ registros: VacacionRegistro[]; total: number }> {
  const { data, meta } = await api.get<VacacionRow[]>(
    `/vacaciones${aQuery(filtros)}`,
  );
  const filas = Array.isArray(data) ? data : [];
  return {
    registros: filas.map((fila) => mapearVacacion(fila, resolver)),
    total: Number(meta?.total ?? filas.length),
  };
}

export async function listarBonos(
  filtros: FiltrosBonos,
  resolver: ResolvedorEmpleado,
): Promise<{ registros: VacacionRegistro[]; total: number }> {
  const { data, meta } = await api.get<BonoVacacionalRow[]>(
    `/bonos-vacacionales${aQuery(filtros)}`,
  );
  const filas = Array.isArray(data) ? data : [];
  return {
    registros: filas.map((fila) => mapearBono(fila, resolver)),
    total: Number(meta?.total ?? filas.length),
  };
}

/** Crea un registro de disfrute (`POST /vacaciones`). */
export async function crearVacacion(payload: {
  empleadoId: string;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  diasHabiles: number;
}): Promise<VacacionRow> {
  const { data } = await api.post<VacacionRow>("/vacaciones", {
    empleado_id: payload.empleadoId,
    anio_correspondiente: payload.anio,
    fecha_inicio: payload.fechaInicio,
    fecha_fin: payload.fechaFin,
    dias_habiles: payload.diasHabiles,
    dias_pendientes: 0,
    tipo: "Disfrute",
    estatus: "Pendiente",
  });
  return data;
}

/** Crea un bono vacacional (`POST /bonos-vacacionales`). */
export async function crearBonoVacacional(payload: {
  empleadoId: string;
  anio: number;
  sueldoBase: number;
}): Promise<BonoVacacionalRow> {
  const sueldo = Math.round(payload.sueldoBase * 100) / 100;
  const { data } = await api.post<BonoVacacionalRow>("/bonos-vacacionales", {
    empleado_id: payload.empleadoId,
    anio: payload.anio,
    dias_bono: 15,
    sueldo_base_calculo: sueldo,
    monto_bono: bonoVacacional(sueldo),
    pagado: false,
  });
  return data;
}

/** Actualiza el estatus de un disfrute (`PATCH /vacaciones/:id`). */
export async function actualizarEstadoVacacion(
  id: string,
  estado: EstadoVacacion,
): Promise<VacacionRow> {
  const { data } = await api.patch<VacacionRow>(`/vacaciones/${id}`, {
    estatus: estado,
  });
  return data;
}

/** Marca un bono como pagado/pendiente (`PATCH /bonos-vacacionales/:id`). */
export async function actualizarPagoBono(
  id: string,
  pagado: boolean,
): Promise<BonoVacacionalRow> {
  const { data } = await api.patch<BonoVacacionalRow>(
    `/bonos-vacacionales/${id}`,
    {
      pagado,
      fecha_pago: pagado ? new Date().toISOString().slice(0, 10) : null,
    },
  );
  return data;
}
