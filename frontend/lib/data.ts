/**
 * Datos de prueba para el Sistema Web de Nómina y Liquidaciones
 * Alcaldía Bolivariana del Municipio Guásimos
 */

export type MovementType =
  | "Nómina"
  | "Vacaciones"
  | "Bono Vacacional"
  | "Liquidación"
  | "Personal";

export type Status =
  | "Procesada"
  | "Pagado"
  | "Aprobado"
  | "En curso"
  | "Pendiente"
  | "Registrado";

export interface Movement {
  id: string;
  type: MovementType;
  detail: string;
  reference: string;
  date: string;
  amount: string | null;
  status: Status;
}

export const movimientos: Movement[] = [
  {
    id: "MOV-2026-1148",
    type: "Nómina",
    detail: "Nómina quincenal – 2ª quincena de noviembre",
    reference: "248 empleados",
    date: "15/11/2026",
    amount: "Bs. 1.284.560,00",
    status: "Procesada",
  },
  {
    id: "MOV-2026-1147",
    type: "Vacaciones",
    detail: "Aprobación de planilla de vacaciones",
    reference: "12 empleados",
    date: "14/11/2026",
    amount: null,
    status: "Aprobado",
  },
  {
    id: "MOV-2026-1146",
    type: "Bono Vacacional",
    detail: "Pago de bono vacacional",
    reference: "M. Rojas · Céd. 12.486.903",
    date: "13/11/2026",
    amount: "Bs. 8.450,00",
    status: "Pagado",
  },
  {
    id: "MOV-2026-1145",
    type: "Personal",
    detail: "Nuevo ingreso al personal",
    reference: "J. Ferrer · Céd. 21.104.772",
    date: "12/11/2026",
    amount: null,
    status: "Registrado",
  },
  {
    id: "MOV-2026-1144",
    type: "Liquidación",
    detail: "Finiquito por renuncia voluntaria",
    reference: "C. López · Céd. 9.873.215",
    date: "11/11/2026",
    amount: "Bs. 32.180,00",
    status: "Pagado",
  },
  {
    id: "MOV-2026-1129",
    type: "Nómina",
    detail: "Nómina quincenal – 1ª quincena de noviembre",
    reference: "246 empleados",
    date: "31/10/2026",
    amount: "Bs. 1.271.930,00",
    status: "Procesada",
  },
];

export const resumen = {
  empleadosActivos: 248,
  empleadosDelta: "+6 este mes",
  nominaPeriodo: "Noviembre 2026 · 2ª quincena",
  nominaMonto: "Bs. 1.284.560,00",
  nominaFecha: "15 nov 2026",
  vacacionesEnCurso: 12,
  vacacionesDetalle: "3 aprobadas este mes",
  liquidacionesPendientes: 4,
  liquidacionesDetalle: "2 en revisión",
};

export const vencimientos = [
  {
    dia: "20",
    mes: "NOV",
    titulo: "Cierre de nómina",
    detalle: "2ª quincena de noviembre",
  },
  {
    dia: "25",
    mes: "NOV",
    titulo: "Declaración laboral",
    detalle: "Registro mensual de personal",
  },
  {
    dia: "30",
    mes: "NOV",
    titulo: "Plan de vacaciones",
    detalle: "Carga de solicitudes de diciembre",
  },
];

export const distribucionPersonal = [
  {
    dependencia: "Dirección de Recursos Humanos",
    cantidad: 92,
    porcentaje: 37,
    color: "bg-gold",
  },
  {
    dependencia: "Dirección de Administración",
    cantidad: 68,
    porcentaje: 27,
    color: "bg-sky-400",
  },
  {
    dependencia: "Ambulatorio de Caneyes",
    cantidad: 46,
    porcentaje: 19,
    color: "bg-emerald-400",
  },
  {
    dependencia: "Dirección de Desarrollo Urbano",
    cantidad: 42,
    porcentaje: 17,
    color: "bg-violet-400",
  },
];

export {
  cargosOficiales,
  nombresCargos,
  gradosAcademicos,
  cargoOficial,
  PORCENTAJES_PROFESIONALIZACION,
} from "./cargos";
export type { CargoOficial, GradoAcademico, NombreCargo } from "./cargos";

export {
  empleados,
  dependencias,
  departamentos,
  tiposNomina,
  formatoMoneda,
  nombreCompleto,
} from "./empleados";
export type {
  Empleado,
  Dependencia,
  Departamento,
  TipoNomina,
  EstadoEmpleado,
  Familiar,
} from "./empleados";

export {
  nominasHistorial,
  calcularNomina,
  periodoLabel,
  fechaCorte,
  meses,
  anios,
  PORCENTAJES_DEDUCCION,
  PORCENTAJE_ANTIGUEDAD_MAXIMO,
  PORCENTAJE_ANTIGUEDAD_POR_ANIO,
  PRIMA_POR_HIJO,
} from "./nomina";
export type {
  RegistroNomina,
  Quincena,
  EstadoNomina,
  CalculoNomina,
  ConceptoNomina,
} from "./nomina";

export {
  vacacionesIniciales,
  diasHabilesEntre,
  sueldoDiario,
  bonoVacacional,
  formatoFecha,
} from "./vacaciones";
export type {
  VacacionRegistro,
  EstadoVacacion,
  ModalidadVacacion,
} from "./vacaciones";

export interface Liquidacion {
  empleado: string;
  cargo: string;
  motivo: string;
  fecha: string;
  monto: string;
  estado: "Pagado" | "Pendiente" | "En curso";
}

export const liquidaciones: Liquidacion[] = [
  {
    empleado: "Carmen Josefina López",
    cargo: "Asistente Administrativo",
    motivo: "Renuncia voluntaria",
    fecha: "11/11/2026",
    monto: "Bs. 32.180,00",
    estado: "Pagado",
  },
  {
    empleado: "Rafael Ángel Soto",
    cargo: "Obrero",
    motivo: "Retiro por jubilación",
    fecha: "08/11/2026",
    monto: "Bs. 48.920,00",
    estado: "Pagado",
  },
  {
    empleado: "Nélida Coromoto Gil",
    cargo: "Obrero",
    motivo: "Terminación de contrato",
    fecha: "16/11/2026",
    monto: "Bs. 21.450,00",
    estado: "En curso",
  },
  {
    empleado: "Oscar Daniel Medina",
    cargo: "Seguridad",
    motivo: "Despido justificado",
    fecha: "—",
    monto: "Por calcular",
    estado: "Pendiente",
  },
];

export {
  calcularLiquidacion,
  liquidacionesHistorial,
  motivosRetiro,
  estadosLiquidacion,
  formatoFechaISO,
  isoDesdeTexto,
  diferenciaFechas,
} from "./liquidaciones";
export type {
  MotivoRetiro,
  EstadoLiquidacion,
  CalculoLiquidacion,
  LiquidacionRegistro,
  ConceptoLiquidacion,
} from "./liquidaciones";
