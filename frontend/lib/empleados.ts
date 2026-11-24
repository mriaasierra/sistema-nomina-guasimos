/**
 * Modelo y datos de prueba del módulo de Personal.
 * Alcaldía Bolivariana del Municipio Guásimos
 */

import {
  cargoOficial,
  type GradoAcademico,
  type NombreCargo,
} from "./cargos";

/** Catálogo oficial de cargos, sueldos y grados académicos (fuente única). */
export {
  cargosOficiales,
  nombresCargos,
  gradosAcademicos,
  cargoOficial,
  PORCENTAJES_PROFESIONALIZACION,
} from "./cargos";
export type { CargoOficial, GradoAcademico, NombreCargo } from "./cargos";

/** Sueldo base oficial de un cargo, usado al construir los datos de prueba. */
const sueldoDe = (cargo: NombreCargo): number => cargoOficial(cargo)?.sueldoBase ?? 0;

/**
 * Catálogo oficial de dependencias de la Alcaldía Bolivariana del Municipio Guásimos.
 * Fuente única para formularios, filtros, reportes y datos de prueba.
 */
export const dependencias = [
  "Casa de los Abuelos",
  "Registro del Municipio Guásimos",
  "Dirección de Administración",
  "Sindicatura",
  "Dirección de Servicios Comunitarios",
  "Dirección de Rentas",
  "Sala Técnica de Autogobierno",
  "Dirección de Desarrollo Urbano",
  "Dirección de Gestión Social, Misiones y Grandes Misiones",
  "Secretaría de Deporte",
  "Secretaría de Vivienda",
  "Ambulatorio de Caneyes",
  "Sistema de Protección Integral de Niños, Niñas y Adolescentes",
  "Despacho",
  "Secretaría de Turismo",
  "Secretaría de Seguridad Ciudadana",
  "Protección Civil",
  "Dirección General",
  "Sala Universitaria",
  "Secretaría de Cultura",
  "Dirección de Recursos Humanos",
  "Sin dirección",
  "Auditoría",
] as const;

/** Alias conservado por compatibilidad con los componentes existentes. */
export const departamentos = dependencias;

export const tiposNomina = ["Fijo", "Contratado", "Obrero"] as const;

export type Departamento = (typeof dependencias)[number];
export type Dependencia = Departamento;
export type TipoNomina = (typeof tiposNomina)[number];
export type EstadoEmpleado = "Activo" | "Retirado";

export interface Familiar {
  nombre: string;
  parentesco: string;
  cedula: string;
  fechaNacimiento: string;
}

/**
 * Modelo de empleado de la UI.
 *
 * Los campos de texto (`cargo`, `departamento`, `tipoNomina`, `gradoAcademico`)
 * se relajaron a `string` para aceptar los catálogos reales del backend, y se
 * conservan los UUIDs reales (`oficinaId`, `cargoId`, `tipoNominaId`) para
 * resolver nombres → `*_id` al enviar datos al backend.
 *
 * Los campos sin columna en el esquema PostgreSQL (`lugarNacimiento`,
 * `estadoCivil`, `tipoCuenta`, datos de sangre) son opcionales: solo existen
 * en los datos de prueba históricos.
 */
export interface Empleado {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  /** Nombre del cargo, resuelto desde el catálogo `cargos` (UUID en `cargoId`). */
  cargo: string;
  /** Nombre de la oficina/dependencia (UUID en `oficinaId`). */
  departamento: string;
  /** Nombre del tipo de nómina (UUID en `tipoNominaId`). */
  tipoNomina: string;
  /** Vinculación laboral (Fijo / Contratado / Obrero), requerida por el backend. */
  tipoVinculacion?: string;
  /** Grado académico que determina la prima de profesionalización. */
  gradoAcademico: string;
  fechaIngreso: string;
  sueldoBase: number;
  estado: EstadoEmpleado;
  // Datos personales
  fechaNacimiento: string;
  lugarNacimiento?: string;
  estadoCivil?: string;
  genero: string;
  direccion: string;
  telefono: string;
  correo: string;
  // Datos laborales y bancarios
  banco: string;
  tipoCuenta?: string;
  numeroCuenta: string;
  // Carga familiar (se persiste en `hijos_detalle` como JSON)
  cargaFamiliar: Familiar[];
  // Tallas y salud
  tallas: { camisa: string; pantalon: string; calzado: string };
  salud: {
    tipoSangre?: string;
    alergias?: string;
    enfermedades?: string;
    discapacidad?: string;
    observaciones?: string;
    /** Condición médica real del backend. */
    tieneEnfermedad?: boolean;
    detalle?: string;
    notas?: string;
  };
  // Identificadores reales del backend (UUID)
  oficinaId?: string | null;
  cargoId?: string | null;
  tipoNominaId?: string | null;
  tieneHijos?: boolean;
  hijosMenores?: number;
  /** `created_at` del registro (ISO), para novedades del dashboard. */
  creadoEn?: string | null;
}

export function formatoMoneda(valor: number): string {
  const [entero, decimales] = valor.toFixed(2).split(".");
  return `Bs. ${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimales}`;
}

export function nombreCompleto(empleado: Empleado): string {
  return `${empleado.nombres} ${empleado.apellidos}`.trim();
}

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Fecha de corte determinista usada en el primer render (SSR) para que las edades
 * calculadas no provoquen desfase de hidratación. Tras montar, la interfaz usa la
 * fecha real del navegador.
 */
export const FECHA_CORTE = new Date(2026, 10, 17);

/** Calcula la edad en años; acepta DD/MM/AAAA y AAAA-MM-DD. */
export function calcularEdad(
  fechaNacimiento: string,
  fechaReferencia: Date = new Date(),
): number | null {
  const texto = fechaNacimiento?.trim() ?? "";
  if (!texto || texto === "No registrada" || texto === "—") return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  const es = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);
  let anio = 0;
  let mes = 0;
  let dia = 0;
  if (iso) {
    anio = Number(iso[1]);
    mes = Number(iso[2]);
    dia = Number(iso[3]);
  } else if (es) {
    dia = Number(es[1]);
    mes = Number(es[2]);
    anio = Number(es[3]);
  } else {
    return null;
  }

  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  let edad = fechaReferencia.getFullYear() - anio;
  const mesActual = fechaReferencia.getMonth() + 1;
  const diaActual = fechaReferencia.getDate();
  if (mesActual < mes || (mesActual === mes && diaActual < dia)) edad -= 1;
  return edad >= 0 && edad < 120 ? edad : null;
}

/** Reconoce Hijo, Hija y la variante del formulario Hijo(a). */
export function esHijo(familiar: Familiar): boolean {
  return normalizarTexto(familiar.parentesco).startsWith("hij");
}

export function hijosDelEmpleado(empleado: Empleado): Familiar[] {
  return empleado.cargaFamiliar.filter(esHijo);
}

export function edadesHijos(
  empleado: Empleado,
  fechaReferencia: Date = new Date(),
): number[] {
  return hijosDelEmpleado(empleado)
    .map((familiar) => calcularEdad(familiar.fechaNacimiento, fechaReferencia))
    .filter((edad): edad is number => edad !== null);
}

const ORDEN_CAMISAS = ["XS", "S", "M", "L", "XL", "XXL"];

export function ordenarTallasCamisa(valores: string[]): string[] {
  return [...new Set(valores)].sort((a, b) => {
    const ia = ORDEN_CAMISAS.indexOf(a);
    const ib = ORDEN_CAMISAS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function ordenarTallasNumericas(valores: string[]): string[] {
  return [...new Set(valores)].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
}

export const empleados: Empleado[] = [
  {
    id: "EMP-001",
    cedula: "12.486.903",
    nombres: "María Elena",
    apellidos: "Rojas Contreras",
    cargo: "Director",
    departamento: "Dirección de Recursos Humanos",
    tipoNomina: "Fijo",
    gradoAcademico: "Maestría",
    fechaIngreso: "15/03/2014",
    sueldoBase: sueldoDe("Director"),
    estado: "Activo",
    fechaNacimiento: "22/07/1982",
    lugarNacimiento: "Puerto Ordaz, Bolívar",
    estadoCivil: "Casada",
    genero: "Femenino",
    direccion: "Calle Bolívar N° 24, Barrio El Centro, Guásimos",
    telefono: "0414-882-1093",
    correo: "mrojas@guasimos.gob.ve",
    banco: "Banco de Venezuela",
    tipoCuenta: "Cuenta Corriente",
    numeroCuenta: "0102-0845-23-0012845901",
    cargaFamiliar: [
      { nombre: "Sofía Alejandra Ruiz Rojas", parentesco: "Hija", cedula: "32.114.908", fechaNacimiento: "14/05/2013" },
      { nombre: "Jorge Enrique Ruiz Rojas", parentesco: "Hijo", cedula: "34.775.120", fechaNacimiento: "03/11/2016" },
    ],
    tallas: { camisa: "M", pantalon: "10", calzado: "37" },
    salud: { tipoSangre: "O+", alergias: "Penicilina", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Control médico anual al día" },
  },
  {
    id: "EMP-002",
    cedula: "21.104.772",
    nombres: "José Antonio",
    apellidos: "Ferrer Rodríguez",
    cargo: "Asistente Administrativo",
    departamento: "Dirección de Recursos Humanos",
    tipoNomina: "Contratado",
    gradoAcademico: "Profesional",
    fechaIngreso: "02/09/2026",
    sueldoBase: sueldoDe("Asistente Administrativo"),
    estado: "Activo",
    fechaNacimiento: "09/02/1994",
    lugarNacimiento: "San Félix, Bolívar",
    estadoCivil: "Soltero",
    genero: "Masculino",
    direccion: "Av. Libertador N° 58, Palmira, Guásimos",
    telefono: "0424-315-7762",
    correo: "jferrer@guasimos.gob.ve",
    banco: "Banesco",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0134-0921-45-4471023890",
    cargaFamiliar: [],
    tallas: { camisa: "L", pantalon: "32", calzado: "41" },
    salud: { tipoSangre: "A+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Examen de ingreso aprobado" },
  },
  {
    id: "EMP-003",
    cedula: "9.873.215",
    nombres: "Carmen Josefina",
    apellidos: "López Martínez",
    cargo: "Asistente Administrativo",
    departamento: "Sala Universitaria",
    tipoNomina: "Fijo",
    gradoAcademico: "Profesional",
    fechaIngreso: "10/01/2011",
    sueldoBase: sueldoDe("Asistente Administrativo"),
    estado: "Activo",
    fechaNacimiento: "18/12/1979",
    lugarNacimiento: "Tumeremo, Bolívar",
    estadoCivil: "Divorciada",
    genero: "Femenino",
    direccion: "Calle Sucre N° 12, El Manteco, Guásimos",
    telefono: "0416-709-4421",
    correo: "clopez@guasimos.gob.ve",
    banco: "Banco Provincial",
    tipoCuenta: "Cuenta Corriente",
    numeroCuenta: "0108-0455-60-1120987345",
    cargaFamiliar: [
      { nombre: "Andrea Nicole López Martínez", parentesco: "Hija", cedula: "30.882.451", fechaNacimiento: "27/08/2011" },
    ],
    tallas: { camisa: "S", pantalon: "8", calzado: "36" },
    salud: { tipoSangre: "B+", alergias: "Polen", enfermedades: "Hipertensión controlada", discapacidad: "No", observaciones: "Requiere descanso programado" },
  },
  {
    id: "EMP-004",
    cedula: "18.335.620",
    nombres: "Luis Enrique",
    apellidos: "Márquez Díaz",
    cargo: "Coordinador",
    departamento: "Dirección de Desarrollo Urbano",
    tipoNomina: "Fijo",
    gradoAcademico: "Especialista",
    fechaIngreso: "22/06/2017",
    sueldoBase: sueldoDe("Coordinador"),
    estado: "Activo",
    fechaNacimiento: "04/04/1986",
    lugarNacimiento: "Ciudad Bolívar, Bolívar",
    estadoCivil: "Casado",
    genero: "Masculino",
    direccion: "Urbanización La Esperanza, Casa 18, Guásimos",
    telefono: "0412-556-9034",
    correo: "lmarquez@guasimos.gob.ve",
    banco: "BOD",
    tipoCuenta: "Cuenta Corriente",
    numeroCuenta: "0191-0338-71-0091827364",
    cargaFamiliar: [
      { nombre: "Valeria del Valle Márquez Gil", parentesco: "Hija", cedula: "35.009.118", fechaNacimiento: "19/01/2018" },
      { nombre: "Mateo Enrique Márquez Gil", parentesco: "Hijo", cedula: "37.442.006", fechaNacimiento: "11/06/2021" },
    ],
    tallas: { camisa: "XL", pantalon: "36", calzado: "43" },
    salud: { tipoSangre: "AB+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Botas de seguridad talla 43" },
  },
  {
    id: "EMP-005",
    cedula: "14.902.441",
    nombres: "Yusmari del Carmen",
    apellidos: "Peña Ortega",
    cargo: "Bionalista",
    departamento: "Ambulatorio de Caneyes",
    tipoNomina: "Fijo",
    gradoAcademico: "T.S.U.",
    fechaIngreso: "05/11/2019",
    sueldoBase: sueldoDe("Bionalista"),
    estado: "Activo",
    fechaNacimiento: "30/09/1990",
    lugarNacimiento: "Puerto Ordaz, Bolívar",
    estadoCivil: "Soltera",
    genero: "Femenino",
    direccion: "Calle Miranda N° 41, Sector La Paz, Guásimos",
    telefono: "0424-887-1206",
    correo: "ypeña@guasimos.gob.ve",
    banco: "Banco de Venezuela",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0102-0771-33-2281990456",
    cargaFamiliar: [],
    tallas: { camisa: "M", pantalon: "12", calzado: "38" },
    salud: { tipoSangre: "O-", alergias: "Látex", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Vacunación completa" },
  },
  {
    id: "EMP-006",
    cedula: "25.618.094",
    nombres: "Andrés Ramón",
    apellidos: "Vargas Jiménez",
    cargo: "Asistente Administrativo",
    departamento: "Dirección de Administración",
    tipoNomina: "Contratado",
    gradoAcademico: "T.S.U.",
    fechaIngreso: "18/04/2023",
    sueldoBase: sueldoDe("Asistente Administrativo"),
    estado: "Activo",
    fechaNacimiento: "12/06/1997",
    lugarNacimiento: "San Félix, Bolívar",
    estadoCivil: "Soltero",
    genero: "Masculino",
    direccion: "Av. Principal de Palmira, Edif. Los Pinos, Apto 4",
    telefono: "0414-220-6688",
    correo: "avargas@guasimos.gob.ve",
    banco: "Banesco",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0134-1188-90-3312047586",
    cargaFamiliar: [],
    tallas: { camisa: "M", pantalon: "30", calzado: "40" },
    salud: { tipoSangre: "A-", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Sin observaciones" },
  },
  {
    id: "EMP-007",
    cedula: "11.247.863",
    nombres: "Rosa María",
    apellidos: "Chacón Bermúdez",
    cargo: "Asistente Administrativo",
    departamento: "Sala Técnica de Autogobierno",
    tipoNomina: "Fijo",
    gradoAcademico: "Profesional",
    fechaIngreso: "09/09/2015",
    sueldoBase: sueldoDe("Asistente Administrativo"),
    estado: "Activo",
    fechaNacimiento: "26/02/1985",
    lugarNacimiento: "El Manteco, Bolívar",
    estadoCivil: "Casada",
    genero: "Femenino",
    direccion: "Calle Bolívar N° 67, El Manteco, Guásimos",
    telefono: "0416-334-9012",
    correo: "rchacon@guasimos.gob.ve",
    banco: "Banco Provincial",
    tipoCuenta: "Cuenta Corriente",
    numeroCuenta: "0108-0223-14-7712098436",
    cargaFamiliar: [
      { nombre: "Diego Alejandro Ramos Chacón", parentesco: "Hijo", cedula: "33.190.774", fechaNacimiento: "08/03/2015" },
    ],
    tallas: { camisa: "S", pantalon: "9", calzado: "37" },
    salud: { tipoSangre: "B-", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Sin observaciones" },
  },
  {
    id: "EMP-008",
    cedula: "20.771.338",
    nombres: "Oscar Daniel",
    apellidos: "Medina Torres",
    cargo: "Seguridad",
    departamento: "Dirección de Desarrollo Urbano",
    tipoNomina: "Obrero",
    gradoAcademico: "T.S.U.",
    fechaIngreso: "30/01/2021",
    sueldoBase: sueldoDe("Seguridad"),
    estado: "Retirado",
    fechaNacimiento: "17/10/1988",
    lugarNacimiento: "Tumeremo, Bolívar",
    estadoCivil: "Soltero",
    genero: "Masculino",
    direccion: "Sector La Ceiba, Casa 9, Guásimos",
    telefono: "0412-908-4473",
    correo: "omedina@guasimos.gob.ve",
    banco: "BOD",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0191-0660-82-4430918274",
    cargaFamiliar: [],
    tallas: { camisa: "L", pantalon: "34", calzado: "42" },
    salud: { tipoSangre: "O+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Retirado el 16/11/2026" },
  },
  {
    id: "EMP-009",
    cedula: "17.550.219",
    nombres: "Pedro",
    apellidos: "Almendra González",
    cargo: "Obrero",
    departamento: "Dirección de Servicios Comunitarios",
    tipoNomina: "Obrero",
    gradoAcademico: "No registra",
    fechaIngreso: "12/02/2022",
    sueldoBase: sueldoDe("Obrero"),
    estado: "Activo",
    fechaNacimiento: "21/05/1992",
    lugarNacimiento: "Guásimos, Bolívar",
    estadoCivil: "Casado",
    genero: "Masculino",
    direccion: "Calle 5 de Julio N° 33, Guásimos",
    telefono: "0414-665-2189",
    correo: "palmendra@guasimos.gob.ve",
    banco: "Banco de Venezuela",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0102-0551-29-9901234567",
    cargaFamiliar: [
      { nombre: "Kellys Yamilet Almendra Ruiz", parentesco: "Hija", cedula: "36.220.119", fechaNacimiento: "02/02/2020" },
    ],
    tallas: { camisa: "L", pantalon: "33", calzado: "42" },
    salud: { tipoSangre: "A+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Usa equipos de protección" },
  },
  {
    id: "EMP-010",
    cedula: "8.964.127",
    nombres: "Nélida Coromoto",
    apellidos: "Gil Hernández",
    cargo: "Obrero",
    departamento: "Casa de los Abuelos",
    tipoNomina: "Fijo",
    gradoAcademico: "No registra",
    fechaIngreso: "03/07/2018",
    sueldoBase: sueldoDe("Obrero"),
    estado: "Activo",
    fechaNacimiento: "14/01/1976",
    lugarNacimiento: "Ciudad Bolívar, Bolívar",
    estadoCivil: "Casada",
    genero: "Femenino",
    direccion: "Calle Negros Primera N° 18, Guásimos",
    telefono: "0424-118-7702",
    correo: "ngil@guasimos.gob.ve",
    banco: "Banesco",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0134-0442-16-2077183950",
    cargaFamiliar: [],
    tallas: { camisa: "M", pantalon: "12", calzado: "38" },
    salud: { tipoSangre: "B+", alergias: "Ninguna", enfermedades: "Diabetes controlada", discapacidad: "No", observaciones: "Carnet de manipulación de alimentos vigente" },
  },
  {
    id: "EMP-011",
    cedula: "26.340.118",
    nombres: "Rafael Ángel",
    apellidos: "Soto Medina",
    cargo: "Obrero",
    departamento: "Dirección de Administración",
    tipoNomina: "Obrero",
    gradoAcademico: "No registra",
    fechaIngreso: "19/05/2016",
    sueldoBase: sueldoDe("Obrero"),
    estado: "Retirado",
    fechaNacimiento: "05/08/1968",
    lugarNacimiento: "Puerto Ordaz, Bolívar",
    estadoCivil: "Casado",
    genero: "Masculino",
    direccion: "Sector El Carmen, Casa 22, Guásimos",
    telefono: "0414-990-3371",
    correo: "rsoto@guasimos.gob.ve",
    banco: "BOD",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0191-0277-54-1182937465",
    cargaFamiliar: [],
    tallas: { camisa: "L", pantalon: "34", calzado: "41" },
    salud: { tipoSangre: "O+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Jubilado el 08/11/2026" },
  },
  {
    id: "EMP-012",
    cedula: "15.772.904",
    nombres: "Lusmila del Valle",
    apellidos: "Ortega Flores",
    cargo: "Asistente Administrativo",
    departamento: "Ambulatorio de Caneyes",
    tipoNomina: "Fijo",
    gradoAcademico: "Doctorado",
    fechaIngreso: "08/08/2020",
    sueldoBase: sueldoDe("Asistente Administrativo"),
    estado: "Activo",
    fechaNacimiento: "11/03/1987",
    lugarNacimiento: "Caracas, Distrito Capital",
    estadoCivil: "Soltera",
    genero: "Femenino",
    direccion: "Av. Bolívar N° 90, Consultorio Central, Guásimos",
    telefono: "0412-447-2260",
    correo: "lortega@guasimos.gob.ve",
    banco: "Banco Provincial",
    tipoCuenta: "Cuenta Corriente",
    numeroCuenta: "0108-0677-21-5564019283",
    cargaFamiliar: [],
    tallas: { camisa: "S", pantalon: "8", calzado: "37" },
    salud: { tipoSangre: "AB-", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Especialidad en medicina general" },
  },
  {
    id: "EMP-013",
    cedula: "10.224.556",
    nombres: "Delsa Coromoto",
    apellidos: "Márquez Peña",
    cargo: "Alcaldesa",
    departamento: "Despacho",
    tipoNomina: "Fijo",
    gradoAcademico: "Profesional",
    fechaIngreso: "10/01/2017",
    sueldoBase: sueldoDe("Alcaldesa"),
    estado: "Activo",
    fechaNacimiento: "02/04/1975",
    lugarNacimiento: "Guásimos, Bolívar",
    estadoCivil: "Casada",
    genero: "Femenino",
    direccion: "Calle Bolívar N° 1, Palmira, Guásimos",
    telefono: "0414-100-2000",
    correo: "alcaldia@guasimos.gob.ve",
    banco: "Banco de Venezuela",
    tipoCuenta: "Cuenta Corriente",
    numeroCuenta: "0102-0001-01-0001002001",
    cargaFamiliar: [],
    tallas: { camisa: "M", pantalon: "10", calzado: "38" },
    salud: { tipoSangre: "O+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Sin observaciones" },
  },
  {
    id: "EMP-014",
    cedula: "16.845.901",
    nombres: "Julio César",
    apellidos: "Bermúdez Soto",
    cargo: "Síndico",
    departamento: "Sindicatura",
    tipoNomina: "Fijo",
    gradoAcademico: "Profesional",
    fechaIngreso: "17/07/2018",
    sueldoBase: sueldoDe("Síndico"),
    estado: "Activo",
    fechaNacimiento: "19/11/1980",
    lugarNacimiento: "Ciudad Bolívar, Bolívar",
    estadoCivil: "Casado",
    genero: "Masculino",
    direccion: "Av. Sucre N° 18, Guásimos",
    telefono: "0416-200-3000",
    correo: "sindicatura@guasimos.gob.ve",
    banco: "Banco Provincial",
    tipoCuenta: "Cuenta Corriente",
    numeroCuenta: "0108-0002-02-0002003002",
    cargaFamiliar: [],
    tallas: { camisa: "L", pantalon: "34", calzado: "42" },
    salud: { tipoSangre: "A+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Sin observaciones" },
  },
  {
    id: "EMP-015",
    cedula: "23.117.440",
    nombres: "María Victoria",
    apellidos: "Rincón Delgado",
    cargo: "Auditoría",
    departamento: "Auditoría",
    tipoNomina: "Fijo",
    gradoAcademico: "Especialista",
    fechaIngreso: "05/02/2020",
    sueldoBase: sueldoDe("Auditoría"),
    estado: "Activo",
    fechaNacimiento: "27/06/1983",
    lugarNacimiento: "Puerto Ordaz, Bolívar",
    estadoCivil: "Soltera",
    genero: "Femenino",
    direccion: "Calle Miranda N° 9, El Manteco, Guásimos",
    telefono: "0424-300-4000",
    correo: "auditoria@guasimos.gob.ve",
    banco: "Banesco",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0134-0003-03-0003004003",
    cargaFamiliar: [],
    tallas: { camisa: "S", pantalon: "8", calzado: "37" },
    salud: { tipoSangre: "B+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Sin observaciones" },
  },
  {
    id: "EMP-016",
    cedula: "19.302.774",
    nombres: "Carlos Alberto",
    apellidos: "González Rojas",
    cargo: "Coord. Contabilidad",
    departamento: "Dirección de Administración",
    tipoNomina: "Fijo",
    gradoAcademico: "Profesional",
    fechaIngreso: "21/09/2017",
    sueldoBase: sueldoDe("Coord. Contabilidad"),
    estado: "Activo",
    fechaNacimiento: "13/08/1979",
    lugarNacimiento: "Tumeremo, Bolívar",
    estadoCivil: "Casado",
    genero: "Masculino",
    direccion: "Urbanización La Esperanza, Casa 4, Guásimos",
    telefono: "0412-400-5000",
    correo: "contabilidad@guasimos.gob.ve",
    banco: "BOD",
    tipoCuenta: "Cuenta Corriente",
    numeroCuenta: "0191-0004-04-0004005004",
    cargaFamiliar: [],
    tallas: { camisa: "M", pantalon: "32", calzado: "41" },
    salud: { tipoSangre: "O-", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Sin observaciones" },
  },
  {
    id: "EMP-017",
    cedula: "28.660.115",
    nombres: "Yolanda del Pilar",
    apellidos: "Ferreira Núñez",
    cargo: "Secretaria",
    departamento: "Despacho",
    tipoNomina: "Fijo",
    gradoAcademico: "T.S.U.",
    fechaIngreso: "07/03/2021",
    sueldoBase: sueldoDe("Secretaria"),
    estado: "Activo",
    fechaNacimiento: "04/12/1991",
    lugarNacimiento: "Guásimos, Bolívar",
    estadoCivil: "Casada",
    genero: "Femenino",
    direccion: "Calle 5 de Julio N° 7, Guásimos",
    telefono: "0414-500-6000",
    correo: "secretaria@guasimos.gob.ve",
    banco: "Banco de Venezuela",
    tipoCuenta: "Cuenta de Ahorro",
    numeroCuenta: "0102-0005-05-0005006005",
    cargaFamiliar: [
      { nombre: "Mariana Isabel Ferreira Núñez", parentesco: "Hija", cedula: "38.900.112", fechaNacimiento: "12/09/2019" },
    ],
    tallas: { camisa: "S", pantalon: "8", calzado: "37" },
    salud: { tipoSangre: "AB+", alergias: "Ninguna", enfermedades: "Ninguna", discapacidad: "No", observaciones: "Sin observaciones" },
  },
];
