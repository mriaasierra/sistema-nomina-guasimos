/**
 * Catálogos reales del backend: oficinas, cargos y tipos de nómina.
 *
 * Se usan para poblar los selectores/filtros de la UI y para resolver
 * nombres ↔ `*_id` (UUID) al enviar datos al backend.
 */

import { api } from "@/lib/api";
import { aQuery, type ValorParametro } from "./comunes";

export interface Oficina {
  id: string;
  nombre: string;
  codigo?: string | null;
  descripcion?: string | null;
  activa?: boolean | null;
}

export interface CargoCatalogo {
  id: string;
  nombre: string;
  activo?: boolean | null;
}

export interface TipoNominaCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  frecuencia?: string | null;
  descripcion?: string | null;
  activa?: boolean | null;
}

/**
 * Catálogos cargados más los resolutores de nombres a partir de los UUID.
 * Los resolutores devuelven "—" cuando el id no existe o no viene informado.
 */
export interface Catalogos {
  oficinas: Oficina[];
  cargos: CargoCatalogo[];
  tiposNomina: TipoNominaCatalogo[];
  nombreOficina: (id?: string | null) => string;
  nombreCargo: (id?: string | null) => string;
  nombreTipoNomina: (id?: string | null) => string;
}

const VACIO = "—";

function mapaNombres(
  filas: { id: string; nombre: string }[],
): Map<string, string> {
  return new Map(filas.map((fila) => [fila.id, fila.nombre]));
}

function resolver(mapa: Map<string, string>, id?: string | null): string {
  if (!id) return VACIO;
  return mapa.get(id) ?? VACIO;
}

/**
 * Carga los tres catálogos en paralelo (`limit=500` cubre el directorio
 * municipal completo). Si alguno falla, se degrada a una lista vacía en lugar
 * de romper la vista completa.
 */
export async function cargarCatalogos(): Promise<Catalogos> {
  const [oficinas, cargos, tiposNomina] = await Promise.allSettled([
    api.get<Oficina[]>(
      `/oficinas${aQuery({ limit: 500, orderBy: "nombre", orderDir: "asc" })}`,
    ),
    api.get<CargoCatalogo[]>(
      `/cargos${aQuery({ limit: 500, orderBy: "nombre", orderDir: "asc" })}`,
    ),
    api.get<TipoNominaCatalogo[]>(
      `/tipos-nomina${aQuery({ limit: 500, orderBy: "nombre", orderDir: "asc" })}`,
    ),
  ]);

  const listaOficinas =
    oficinas.status === "fulfilled" ? oficinas.value.data : [];
  const listaCargos = cargos.status === "fulfilled" ? cargos.value.data : [];
  const listaTipos =
    tiposNomina.status === "fulfilled" ? tiposNomina.value.data : [];

  const mapaOficinas = mapaNombres(listaOficinas);
  const mapaCargos = mapaNombres(listaCargos);
  const mapaTipos = mapaNombres(listaTipos);

  return {
    oficinas: listaOficinas,
    cargos: listaCargos,
    tiposNomina: listaTipos,
    nombreOficina: (id) => resolver(mapaOficinas, id),
    nombreCargo: (id) => resolver(mapaCargos, id),
    nombreTipoNomina: (id) => resolver(mapaTipos, id),
  };
}

/** Listado genérico con `meta` para entidades auxiliares. */
export async function listar<T>(
  ruta: string,
  parametros: Record<string, ValorParametro> = {},
): Promise<{ filas: T[]; total: number }> {
  const { data, meta } = await api.get<T[]>(`${ruta}${aQuery(parametros)}`);
  return {
    filas: Array.isArray(data) ? data : [],
    total: Number(meta?.total ?? 0),
  };
}
