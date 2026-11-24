/**
 * Cálculos y datos del módulo de Nómina y Pagos.
 * Alcaldía Bolivariana del Municipio Guásimos
 *
 * Estructura institucional de la planilla (columnas oficiales):
 * Cédula · Primer Nombre · Primer Apellido · Fecha de Ingreso · Cargo ·
 * Sueldo Base · Quincena · Prima de Profesionalización · Prima de Antigüedad ·
 * Prima por Hijo · Monto a Otorgar · Pago Mensual · S.S.O. · P.I.E. ·
 * F.A.O.V. · TSS · Total Ded. · Monto a Pagar.
 */

import {
  cargoOficial,
  PORCENTAJES_PROFESIONALIZACION,
  type GradoAcademico,
} from "./cargos";
import {
  empleados,
  esHijo,
  formatoMoneda,
  nombreCompleto,
  type Empleado,
  type TipoNomina,
} from "./empleados";

export const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export const anios = [2025, 2026, 2027] as const;
export type Quincena = 1 | 2;
export type EstadoNomina = "Procesada" | "En curso" | "Pendiente";

export interface ConceptoNomina {
  codigo: string;
  descripcion: string;
  tipo: "asignacion" | "deduccion";
  monto: number;
}

/**
 * Fila oficial de la planilla de nómina.
 * Los campos `asignaciones`, `deducciones` y `neto` se conservan como alias
 * para compatibilidad con el dashboard y los historial de movimientos.
 */
export interface CalculoNomina {
  empleado: Empleado;
  cedula: string;
  primerNombre: string;
  primerApellido: string;
  fechaIngreso: string;
  cargo: string;
  sueldoBase: number;
  /** Monto quincenal (Sueldo Base / 2). */
  quincena: number;
  quincenaNumero: Quincena;
  primaProfesionalizacion: number;
  primaAntiguedad: number;
  primaPorHijo: number;
  montoAOtorgar: number;
  pagoMensual: number;
  sso: number;
  pje: number;
  faov: number;
  tss: number;
  totalDed: number;
  montoAPagar: number;
  // Aliases de compatibilidad
  asignaciones: number;
  deducciones: number;
  neto: number;
  conceptos: ConceptoNomina[];
}

export interface RegistroNomina {
  id: string;
  periodo: string;
  empleados: number;
  monto: string;
  fechaPago: string;
  estado: EstadoNomina;
}

export const redondear = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Porcentajes de ley aplicados al Sueldo Base.
 * S.S.O. y P.I.E. no aparecen aquí porque son montos fijos por cargo
 * (ver `cargosOficiales` en `lib/cargos.ts`).
 */
export const PORCENTAJES_DEDUCCION = {
  faov: 0.01,
  tss: 0.02,
} as const;

/** Monto fijo entregado por cada hijo registrado en la carga familiar. */
export const PRIMA_POR_HIJO = 6.25;

/** Antigüedad: 1% por año cumplido, con tope del 30% del sueldo base. */
export const PORCENTAJE_ANTIGUEDAD_POR_ANIO = 0.01;
export const PORCENTAJE_ANTIGUEDAD_MAXIMO = 0.3;

/** Parsea una fecha dd/mm/aaaa de forma segura. */
function parsearFecha(fecha: string): Date | null {
  const partes = fecha.split("/").map(Number);
  if (partes.length !== 3 || partes.some((n) => Number.isNaN(n))) return null;
  const [dia, mes, anio] = partes;
  return new Date(anio, mes - 1, dia);
}

/** Años cumplidos entre una fecha dd/mm/aaaa y la fecha de referencia. */
function aniosCumplidos(fecha: string, referencia: Date): number {
  const inicio = parsearFecha(fecha);
  if (!inicio) return 0;
  let anios = referencia.getFullYear() - inicio.getFullYear();
  if (
    referencia.getMonth() < inicio.getMonth() ||
    (referencia.getMonth() === inicio.getMonth() &&
      referencia.getDate() < inicio.getDate())
  ) {
    anios -= 1;
  }
  return Math.max(0, anios);
}

/**
 * Calcula la planilla completa siguiendo el formato oficial:
 * - Sueldo Base: monto mensual según el cargo (catálogo oficial en Bs.).
 * - Quincena: exactamente el 50% del sueldo base.
 * - Prima de Profesionalización: según el grado académico (20% a 40%).
 * - Prima de Antigüedad: 1% por año de servicio, máximo 30%.
 * - Prima por Hijo: Bs. 6,25 por cada hijo registrado.
 * - Monto a Otorgar / Pago Mensual: sueldo base + primas.
 * - Deducciones: S.S.O. y P.I.E. fijos por cargo; F.A.O.V. 1% y T.S.S. 2% del sueldo base.
 * - Monto a Pagar: Pago Mensual − Total Ded.
 */
export function calcularNomina(
  lista: Empleado[],
  quincena: Quincena,
  fechaReferencia: Date = new Date(),
): CalculoNomina[] {
  return lista.map((empleado) => {
    const cargo = cargoOficial(empleado.cargo);
    // El sueldo real del backend (`empleados.sueldo_base`) tiene prioridad;
    // la escala oficial del catálogo solo se usa como respaldo.
    const sueldoBase = redondear(
      empleado.sueldoBase || cargo?.sueldoBase || 0,
    );
    const montoQuincena = redondear(sueldoBase / 2);

    const porcentajeProfesionalizacion =
      PORCENTAJES_PROFESIONALIZACION[
        empleado.gradoAcademico as GradoAcademico
      ] ?? 0;
    const primaProfesionalizacion = redondear(
      sueldoBase * porcentajeProfesionalizacion,
    );
    const aniosServicio = aniosCumplidos(empleado.fechaIngreso, fechaReferencia);
    const porcentajeAntiguedad = Math.min(
      aniosServicio * PORCENTAJE_ANTIGUEDAD_POR_ANIO,
      PORCENTAJE_ANTIGUEDAD_MAXIMO,
    );
    const primaAntiguedad = redondear(sueldoBase * porcentajeAntiguedad);
    const cantidadHijos = empleado.cargaFamiliar.filter(esHijo).length;
    const primaPorHijo = redondear(cantidadHijos * PRIMA_POR_HIJO);

    const montoAOtorgar = redondear(
      sueldoBase + primaProfesionalizacion + primaAntiguedad + primaPorHijo,
    );
    const pagoMensual = montoAOtorgar;

    const sso = redondear(cargo?.sso ?? 0);
    const pje = redondear(cargo?.pje ?? 0);
    const faov = redondear(sueldoBase * PORCENTAJES_DEDUCCION.faov);
    const tss = redondear(sueldoBase * PORCENTAJES_DEDUCCION.tss);
    const totalDed = redondear(sso + pje + faov + tss);
    const montoAPagar = redondear(pagoMensual - totalDed);

    const asignaciones = redondear(
      primaProfesionalizacion + primaAntiguedad + primaPorHijo,
    );

    const conceptos: ConceptoNomina[] = [
      { codigo: "SUE-010", descripcion: "Sueldo base", tipo: "asignacion", monto: sueldoBase },
      {
        codigo: "PRO-020",
        descripcion: "Prima de profesionalización",
        tipo: "asignacion",
        monto: primaProfesionalizacion,
      },
      {
        codigo: "ANT-030",
        descripcion: "Prima de antigüedad",
        tipo: "asignacion",
        monto: primaAntiguedad,
      },
      { codigo: "HIJ-040", descripcion: "Prima por hijo", tipo: "asignacion", monto: primaPorHijo },
      { codigo: "SSO-050", descripcion: "S.S.O. (monto fijo por cargo)", tipo: "deduccion", monto: sso },
      { codigo: "PJE-060", descripcion: "P.I.E. (monto fijo por cargo)", tipo: "deduccion", monto: pje },
      {
        codigo: "FAO-070",
        descripcion: `F.A.O.V. (${Math.round(PORCENTAJES_DEDUCCION.faov * 100)}% del sueldo base)`,
        tipo: "deduccion",
        monto: faov,
      },
      {
        codigo: "TSS-080",
        descripcion: `T.S.S. (${Math.round(PORCENTAJES_DEDUCCION.tss * 100)}% del sueldo base)`,
        tipo: "deduccion",
        monto: tss,
      },
    ];

    return {
      empleado,
      cedula: empleado.cedula,
      primerNombre: empleado.nombres.split(" ")[0] ?? empleado.nombres,
      primerApellido: empleado.apellidos.split(" ")[0] ?? empleado.apellidos,
      fechaIngreso: empleado.fechaIngreso,
      cargo: empleado.cargo,
      sueldoBase,
      quincena: montoQuincena,
      quincenaNumero: quincena,
      primaProfesionalizacion,
      primaAntiguedad,
      primaPorHijo,
      montoAOtorgar,
      pagoMensual,
      sso,
      pje,
      faov,
      tss,
      totalDed,
      montoAPagar,
      asignaciones,
      deducciones: totalDed,
      neto: montoAPagar,
      conceptos,
    };
  });
}

export function periodoLabel(mes: string, anio: number, quincena: Quincena): string {
  return `${mes} ${anio} · ${quincena}ª quincena`;
}

export function fechaCorte(anio: number, mes: string, quincena: Quincena): string {
  const mesNumero = String(meses.indexOf(mes as (typeof meses)[number]) + 1).padStart(2, "0");
  const dia = quincena === 1 ? "15" : "28";
  return `${dia}/${mesNumero}/${anio}`;
}

export const empleadosActivos = empleados.filter((e) => e.estado === "Activo");

export const nominasHistorial: RegistroNomina[] = [
  {
    id: "NOM-2026-11-2",
    periodo: "Noviembre 2026 · 2ª quincena",
    empleados: 248,
    monto: "Bs. 1.284.560,00",
    fechaPago: "15/11/2026",
    estado: "Procesada",
  },
  {
    id: "NOM-2026-11-1",
    periodo: "Noviembre 2026 · 1ª quincena",
    empleados: 246,
    monto: "Bs. 1.271.930,00",
    fechaPago: "31/10/2026",
    estado: "Procesada",
  },
  {
    id: "NOM-2026-10-2",
    periodo: "Octubre 2026 · 2ª quincena",
    empleados: 244,
    monto: "Bs. 1.268.410,00",
    fechaPago: "15/10/2026",
    estado: "Procesada",
  },
  {
    id: "NOM-2026-12-BV",
    periodo: "Diciembre 2026 · Bono vacacional",
    empleados: 38,
    monto: "Bs. 214.700,00",
    fechaPago: "20/12/2026",
    estado: "En curso",
  },
  {
    id: "NOM-2026-12-1",
    periodo: "Diciembre 2026 · 1ª quincena",
    empleados: 0,
    monto: "—",
    fechaPago: "15/12/2026",
    estado: "Pendiente",
  },
];

export { formatoMoneda, nombreCompleto, empleados };
