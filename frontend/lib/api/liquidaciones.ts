/**
 * Adaptador de liquidaciones, prestaciones sociales y utilidades.
 *
 * Traduce las filas `snake_case` de `/liquidaciones`, `/prestaciones-sociales`
 * y `/utilidades` al modelo `LiquidacionRegistro` de la UI y construye los
 * payloads para `POST /liquidaciones`.
 */

import { api } from "@/lib/api";
import {
  calcularLiquidacion,
  diferenciaFechas,
  isoDesdeTexto,
  motivosRetiro,
  redondear,
  type CalculoLiquidacion,
  type EstadoLiquidacion,
  type LiquidacionRegistro,
  type MotivoRetiro,
} from "@/lib/liquidaciones";
import type { Empleado } from "@/lib/empleados";
import { aQuery, fechaLegible, numeroBackend } from "./comunes";

/** Fila de `liquidaciones`. */
export interface LiquidacionRow {
  id: string;
  empleado_id: string;
  fecha_retiro?: string | null;
  motivo?: string | null;
  sueldo_integral_diario_final?: string | number | null;
  dias_prestaciones_total?: string | number | null;
  dias_vacaciones_pendientes?: number | null;
  dias_bono_vacacional_pendientes?: number | null;
  dias_utilidades_pendientes?: number | null;
  monto_total_prestaciones?: string | number | null;
  monto_total_vacaciones_fraccionadas?: string | number | null;
  monto_total_bono_vacacional_fraccionado?: string | number | null;
  monto_total_utilidades_fraccionadas?: string | number | null;
  total_anticipos_deducidos?: string | number | null;
  monto_neto_liquidacion?: string | number | null;
  estatus?: string | null;
  observaciones?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}

/** Fila de `prestaciones_sociales`. */
export interface PrestacionRow {
  id: string;
  empleado_id: string;
  anio?: number | null;
  trimestre?: number | null;
  dias_acreditados?: string | number | null;
  sueldo_integral_diario?: string | number | null;
  monto_trimestre?: string | number | null;
  anticipos?: string | number | null;
  intereses_prestaciones?: string | number | null;
  created_at?: string | null;
}

/** Fila de `utilidades`. */
export interface UtilidadRow {
  id: string;
  empleado_id: string;
  anio?: number | null;
  dias_pagados?: number | null;
  monto_utilidades?: string | number | null;
  observaciones?: string | null;
  created_at?: string | null;
}

export interface FiltrosLiquidaciones {
  empleado_id?: string;
  estatus?: string;
  created_by?: string;
  desde?: string;
  hasta?: string;
  limit?: number;
  offset?: number;
}

export interface FiltrosPrestaciones {
  empleado_id?: string;
  anio?: number;
  trimestre?: number;
  limit?: number;
  offset?: number;
}

export interface FiltrosUtilidades {
  empleado_id?: string;
  anio?: number;
  limit?: number;
  offset?: number;
}

/** Empleado de relleno cuando el id ya no existe en el directorio. */
const EMPLEADO_FANTASMA: Empleado = {
  id: "",
  cedula: "—",
  nombres: "Empleado",
  apellidos: "no encontrado",
  cargo: "—",
  departamento: "—",
  tipoNomina: "—",
  gradoAcademico: "No registra",
  fechaIngreso: "",
  sueldoBase: 0,
  estado: "Retirado",
  fechaNacimiento: "",
  genero: "",
  direccion: "",
  telefono: "",
  correo: "",
  banco: "—",
  numeroCuenta: "—",
  cargaFamiliar: [],
  tallas: { camisa: "—", pantalon: "—", calzado: "—" },
  salud: {},
};

/** Normaliza el motivo del backend al catálogo de motivos de la UI. */
function mapearMotivo(motivo?: string | null): MotivoRetiro {
  const valor = String(motivo ?? "").toLowerCase();
  const encontrado = motivosRetiro.find((opcion) =>
    valor.includes(opcion.toLowerCase()),
  );
  return encontrado ?? "Renuncia";
}

/** Normaliza el `estatus` del backend a los estados de la UI. */
function mapearEstadoLiquidacion(estatus?: string | null): EstadoLiquidacion {
  const valor = String(estatus ?? "").trim().toLowerCase();
  if (valor.includes("pagad")) return "Pagado";
  if (valor.includes("revis")) return "En revisión";
  return "Pendiente";
}

/** Reconstruye la antigüedad a partir del ingreso y la fecha de retiro. */
function antiguedadDe(empleado: Empleado, fechaRetiro: string) {
  const ingresoISO = isoDesdeTexto(empleado.fechaIngreso);
  const { meses, dias } = diferenciaFechas(ingresoISO, fechaRetiro);
  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  return {
    anios,
    meses: mesesRestantes,
    dias,
    texto: `${anios} año(s), ${mesesRestantes} mes(es) y ${dias} día(s)`,
    mesesTotales: redondear(meses + dias / 30),
  };
}

/** Fila de `/liquidaciones` → `LiquidacionRegistro` (id = UUID real). */
export function mapearLiquidacion(
  fila: LiquidacionRow,
  resolver: (empleadoId: string) => Empleado | undefined,
): LiquidacionRegistro {
  const empleado = resolver(fila.empleado_id) ?? EMPLEADO_FANTASMA;
  const fechaRetiro = fechaLegible(fila.fecha_retiro) || "—";
  const fechaRetiroISO =
    String(fila.fecha_retiro ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);

  const prestaciones = {
    dias: numeroBackend(fila.dias_prestaciones_total),
    monto: numeroBackend(fila.monto_total_prestaciones),
    detalle: "Días acreditados por antigüedad",
    trimestres: Math.floor(numeroBackend(fila.dias_prestaciones_total) / 15),
    mesesSuelto: 0,
  };
  const vacaciones = {
    dias: Number(fila.dias_vacaciones_pendientes ?? 0) || 0,
    monto: numeroBackend(fila.monto_total_vacaciones_fraccionadas),
    detalle: "Días pendientes × sueldo diario",
  };
  const bono = {
    dias: Number(fila.dias_bono_vacacional_pendientes ?? 0) || 0,
    monto: numeroBackend(fila.monto_total_bono_vacacional_fraccionado),
    detalle: "15 días × proporción del año",
  };
  const utilidades = {
    dias: Number(fila.dias_utilidades_pendientes ?? 0) || 0,
    monto: numeroBackend(fila.monto_total_utilidades_fraccionadas),
    detalle: "30 días × proporción del año",
  };
  const anticipos = numeroBackend(fila.total_anticipos_deducidos);
  const subtotal =
    prestaciones.monto + vacaciones.monto + bono.monto + utilidades.monto;

  return {
    id: fila.id,
    empleado,
    motivo: mapearMotivo(fila.motivo),
    fechaRetiro: fechaRetiroISO,
    antiguedad: antiguedadDe(empleado, fechaRetiroISO),
    sueldoBase: empleado.sueldoBase,
    sueldoDiario: numeroBackend(fila.sueldo_integral_diario_final),
    diasVacacionesPendientes: vacaciones.dias,
    mesesDelAnio: 0,
    prestaciones,
    vacaciones,
    bono,
    utilidades,
    anticipos,
    subtotal: redondear(subtotal),
    total: numeroBackend(fila.monto_neto_liquidacion) || redondear(subtotal - anticipos),
    estado: mapearEstadoLiquidacion(fila.estatus),
    fechaRegistro: fechaLegible(fila.created_at) || "—",
  };
}

/**
 * Payload para `POST /liquidaciones` a partir del cálculo de la UI.
 * Conserva el desglose completo en las columnas del backend.
 */
export function liquidacionAPayload(
  calculo: CalculoLiquidacion,
  empleadoId: string,
  createdBy?: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    empleado_id: empleadoId,
    fecha_retiro: calculo.fechaRetiro,
    motivo: calculo.motivo,
    sueldo_integral_diario_final: calculo.sueldoDiario,
    dias_prestaciones_total: calculo.prestaciones.dias,
    dias_vacaciones_pendientes: calculo.vacaciones.dias,
    // El esquema exige enteros para estos días; el desglose fraccionado
    // exacto se conserva en los montos de cada concepto.
    dias_bono_vacacional_pendientes: Math.round(calculo.bono.dias),
    dias_utilidades_pendientes: Math.round(calculo.utilidades.dias),
    monto_total_prestaciones: calculo.prestaciones.monto,
    monto_total_vacaciones_fraccionadas: calculo.vacaciones.monto,
    monto_total_bono_vacacional_fraccionado: calculo.bono.monto,
    monto_total_utilidades_fraccionadas: calculo.utilidades.monto,
    total_anticipos_deducidos: calculo.anticipos,
    monto_neto_liquidacion: calculo.total,
    estatus: "En revisión",
  };

  if (createdBy) payload.created_by = createdBy;
  return payload;
}

export async function listarLiquidaciones(
  filtros: FiltrosLiquidaciones,
  resolver: (empleadoId: string) => Empleado | undefined,
): Promise<{ registros: LiquidacionRegistro[]; total: number }> {
  const { data, meta } = await api.get<LiquidacionRow[]>(
    `/liquidaciones${aQuery(filtros)}`,
  );
  const filas = Array.isArray(data) ? data : [];
  return {
    registros: filas.map((fila) => mapearLiquidacion(fila, resolver)),
    total: Number(meta?.total ?? filas.length),
  };
}

export async function listarPrestaciones(
  filtros: FiltrosPrestaciones,
): Promise<{ filas: PrestacionRow[]; total: number }> {
  const { data, meta } = await api.get<PrestacionRow[]>(
    `/prestaciones-sociales${aQuery(filtros)}`,
  );
  const filas = Array.isArray(data) ? data : [];
  return { filas, total: Number(meta?.total ?? filas.length) };
}

export async function listarUtilidades(
  filtros: FiltrosUtilidades,
): Promise<{ filas: UtilidadRow[]; total: number }> {
  const { data, meta } = await api.get<UtilidadRow[]>(
    `/utilidades${aQuery(filtros)}`,
  );
  const filas = Array.isArray(data) ? data : [];
  return { filas, total: Number(meta?.total ?? filas.length) };
}

export async function crearLiquidacion(
  calculo: CalculoLiquidacion,
  empleadoId: string,
  createdBy?: string,
): Promise<LiquidacionRow> {
  const { data } = await api.post<LiquidacionRow>(
    "/liquidaciones",
    liquidacionAPayload(calculo, empleadoId, createdBy),
  );
  return data;
}

/** Exportado para reutilizar la misma lógica de cálculo en la UI. */
export { calcularLiquidacion };
