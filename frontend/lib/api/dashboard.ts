/**
 * Adaptador del dashboard: agrega en una sola llamada los datos reales del
 * backend (empleados, periodos de nómina, vacaciones, bonos y liquidaciones)
 * y los traduce a los modelos que usa la vista de inicio.
 */

import type { Empleado } from "@/lib/empleados";
import { formatoMoneda, nombreCompleto } from "@/lib/empleados";
import type { Movement, Status } from "@/lib/data";
import { cargarCatalogos, type Catalogos } from "./catalogos";
import { listarEmpleados } from "./empleados";
import { api } from "@/lib/api";
import { aQuery, fechaLegible, numeroBackend } from "./comunes";
import type { PeriodoRow } from "./nomina";
import type { BonoVacacionalRow, VacacionRow } from "./vacaciones";
import type { LiquidacionRow } from "./liquidaciones";

export interface DistribucionPersonal {
  dependencia: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

export interface ResumenEjecutivo {
  empleadosActivos: number;
  empleadosDelta: string;
  nominaPeriodo: string;
  nominaMonto: string;
  vacacionesEnCurso: number;
  vacacionesDetalle: string;
  liquidacionesPendientes: number;
  liquidacionesDetalle: string;
}

export interface DatosDashboard {
  resumen: ResumenEjecutivo;
  movimientos: Movement[];
  distribucion: DistribucionPersonal[];
  catalogos: Catalogos;
  empleados: Empleado[];
}

const COLORES = [
  "bg-gold",
  "bg-sky-400",
  "bg-emerald-400",
  "bg-violet-400",
  "bg-rose-400",
  "bg-amber-400",
];

/** Ordena movimientos por fecha (dd/mm/aaaa) de más reciente a más antiguo. */
function porFechaDescendente(a: Movement, b: Movement): number {
  const aISO = a.date.split("/").reverse().join("");
  const bISO = b.date.split("/").reverse().join("");
  return bISO.localeCompare(aISO);
}

function fechaDeRegistro(valor?: string | null): string {
  return fechaLegible(valor) || "—";
}

/** Carga todos los datos reales del panel de control. */
export async function cargarDashboard(): Promise<DatosDashboard> {
  const catalogos = await cargarCatalogos();

  const [empleados, periodos, vacaciones, bonos, liquidaciones] =
    await Promise.all([
      listarEmpleados({ limit: 500 }, catalogos),
      api.get<PeriodoRow[]>(`/nominas-periodos${aQuery({ limit: 5 })}`),
      api.get<VacacionRow[]>(`/vacaciones${aQuery({ limit: 500 })}`),
      api.get<BonoVacacionalRow[]>(`/bonos-vacacionales${aQuery({ limit: 5 })}`),
      api.get<LiquidacionRow[]>(`/liquidaciones${aQuery({ limit: 500 })}`),
    ]);

  const listaEmpleados = empleados.empleados;
  const porId = new Map(listaEmpleados.map((emp) => [emp.id, emp]));

  const activos = listaEmpleados.filter((emp) => emp.estado === "Activo");

  // Empleados registrados este mes, para el delta de la tarjeta principal.
  const hoy = new Date();
  const prefijoMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const nuevosEsteMes = listaEmpleados.filter((empleado) =>
    empleado.creadoEn?.startsWith(prefijoMes),
  ).length;

  // Última nómina procesada (la más reciente por fecha de corte).
  const listaPeriodos = Array.isArray(periodos.data) ? periodos.data : [];
  const ultimaNomina = listaPeriodos[0];

  const listaVacaciones = Array.isArray(vacaciones.data) ? vacaciones.data : [];
  const enDisfrute = listaVacaciones.filter(
    (fila) =>
      String(fila.estatus ?? "").toLowerCase().includes("disfrut") &&
      !String(fila.estatus ?? "").toLowerCase().includes("disfrutado"),
  ).length;

  const listaLiquidaciones = Array.isArray(liquidaciones.data)
    ? liquidaciones.data
    : [];
  const pendientes = listaLiquidaciones.filter((fila) => {
    const estatus = String(fila.estatus ?? "").toLowerCase();
    return estatus.includes("pend") || estatus.includes("revis");
  });
  const enRevision = listaLiquidaciones.filter((fila) =>
    String(fila.estatus ?? "").toLowerCase().includes("revis"),
  ).length;

  // Movimientos recientes combinando las fuentes reales.
  const movimientos: Movement[] = [];

  for (const fila of listaPeriodos) {
    const mes = Number(fila.mes) || hoy.getMonth() + 1;
    const nombreMes = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ][mes - 1] ?? "";
    movimientos.push({
      id: fila.id.slice(0, 8).toUpperCase(),
      type: "Nómina",
      detail: `Nómina ${String(fila.tipo ?? "quincenal").toLowerCase()} · ${nombreMes}`,
      reference: `${Number(fila.cantidad_empleados ?? 0)} empleados`,
      date: fechaDeRegistro(fila.fecha_corte ?? fila.created_at),
      amount: formatoMoneda(numeroBackend(fila.total_neto)),
      status: "Procesada" as Status,
    });
  }

  for (const fila of Array.isArray(bonos.data) ? bonos.data : []) {
    const empleado = porId.get(fila.empleado_id);
    movimientos.push({
      id: fila.id.slice(0, 8).toUpperCase(),
      type: "Bono Vacacional",
      detail: "Bono vacacional (15 días × sueldo diario)",
      reference: empleado ? `${nombreCompleto(empleado)} · Céd. ${empleado.cedula}` : fila.empleado_id.slice(0, 8),
      date: fechaDeRegistro(fila.fecha_pago ?? fila.created_at),
      amount: formatoMoneda(numeroBackend(fila.monto_bono)),
      status: (fila.pagado ? "Pagado" : "Pendiente") as Status,
    });
  }

  for (const fila of listaVacaciones.slice(0, 4)) {
    const empleado = porId.get(fila.empleado_id);
    movimientos.push({
      id: fila.id.slice(0, 8).toUpperCase(),
      type: "Vacaciones",
      detail: "Periodo de vacaciones registrado",
      reference: empleado ? `${nombreCompleto(empleado)} · Céd. ${empleado.cedula}` : fila.empleado_id.slice(0, 8),
      date: fechaDeRegistro(fila.fecha_inicio ?? fila.created_at),
      amount: null,
      status: "Registrado" as Status,
    });
  }

  for (const fila of listaLiquidaciones.slice(0, 3)) {
    const empleado = porId.get(fila.empleado_id);
    movimientos.push({
      id: fila.id.slice(0, 8).toUpperCase(),
      type: "Liquidación",
      detail: `Finiquito por ${String(fila.motivo ?? "retiro").toLowerCase()}`,
      reference: empleado ? `${nombreCompleto(empleado)} · Céd. ${empleado.cedula}` : fila.empleado_id.slice(0, 8),
      date: fechaDeRegistro(fila.fecha_retiro ?? fila.created_at),
      amount: formatoMoneda(numeroBackend(fila.monto_neto_liquidacion)),
      status: "Pagado" as Status,
    });
  }

  for (const empleado of activos.slice(0, 2)) {
    movimientos.push({
      id: empleado.id.slice(0, 8).toUpperCase(),
      type: "Personal",
      detail: "Ingreso registrado en el directorio",
      reference: `${nombreCompleto(empleado)} · Céd. ${empleado.cedula}`,
      date: empleado.fechaIngreso || "—",
      amount: null,
      status: "Registrado" as Status,
    });
  }

  movimientos.sort(porFechaDescendente);

  // Distribución del personal activo por oficina (catálogo real).
  const conteo = new Map<string, number>();
  for (const empleado of activos) {
    const nombre = empleado.departamento || "Sin oficina";
    conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
  }
  const totalActivos = activos.length || 1;
  const distribucion: DistribucionPersonal[] = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([dependencia, cantidad], indice) => ({
      dependencia,
      cantidad,
      porcentaje: Math.round((cantidad / totalActivos) * 100),
      color: COLORES[indice % COLORES.length],
    }));

  return {
    resumen: {
      empleadosActivos: activos.length,
      empleadosDelta: `+${nuevosEsteMes} este mes`,
      nominaPeriodo: ultimaNomina
        ? `${mesNombre(Number(ultimaNomina.mes))} ${Number(ultimaNomina.anio) || ""} · ${Number(ultimaNomina.quincena) || 1}ª quincena`.trim()
        : "Sin registros",
      nominaMonto: ultimaNomina
        ? formatoMoneda(numeroBackend(ultimaNomina.total_neto))
        : "—",
      vacacionesEnCurso: enDisfrute,
      vacacionesDetalle: `${listaVacaciones.length} registros en total`,
      liquidacionesPendientes: pendientes.length,
      liquidacionesDetalle: `${enRevision} en revisión`,
    },
    movimientos: movimientos.slice(0, 8),
    distribucion,
    catalogos,
    empleados: listaEmpleados,
  };
}

function mesNombre(numero: number): string {
  return (
    [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ][numero - 1] ?? ""
  );
}
