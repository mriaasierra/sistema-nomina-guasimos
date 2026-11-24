/**
 * Modelo, cálculos y datos del módulo de Liquidaciones (Finiquitos).
 * Alcaldía Bolivariana del Municipio Guásimos
 */

import {
  empleados,
  formatoMoneda,
  nombreCompleto,
  type Empleado,
} from "./empleados";

export type MotivoRetiro = "Renuncia" | "Despido" | "Jubilación";
export type EstadoLiquidacion = "Pagado" | "En revisión" | "Pendiente";

export const motivosRetiro: MotivoRetiro[] = ["Renuncia", "Despido", "Jubilación"];
export const estadosLiquidacion: EstadoLiquidacion[] = ["Pagado", "En revisión", "Pendiente"];

export const redondear = (valor: number) => Math.round(valor * 100) / 100;

/** Convierte una fecha ISO (yyyy-mm-dd) a dd/mm/yyyy. */
export function formatoFechaISO(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Convierte una fecha dd/mm/yyyy a ISO (yyyy-mm-dd). */
export function isoDesdeTexto(fecha: string): string {
  const [dia, mes, anio] = fecha.split("/");
  if (!dia || !mes || !anio) return "";
  return `${anio}-${mes}-${dia}`;
}

/** Meses completos y días remanentes entre dos fechas ISO. */
export function diferenciaFechas(inicioISO: string, finISO: string) {
  if (!inicioISO || !finISO) return { meses: 0, dias: 0 };
  const inicio = new Date(`${inicioISO}T00:00:00`);
  const fin = new Date(`${finISO}T00:00:00`);
  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fin.getTime()) ||
    fin < inicio
  ) {
    return { meses: 0, dias: 0 };
  }

  let meses =
    (fin.getFullYear() - inicio.getFullYear()) * 12 +
    (fin.getMonth() - inicio.getMonth());
  let dias = fin.getDate() - inicio.getDate();

  if (dias < 0) {
    meses -= 1;
    const diasDelMesAnterior = new Date(
      fin.getFullYear(),
      fin.getMonth(),
      0,
    ).getDate();
    dias += diasDelMesAnterior;
  }

  return { meses: Math.max(0, meses), dias: Math.max(0, dias) };
}

export interface ConceptoLiquidacion {
  dias: number;
  monto: number;
  detalle: string;
}

export interface CalculoLiquidacion {
  empleado: Empleado;
  motivo: MotivoRetiro;
  fechaRetiro: string;
  antiguedad: {
    anios: number;
    meses: number;
    dias: number;
    texto: string;
    mesesTotales: number;
  };
  sueldoBase: number;
  sueldoDiario: number;
  diasVacacionesPendientes: number;
  mesesDelAnio: number;
  prestaciones: ConceptoLiquidacion & { trimestres: number; mesesSuelto: number };
  vacaciones: ConceptoLiquidacion;
  bono: ConceptoLiquidacion;
  utilidades: ConceptoLiquidacion;
  anticipos: number;
  subtotal: number;
  total: number;
}

export interface LiquidacionRegistro extends CalculoLiquidacion {
  id: string;
  estado: EstadoLiquidacion;
  fechaRegistro: string;
}

/**
 * Calcula el finiquito: prestaciones (15 días por trimestre / 5 por mes),
 * vacaciones pendientes, bono y utilidades proporcionales al año, menos anticipos.
 */
export function calcularLiquidacion(
  empleado: Empleado,
  fechaRetiro: string,
  motivo: MotivoRetiro,
  diasVacacionesPendientes = 15,
  anticipos = 0,
): CalculoLiquidacion {
  const ingresoISO = isoDesdeTexto(empleado.fechaIngreso);
  const { meses, dias } = diferenciaFechas(ingresoISO, fechaRetiro);
  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  const sueldoDiario = redondear(empleado.sueldoBase / 30);

  // Prestaciones sociales: 15 días por trimestre completo + 5 por mes suelto.
  const trimestres = Math.floor(meses / 3);
  const mesesSuelto = meses % 3;
  const diasPrestaciones = redondear(
    trimestres * 15 + mesesSuelto * 5 + (dias / 30) * 5,
  );

  // Proporción del año trabajado hasta la fecha de retiro.
  const anioRetiro = Number(fechaRetiro.slice(0, 4)) || new Date().getFullYear();
  const inicioAnioISO = `01/01/${anioRetiro}`.split("/").reverse().join("-");
  const parcialAnio = diferenciaFechas(inicioAnioISO, fechaRetiro);
  const mesesDelAnio = redondear(parcialAnio.meses + parcialAnio.dias / 30);

  const diasBono = redondear(15 * (mesesDelAnio / 12));
  const diasUtilidades = redondear(30 * (mesesDelAnio / 12));
  const diasVacaciones = Math.max(0, Math.round(diasVacacionesPendientes) || 0);

  const prestaciones = {
    dias: diasPrestaciones,
    monto: redondear(diasPrestaciones * sueldoDiario),
    detalle: `${trimestres} trimestre(s) × 15 días + ${mesesSuelto} mes(es) × 5 días`,
    trimestres,
    mesesSuelto,
  };
  const vacaciones = {
    dias: diasVacaciones,
    monto: redondear(diasVacaciones * sueldoDiario),
    detalle: "Días pendientes × sueldo diario",
  };
  const bono = {
    dias: diasBono,
    monto: redondear(diasBono * sueldoDiario),
    detalle: `15 días × ${mesesDelAnio}/12 del año`,
  };
  const utilidades = {
    dias: diasUtilidades,
    monto: redondear(diasUtilidades * sueldoDiario),
    detalle: `30 días × ${mesesDelAnio}/12 del año`,
  };

  const anticiposValidos = Math.max(0, redondear(anticipos || 0));
  const subtotal = redondear(
    prestaciones.monto + vacaciones.monto + bono.monto + utilidades.monto,
  );

  return {
    empleado,
    motivo,
    fechaRetiro,
    antiguedad: {
      anios,
      meses: mesesRestantes,
      dias,
      texto: `${anios} año(s), ${mesesRestantes} mes(es) y ${dias} día(s)`,
      mesesTotales: redondear(meses + dias / 30),
    },
    sueldoBase: empleado.sueldoBase,
    sueldoDiario,
    diasVacacionesPendientes: diasVacaciones,
    mesesDelAnio,
    prestaciones,
    vacaciones,
    bono,
    utilidades,
    anticipos: anticiposValidos,
    subtotal,
    total: redondear(subtotal - anticiposValidos),
  };
}

function registrar(
  id: string,
  empleadoId: string,
  fechaRetiro: string,
  motivo: MotivoRetiro,
  estado: EstadoLiquidacion,
  fechaRegistro: string,
  diasVacaciones = 15,
  anticipos = 0,
): LiquidacionRegistro {
  const empleado = empleados.find((e) => e.id === empleadoId) ?? empleados[0];
  return {
    ...calcularLiquidacion(
      empleado,
      fechaRetiro,
      motivo,
      diasVacaciones,
      anticipos,
    ),
    id,
    estado,
    fechaRegistro,
  };
}

export const liquidacionesHistorial: LiquidacionRegistro[] = [
  registrar("LIQ-2026-011", "EMP-003", "2026-11-11", "Renuncia", "Pagado", "11/11/2026", 12, 1500),
  registrar("LIQ-2026-010", "EMP-011", "2026-11-08", "Jubilación", "Pagado", "08/11/2026", 15, 0),
  registrar("LIQ-2026-009", "EMP-010", "2026-11-16", "Renuncia", "En revisión", "16/11/2026", 8, 2500),
  registrar("LIQ-2026-008", "EMP-008", "2026-11-16", "Despido", "Pendiente", "16/11/2026", 15, 0),
];

export { formatoMoneda, nombreCompleto, empleados };
