/**
 * Adaptador de empleados: traduce entre las filas del backend
 * (`snake_case`, UUIDs, `*_id`) y el modelo `Empleado` de la UI.
 *
 * Los UUIDs reales se conservan en el modelo (`id`, `oficinaId`, `cargoId`,
 * `tipoNominaId`) para que GET / POST / PUT / PATCH / DELETE operen siempre
 * contra identificadores del backend.
 */

import { api, type ApiMeta } from "@/lib/api";
import {
  calcularEdad,
  esHijo,
  type Empleado,
  type Familiar,
} from "@/lib/empleados";
import type { Catalogos } from "./catalogos";
import { aQuery, fechaISO, fechaLegible, numeroBackend } from "./comunes";

/** Fila de `empleados` tal como la devuelve el backend. */
export interface EmpleadoRow {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  estatus?: string | null;
  fecha_ingreso?: string | null;
  sueldo_base?: string | number | null;
  foto_url?: string | null;
  fecha_nacimiento?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  banco?: string | null;
  numero_cuenta?: string | null;
  formacion_academica?: string | null;
  hijos_menores?: number | string | null;
  hijos_detalle?: unknown;
  tiene_hijos?: boolean | null;
  emergencia_nombre?: string | null;
  emergencia_telefono?: string | null;
  emergencia_parentesco?: string | null;
  tiene_enfermedad?: boolean | null;
  enfermedad_detalle?: string | null;
  talla_pantalon?: string | null;
  talla_camisa?: string | null;
  talla_zapatos?: string | null;
  enfermedad_notas?: string | null;
  genero?: string | null;
  antiguedad_otras_instituciones?: number | null;
  municipio?: string | null;
  parroquia?: string | null;
  sector?: string | null;
  punto_referencia?: string | null;
  zona?: string | null;
  estado?: string | null;
  tipo_vinculacion?: string | null;
  aplica_nomina_regular?: boolean | null;
  nivel_tabulador?: string | null;
  oficina_id?: string | null;
  cargo_id?: string | null;
  tipo_nomina_id?: string | null;
  created_at?: string | null;
}

/** Filtros de empleados soportados por el backend. */
export interface FiltrosEmpleados {
  q?: string;
  oficina_id?: string;
  cargo_id?: string;
  tipo_nomina_id?: string;
  estatus?: string;
  tipo_vinculacion?: string;
  tiene_hijos?: boolean;
  genero?: string;
  nivel_tabulador?: string;
  estado?: string;
  municipio?: string;
  parroquia?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: string;
}

/** "activo", "Activo", "ACTIVO" → "Activo"; variante de retiro → "Retirado". */
function mapearEstatus(estatus?: string | null): "Activo" | "Retirado" {
  const valor = String(estatus ?? "").trim().toLowerCase();
  if (
    valor.startsWith("retir") ||
    valor === "inactivo" ||
    valor === "egresado"
  ) {
    return "Retirado";
  }
  return "Activo";
}

/** Tolerante al formato de `hijos_detalle` (JSON del backend o semillas). */
function hijosDetalleAFamiliares(detalle: unknown): Familiar[] {
  if (!Array.isArray(detalle)) return [];

  return detalle
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    )
    .map((item) => {
      const crudo = (clave: string): string => {
        const valor = item[clave];
        return typeof valor === "string" ? valor : "";
      };
      const fecha = crudo("fecha_nacimiento") || crudo("fechaNacimiento");
      return {
        nombre: crudo("nombre") || "Sin nombre",
        parentesco: crudo("parentesco") || "Otro",
        cedula: crudo("cedula"),
        fechaNacimiento: fechaLegible(fecha) || "No registrada",
      };
    });
}

/** Familiar de la UI → registro de `hijos_detalle` para el backend. */
function familiaresAHijosDetalle(familiares: Familiar[]): unknown[] {
  return familiares
    .filter((familiar) => familiar.nombre.trim() !== "")
    .map((familiar) => ({
      nombre: familiar.nombre.trim(),
      parentesco: familiar.parentesco,
      cedula: familiar.cedula,
      fecha_nacimiento: fechaISO(familiar.fechaNacimiento),
    }));
}

/** Traduce una fila del backend al modelo `Empleado` de la UI. */
export function mapearEmpleado(
  fila: EmpleadoRow,
  catalogos: Catalogos,
): Empleado {
  const cargaFamiliar = hijosDetalleAFamiliares(fila.hijos_detalle);
  const enfermedad = String(fila.enfermedad_detalle ?? "").trim();

  return {
    id: fila.id,
    cedula: fila.cedula ?? "",
    nombres: fila.nombres ?? "",
    apellidos: fila.apellidos ?? "",
    cargo: catalogos.nombreCargo(fila.cargo_id),
    departamento: catalogos.nombreOficina(fila.oficina_id),
    tipoNomina: catalogos.nombreTipoNomina(fila.tipo_nomina_id),
    tipoVinculacion: fila.tipo_vinculacion ?? "",
    gradoAcademico: fila.formacion_academica ?? "No registra",
    fechaIngreso: fechaLegible(fila.fecha_ingreso),
    sueldoBase: numeroBackend(fila.sueldo_base),
    estado: mapearEstatus(fila.estatus),
    fechaNacimiento: fechaLegible(fila.fecha_nacimiento),
    genero: fila.genero ?? "",
    direccion: fila.direccion ?? "",
    telefono: fila.telefono ?? "",
    correo: fila.correo ?? "",
    banco: fila.banco ?? "",
    numeroCuenta: fila.numero_cuenta ?? "",
    cargaFamiliar,
    tallas: {
      camisa: fila.talla_camisa || "—",
      pantalon: fila.talla_pantalon || "—",
      calzado: fila.talla_zapatos || "—",
    },
    salud: {
      enfermedades: enfermedad || "Ninguna",
      observaciones: fila.enfermedad_notas ?? "Sin observaciones",
      tieneEnfermedad: Boolean(fila.tiene_enfermedad) && enfermedad !== "",
      detalle: enfermedad,
      notas: fila.enfermedad_notas ?? "",
    },
    // Identificadores reales (UUID) para operar contra el backend.
    oficinaId: fila.oficina_id ?? null,
    cargoId: fila.cargo_id ?? null,
    tipoNominaId: fila.tipo_nomina_id ?? null,
    creadoEn: fila.created_at ?? null,
    tieneHijos:
      typeof fila.tiene_hijos === "boolean"
        ? fila.tiene_hijos
        : cargaFamiliar.some(esHijo),
    hijosMenores: Number(fila.hijos_menores ?? 0) || 0,
  };
}

/**
 * Construye el payload `snake_case` para `POST /empleados` y
 * `PUT/PATCH /empleados/:id`. Solo incluye campos con valor.
 */
export function empleadoAPayload(empleado: Empleado): Record<string, unknown> {
  const hijos = empleado.cargaFamiliar.filter(esHijo);
  const hoy = new Date();
  const menores = hijos.filter(
    (hijo) => (calcularEdad(hijo.fechaNacimiento, hoy) ?? 99) < 18,
  ).length;

  const payload: Record<string, unknown> = {
    cedula: empleado.cedula.trim(),
    nombres: empleado.nombres.trim(),
    apellidos: empleado.apellidos.trim(),
    estatus: empleado.estado === "Retirado" ? "Retirado" : "Activo",
    tipo_vinculacion: empleado.tipoVinculacion || "Fijo",
    sueldo_base: Number(empleado.sueldoBase) || 0,
    genero: empleado.genero || "Masculino",
    formacion_academica: empleado.gradoAcademico || "No registra",
    banco: empleado.banco || null,
    numero_cuenta: empleado.numeroCuenta || null,
    direccion: empleado.direccion || null,
    telefono: empleado.telefono || null,
    correo: empleado.correo || null,
    hijos_detalle: familiaresAHijosDetalle(empleado.cargaFamiliar),
    hijos_menores: menores,
    tiene_hijos: hijos.length > 0,
    talla_camisa: empleado.tallas.camisa === "—" ? null : empleado.tallas.camisa,
    talla_pantalon:
      empleado.tallas.pantalon === "—" ? null : empleado.tallas.pantalon,
    talla_zapatos:
      empleado.tallas.calzado === "—" ? null : empleado.tallas.calzado,
    tiene_enfermedad: Boolean(empleado.salud.detalle),
    enfermedad_detalle: empleado.salud.detalle || null,
    enfermedad_notas: empleado.salud.notas || null,
    oficina_id: empleado.oficinaId || null,
    cargo_id: empleado.cargoId || null,
    tipo_nomina_id: empleado.tipoNominaId || null,
  };

  const ingreso = fechaISO(empleado.fechaIngreso);
  if (ingreso) payload.fecha_ingreso = ingreso;

  const nacimiento = fechaISO(empleado.fechaNacimiento);
  if (nacimiento) payload.fecha_nacimiento = nacimiento;

  for (const clave of Object.keys(payload)) {
    if (payload[clave] === null) delete payload[clave];
  }

  return payload;
}

/**
 * Lista empleados aplicando los filtros que soporta el backend vía
 * `URLSearchParams`. `meta.total` refleja el total del servidor.
 */
export async function listarEmpleados(
  filtros: FiltrosEmpleados,
  catalogos: Catalogos,
): Promise<{ empleados: Empleado[]; meta: ApiMeta }> {
  const { data, meta } = await api.get<EmpleadoRow[]>(
    `/empleados${aQuery(filtros)}`,
  );

  const filas = Array.isArray(data) ? data : [];
  return {
    empleados: filas.map((fila) => mapearEmpleado(fila, catalogos)),
    meta: meta ?? { total: filas.length },
  };
}

/** Empleados activos (filtro `estatus=activo`, comparación ILIKE). */
export async function listarEmpleadosActivos(
  catalogos: Catalogos,
  limit = 500,
): Promise<Empleado[]> {
  const { empleados } = await listarEmpleados(
    { estatus: "activo", limit, orderBy: "apellidos", orderDir: "asc" },
    catalogos,
  );
  return empleados;
}

export async function crearEmpleado(
  empleado: Empleado,
): Promise<EmpleadoRow> {
  const { data } = await api.post<EmpleadoRow>(
    "/empleados",
    empleadoAPayload(empleado),
  );
  return data;
}

export async function actualizarEmpleado(
  id: string,
  empleado: Empleado,
): Promise<EmpleadoRow> {
  const { data } = await api.put<EmpleadoRow>(
    `/empleados/${id}`,
    empleadoAPayload(empleado),
  );
  return data;
}

/** Baja lógica: `estatus` pasa a "Retirado" (no se borra el registro). */
export async function retirarEmpleado(id: string): Promise<EmpleadoRow> {
  const { data } = await api.patch<EmpleadoRow>(`/empleados/${id}`, {
    estatus: "Retirado",
  });
  return data;
}
