/**
 * Modelo, cálculos y datos del módulo de Vacaciones y Bono Vacacional.
 * Alcaldía Bolivariana del Municipio Guásimos
 */

import { empleados, formatoMoneda, nombreCompleto, type Empleado } from "./empleados";

export type EstadoVacacion = "Pendiente" | "En Disfrute" | "Pagado";
export type ModalidadVacacion = "Disfrute" | "Bono Vacacional";

export interface VacacionRegistro {
  id: string;
  empleadoId: string;
  cedula: string;
  nombre: string;
  cargo: string;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  diasHabiles: number;
  sueldoDiario: number;
  montoBono: number;
  estado: EstadoVacacion;
  modalidad: ModalidadVacacion;
}

export const redondear = (valor: number) => Math.round(valor * 100) / 100;

/** El sueldo diario se obtiene dividiendo el sueldo base entre 30. */
export const sueldoDiario = (sueldoBase: number) => redondear(sueldoBase / 30);

/** Bono vacacional: 15 días multiplicados por el sueldo diario. */
export const bonoVacacional = (sueldoBase: number) => redondear(15 * sueldoDiario(sueldoBase));

export function formatoFecha(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Cuenta los días hábiles (lunes a viernes) entre dos fechas ISO, inclusive. */
export function diasHabilesEntre(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0;
  const desde = new Date(`${inicio}T00:00:00`);
  const hasta = new Date(`${fin}T00:00:00`);
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime()) || hasta < desde) return 0;

  let dias = 0;
  const cursor = new Date(desde);
  while (cursor <= hasta) {
    const dia = cursor.getDay();
    if (dia !== 0 && dia !== 6) dias++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

export const aniosVacaciones = [2025, 2026, 2027, 2028] as const;

function registrar(
  id: string,
  indiceEmpleado: number,
  anio: number,
  fechaInicio: string,
  fechaFin: string,
  estado: EstadoVacacion,
  modalidad: ModalidadVacacion,
): VacacionRegistro {
  const empleado: Empleado = empleados[indiceEmpleado];
  return {
    id,
    empleadoId: empleado.id,
    cedula: empleado.cedula,
    nombre: nombreCompleto(empleado),
    cargo: empleado.cargo,
    anio,
    fechaInicio,
    fechaFin,
    diasHabiles: diasHabilesEntre(fechaInicio, fechaFin),
    sueldoDiario: sueldoDiario(empleado.sueldoBase),
    montoBono: bonoVacacional(empleado.sueldoBase),
    estado,
    modalidad,
  };
}

export const vacacionesIniciales: VacacionRegistro[] = [
  registrar("VAC-2026-001", 2, 2026, "2026-11-10", "2026-11-24", "En Disfrute", "Disfrute"),
  registrar("VAC-2026-002", 8, 2026, "2026-11-17", "2026-12-01", "En Disfrute", "Disfrute"),
  registrar("VAC-2026-003", 4, 2026, "2026-12-08", "2026-12-17", "Pagado", "Disfrute"),
  registrar("BON-2026-004", 0, 2026, "2026-12-02", "2026-12-16", "Pendiente", "Bono Vacacional"),
  registrar("BON-2027-005", 3, 2027, "2027-01-15", "2027-01-29", "Pendiente", "Bono Vacacional"),
  registrar("BON-2026-006", 6, 2026, "2026-10-05", "2026-10-19", "Pagado", "Bono Vacacional"),
  registrar("VAC-2026-007", 5, 2026, "2026-11-23", "2026-12-07", "Pendiente", "Disfrute"),
  registrar("VAC-2026-008", 9, 2026, "2026-12-14", "2026-12-28", "Pagado", "Disfrute"),
];

export { formatoMoneda, nombreCompleto, empleados };
