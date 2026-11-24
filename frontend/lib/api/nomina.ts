/**
 * Adaptador de nómina: periodos (`/nominas-periodos`) y pagos
 * (`/pagos-historial`), traduciendo filas `snake_case` al modelo
 * `RegistroNomina` de la UI.
 */

import { api } from "@/lib/api";
import {
  formatoMoneda,
  meses,
  periodoLabel,
  type CalculoNomina,
  type EstadoNomina,
  type Quincena,
  type RegistroNomina,
} from "@/lib/nomina";
import { aQuery, fechaISO, fechaLegible, numeroBackend } from "./comunes";

/** Fila de `nominas_periodos` tal como la devuelve el backend. */
export interface PeriodoRow {
  id: string;
  tipo?: string | null;
  fecha_corte?: string | null;
  estado?: string | null;
  anio?: number | null;
  mes?: number | null;
  quincena?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  fecha_pago?: string | null;
  cantidad_empleados?: number | null;
  total_asignaciones?: string | number | null;
  total_deducciones?: string | number | null;
  total_neto?: string | number | null;
  config_snapshot?: unknown;
  cerrado_por?: string | null;
  cerrado_por_email?: string | null;
  cerrado_at?: string | null;
  created_at?: string | null;
}

/** Fila de `pagos_historial`. */
export interface PagoRow {
  id: string;
  empleado_id: string;
  periodo_id?: string | null;
  sueldo_base_historico?: string | number | null;
  total_asignaciones?: string | number | null;
  total_deducciones?: string | number | null;
  neto_pagado?: string | number | null;
  desglose_calculo?: unknown;
  empleado_snapshot?: unknown;
  observaciones?: string | null;
  anulado?: boolean | null;
  created_at?: string | null;
}

export interface FiltrosPeriodos {
  tipo?: string;
  estado?: string;
  anio?: number;
  mes?: number;
  quincena?: number;
  desde?: string;
  hasta?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: string;
}

/** Normaliza el `estado` del backend a los estados que maneja la UI. */
function mapearEstado(estado?: string | null): EstadoNomina {
  const valor = String(estado ?? "").trim().toLowerCase();
  if (valor.includes("proces") || valor.includes("cerrad")) return "Procesada";
  if (valor.includes("curso")) return "En curso";
  return "Pendiente";
}

/** Etiqueta legible del periodo a partir de tipo/año/mes/quincena. */
function etiquetaPeriodo(fila: PeriodoRow): string {
  const anio = Number(fila.anio) || new Date().getFullYear();
  const numeroMes = Number(fila.mes) || new Date().getMonth() + 1;
  const nombreMes = meses[numeroMes - 1] ?? String(numeroMes);

  const tipo = String(fila.tipo ?? "").toLowerCase();
  if (tipo.includes("bono") || tipo.includes("especial")) {
    return `${nombreMes} ${anio} · ${fila.tipo}`;
  }
  if (tipo.includes("mensual")) {
    return `${nombreMes} ${anio} · Mensual`;
  }

  const quincena = Number(fila.quincena) as Quincena;
  return periodoLabel(nombreMes, anio, quincena === 2 ? 2 : 1);
}

/** Fila del backend → `RegistroNomina` de la UI (id = UUID real). */
export function mapearPeriodo(fila: PeriodoRow): RegistroNomina {
  return {
    id: fila.id,
    periodo: etiquetaPeriodo(fila),
    empleados: Number(fila.cantidad_empleados ?? 0) || 0,
    monto: formatoMoneda(numeroBackend(fila.total_neto)),
    fechaPago: fechaLegible(fila.fecha_pago ?? fila.fecha_corte) || "—",
    estado: mapearEstado(fila.estado),
  };
}

export async function listarPeriodos(
  filtros: FiltrosPeriodos = {},
): Promise<{ registros: RegistroNomina[]; total: number }> {
  const { data, meta } = await api.get<PeriodoRow[]>(
    `/nominas-periodos${aQuery(filtros)}`,
  );
  const filas = Array.isArray(data) ? data : [];
  return {
    registros: filas.map(mapearPeriodo),
    total: Number(meta?.total ?? filas.length),
  };
}

/**
 * Registra un periodo procesado (`POST /nominas-periodos`) y su planilla
 * completa en `pagos_historial` (`POST /pagos-historial` por empleado).
 *
 * Devuelve el periodo creado para refrescar el historial.
 */
export async function procesarNomina(opciones: {
  anio: number;
  mes: string;
  quincena: Quincena;
  fechaPago: string;
  calculos: CalculoNomina[];
}): Promise<PeriodoRow> {
  const { anio, mes, quincena, fechaPago, calculos } = opciones;
  const mesNumero = meses.indexOf(mes as (typeof meses)[number]) + 1;
  const hoy = new Date();

  const diaInicio = quincena === 1 ? "01" : "16";
  const fechaInicio = `${anio}-${String(mesNumero).padStart(2, "0")}-${diaInicio}`;
  const fechaFin =
    quincena === 1
      ? `${anio}-${String(mesNumero).padStart(2, "0")}-15`
      : fechaPago;
  const fechaCorte = fechaPago;

  const totalAsignaciones = calculos.reduce((s, c) => s + c.montoAOtorgar, 0);
  const totalDeducciones = calculos.reduce((s, c) => s + c.totalDed, 0);
  const totalNeto = calculos.reduce((s, c) => s + c.montoAPagar, 0);

  const { data: periodo } = await api.post<PeriodoRow>("/nominas-periodos", {
    tipo: "Quincenal",
    fecha_corte: fechaCorte,
    estado: "Procesada",
    anio,
    mes: mesNumero,
    quincena,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    fecha_pago: fechaPago,
    cantidad_empleados: calculos.length,
    total_asignaciones: Math.round(totalAsignaciones * 100) / 100,
    total_deducciones: Math.round(totalDeducciones * 100) / 100,
    total_neto: Math.round(totalNeto * 100) / 100,
    config_snapshot: {
      moneda: "Bs.",
      periodo: `${quincena}ª quincena de ${mes} ${anio}`,
      reglas: {
        primaPorHijo: 6.25,
        antiguedadPorAnio: 0.01,
        antiguedadMaxima: 0.3,
        faov: 0.01,
        tss: 0.02,
      },
      generadoEn: hoy.toISOString(),
    },
  });

  const pagos = calculos.map((calculo) => ({
    empleado_id: calculo.empleado.id,
    periodo_id: periodo.id,
    sueldo_base_historico: calculo.sueldoBase,
    total_asignaciones: calculo.montoAOtorgar,
    total_deducciones: calculo.totalDed,
    neto_pagado: calculo.montoAPagar,
    desglose_calculo: {
      quincena: calculo.quincenaNumero,
      primaProfesionalizacion: calculo.primaProfesionalizacion,
      primaAntiguedad: calculo.primaAntiguedad,
      primaPorHijo: calculo.primaPorHijo,
      sso: calculo.sso,
      pje: calculo.pje,
      faov: calculo.faov,
      tss: calculo.tss,
      conceptos: calculo.conceptos,
    },
    empleado_snapshot: {
      cedula: calculo.cedula,
      nombres: calculo.empleado.nombres,
      apellidos: calculo.empleado.apellidos,
      cargo: calculo.empleado.cargo,
      oficina: calculo.empleado.departamento,
      fecha_ingreso: calculo.empleado.fechaIngreso,
      sueldo_base: calculo.sueldoBase,
    },
    anulado: false,
  }));

  if (pagos.length) {
    await Promise.all(
      pagos.map((pago) => api.post<PagoRow>("/pagos-historial", pago)),
    );
  }

  return periodo;
}

/** ISO de la fecha de corte institucional (`dd/mm/aaaa` → `yyyy-mm-dd`). */
export function fechaCorteISO(fechaPago: string): string {
  return fechaISO(fechaPago) ?? new Date().toISOString().slice(0, 10);
}
