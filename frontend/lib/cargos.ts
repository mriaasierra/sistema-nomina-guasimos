/**
 * Catálogo oficial de cargos de la Alcaldía Bolivariana del Municipio Guásimos.
 * Fuente única de sueldos base y deducciones fijas (S.S.O. y P.I.E.).
 * Los montos están expresados en bolívares (Bs.).
 */

export interface CargoOficial {
  nombre: string;
  sueldoBase: number;
  sso: number;
  pje: number;
}

export const cargosOficiales = [
  { nombre: "Alcaldesa", sueldoBase: 427, sso: 7.88, pje: 0.49 },
  { nombre: "Síndico", sueldoBase: 409, sso: 7.55, pje: 0.47 },
  { nombre: "Director", sueldoBase: 376, sso: 6.94, pje: 0.43 },
  { nombre: "Auditoría", sueldoBase: 376, sso: 6.42, pje: 0.43 },
  { nombre: "Coordinador", sueldoBase: 348, sso: 6.42, pje: 0.40 },
  { nombre: "Seguridad", sueldoBase: 348, sso: 6.42, pje: 0.40 },
  { nombre: "Coord. Contabilidad", sueldoBase: 336, sso: 6.20, pje: 0.39 },
  { nombre: "Asistente Administrativo", sueldoBase: 348, sso: 6.42, pje: 0.40 },
  { nombre: "Secretaria", sueldoBase: 130, sso: 2.40, pje: 0.15 },
  { nombre: "Bionalista", sueldoBase: 130, sso: 2.40, pje: 0.15 },
  { nombre: "Obrero", sueldoBase: 130, sso: 2.40, pje: 0.15 },
] as const satisfies readonly CargoOficial[];

export type NombreCargo = (typeof cargosOficiales)[number]["nombre"];

/** Devuelve la configuración oficial de un cargo, o `undefined` si no existe. */
export function cargoOficial(nombre: string): CargoOficial | undefined {
  return cargosOficiales.find((cargo) => cargo.nombre === nombre);
}

/** Nombres de los cargos, listos para un `<select>`. */
export const nombresCargos: readonly NombreCargo[] = cargosOficiales.map(
  (cargo) => cargo.nombre,
);

/** Grados académicos reconocidos para la prima de profesionalización. */
export const gradosAcademicos = [
  "No registra",
  "T.S.U.",
  "Profesional",
  "Especialista",
  "Maestría",
  "Doctorado",
] as const;

export type GradoAcademico = (typeof gradosAcademicos)[number];

/** Porcentaje de la prima de profesionalización aplicado al sueldo base. */
export const PORCENTAJES_PROFESIONALIZACION: Record<GradoAcademico, number> = {
  "No registra": 0,
  "T.S.U.": 0.2,
  Profesional: 0.25,
  Especialista: 0.3,
  Maestría: 0.35,
  Doctorado: 0.4,
};
