"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserRoundMinus,
  UsersRound,
  X,
} from "lucide-react";
import EmployeeDetail from "@/components/EmployeeDetail";
import EmployeeWizard from "@/components/EmployeeWizard";
import MiniStat from "@/components/MiniStat";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { ApiError } from "@/lib/api";
import {
  cargarCatalogos,
  type Catalogos,
} from "@/lib/api/catalogos";
import {
  actualizarEmpleado,
  crearEmpleado,
  listarEmpleados,
  retirarEmpleado,
} from "@/lib/api/empleados";
import {
  FECHA_CORTE,
  calcularEdad,
  edadesHijos,
  formatoMoneda,
  hijosDelEmpleado,
  normalizarTexto,
  nombreCompleto,
  ordenarTallasCamisa,
  ordenarTallasNumericas,
  type Empleado,
} from "@/lib/empleados";

const entero = (valor: string): number | null => {
  if (valor.trim() === "") return null;
  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
};

/** Estilo del tipo de nómina, tolerante a los nombres reales del catálogo. */
function claseTipoNomina(tipo: string): string {
  const valor = normalizarTexto(tipo);
  if (valor.includes("obrer")) {
    return "border-violet-500/25 bg-violet-500/10 text-violet-300";
  }
  if (valor.includes("contrat")) {
    return "border-sky-500/25 bg-sky-500/10 text-sky-300";
  }
  if (valor.includes("fijo")) {
    return "border-gold/25 bg-gold/10 text-gold-light";
  }
  return "border-line bg-surface/60 text-muted";
}

const selectCls =
  "w-full appearance-none rounded-lg border border-line bg-surface/70 py-2.5 pl-3 pr-9 text-base text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/10";

const inputCls =
  "w-full rounded-lg border border-line bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-subtle focus:border-gold/50 focus:ring-2 focus:ring-gold/10";

function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

/** Envoltorio para los select con flecha y etiqueta. */
function SelectControl({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  options: readonly { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div>
      <p className="section-label mb-2">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectCls}
          aria-label={ariaLabel}
        >
          {options.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}

export default function PersonalPage() {
  const [lista, setLista] = useState<Empleado[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [totalServidor, setTotalServidor] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  // Filtros que viajan al backend (`oficina_id`, `tipo_nomina_id`).
  const [oficinaFiltro, setOficinaFiltro] = useState("Todos");
  const [tipoNominaFiltro, setTipoNominaFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  // Filtros locales sin equivalente directo en el backend.
  const [avanzadosAbiertos, setAvanzadosAbiertos] = useState(false);
  const [edadMin, setEdadMin] = useState("");
  const [edadMax, setEdadMax] = useState("");
  const [tieneHijos, setTieneHijos] = useState<"Todos" | "Si" | "No">("Todos");
  const [edadHijo, setEdadHijo] = useState("");
  const [camisaFiltro, setCamisaFiltro] = useState("Todas");
  const [pantalonFiltro, setPantalonFiltro] = useState("Todos");
  const [calzadoFiltro, setCalzadoFiltro] = useState("Todos");
  const [fechaActual, setFechaActual] = useState<Date | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Empleado | null>(null);
  const [editando, setEditando] = useState<Empleado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState("");
  const [aviso, setAviso] = useState<{
    mensaje: string;
    tono: "exito" | "baja";
  } | null>(null);

  // El primer render usa FECHA_CORTE en servidor y cliente; después se usa la fecha real.
  useEffect(() => setFechaActual(new Date()), []);
  const fechaRef = fechaActual ?? FECHA_CORTE;

  /**
   * Carga el directorio desde `/api/empleados`.
   *
   * Los filtros de oficina y tipo de nómina viajan al servidor como
   * `oficina_id` / `tipo_nomina_id` (UUID de los catálogos reales). La
   * búsqueda libre, la edad, los hijos y las tallas se aplican localmente
   * porque cubren campos que el parámetro `q` del backend no indexa.
   */
  const cargar = useCallback(
    async (cat: Catalogos) => {
      setCargando(true);
      setErrorCarga("");
      try {
        const { empleados, meta } = await listarEmpleados(
          {
            oficina_id: oficinaFiltro === "Todos" ? undefined : oficinaFiltro,
            tipo_nomina_id:
              tipoNominaFiltro === "Todos" ? undefined : tipoNominaFiltro,
            limit: 500,
            orderBy: "apellidos",
            orderDir: "asc",
          },
          cat,
        );
        setLista(empleados);
        setTotalServidor(Number(meta?.total ?? empleados.length));
      } catch (error) {
        setErrorCarga(mensajeDeError(error));
        setLista([]);
        setTotalServidor(0);
      } finally {
        setCargando(false);
      }
    },
    [oficinaFiltro, tipoNominaFiltro],
  );

  // Primera carga: obtiene catálogos y luego el directorio.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCargando(true);
      try {
        const cat = await cargarCatalogos();
        if (cancelado) return;
        setCatalogos(cat);
        await cargar(cat);
      } catch (error) {
        if (!cancelado) {
          setErrorCarga(mensajeDeError(error));
          setCargando(false);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarga cuando cambian los filtros que viajan al servidor.
  useEffect(() => {
    if (!catalogos) return;
    void cargar(catalogos);
  }, [catalogos, cargar]);

  const opcionesCamisa = useMemo(
    () => ["Todas", ...ordenarTallasCamisa(lista.map((e) => e.tallas.camisa))],
    [lista],
  );
  const opcionesPantalon = useMemo(
    () => ["Todos", ...ordenarTallasNumericas(lista.map((e) => e.tallas.pantalon))],
    [lista],
  );
  const opcionesCalzado = useMemo(
    () => ["Todos", ...ordenarTallasNumericas(lista.map((e) => e.tallas.calzado))],
    [lista],
  );

  const filtrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    const minEdad = entero(edadMin);
    const maxEdad = entero(edadMax);
    const edadHijoNum = entero(edadHijo);

    return lista.filter((emp) => {
      // Búsqueda local: incluye los campos que el `q` del backend no indexa
      // (cargo, oficina, tallas, nombres de familiares).
      const coincideTexto =
        !termino ||
        [
          emp.cedula,
          emp.nombres,
          emp.apellidos,
          nombreCompleto(emp),
          emp.correo,
          emp.telefono,
          emp.cargo,
          emp.departamento,
          emp.tipoNomina,
          ...emp.cargaFamiliar.map((familiar) => familiar.nombre),
          emp.tallas.camisa,
          emp.tallas.pantalon,
          emp.tallas.calzado,
        ].some((campo) => normalizarTexto(campo).includes(termino));
      if (!coincideTexto) return false;

      const edad = calcularEdad(emp.fechaNacimiento, fechaRef);
      if (minEdad !== null && (edad === null || edad < minEdad)) return false;
      if (maxEdad !== null && (edad === null || edad > maxEdad)) return false;

      const hijos = hijosDelEmpleado(emp);
      if (tieneHijos === "Si" && hijos.length === 0) return false;
      if (tieneHijos === "No" && hijos.length > 0) return false;
      if (
        edadHijoNum !== null &&
        !edadesHijos(emp, fechaRef).includes(edadHijoNum)
      ) {
        return false;
      }

      if (
        camisaFiltro !== "Todas" &&
        normalizarTexto(emp.tallas.camisa) !== normalizarTexto(camisaFiltro)
      ) {
        return false;
      }
      if (
        pantalonFiltro !== "Todos" &&
        emp.tallas.pantalon !== pantalonFiltro
      ) {
        return false;
      }
      if (calzadoFiltro !== "Todos" && emp.tallas.calzado !== calzadoFiltro) {
        return false;
      }
      return true;
    });
  }, [
    lista,
    busqueda,
    edadMin,
    edadMax,
    tieneHijos,
    edadHijo,
    camisaFiltro,
    pantalonFiltro,
    calzadoFiltro,
    fechaRef,
  ]);

  const activos = lista.filter((e) => e.estado === "Activo").length;
  const retirados = lista.filter((e) => e.estado === "Retirado").length;
  const noFijos = lista.filter(
    (e) => normalizarTexto(e.tipoVinculacion ?? e.tipoNomina).includes("contrat") ||
      normalizarTexto(e.tipoVinculacion ?? e.tipoNomina).includes("obrer"),
  ).length;
  const filtrosAvanzadosActivos = [
    edadMin,
    edadMax,
    tieneHijos !== "Todos",
    edadHijo,
    camisaFiltro !== "Todas",
    pantalonFiltro !== "Todos",
    calzadoFiltro !== "Todos",
  ].filter(Boolean).length;
  const hayFiltros =
    busqueda !== "" ||
    oficinaFiltro !== "Todos" ||
    tipoNominaFiltro !== "Todos" ||
    filtrosAvanzadosActivos > 0;

  const limpiarFiltros = () => {
    setBusqueda("");
    setOficinaFiltro("Todos");
    setTipoNominaFiltro("Todos");
    setEdadMin("");
    setEdadMax("");
    setTieneHijos("Todos");
    setEdadHijo("");
    setCamisaFiltro("Todas");
    setPantalonFiltro("Todos");
    setCalzadoFiltro("Todos");
  };

  /** Crea (`POST /empleados`) o actualiza (`PUT /empleados/:id`) vía API. */
  const guardarEmpleado = async (empleado: Empleado) => {
    if (!catalogos) return;
    const esEdicion = editando !== null;
    setGuardando(true);
    setErrorGuardado("");
    try {
      if (esEdicion) {
        await actualizarEmpleado(empleado.id, empleado);
      } else {
        await crearEmpleado(empleado);
      }
      await cargar(catalogos);
      setSeleccionado((prev) => (prev?.id === empleado.id ? empleado : prev));
      setEditando(null);
      setWizardOpen(false);
      setAviso({
        mensaje: esEdicion
          ? `${nombreCompleto(empleado)} fue actualizado correctamente.`
          : `${nombreCompleto(empleado)} fue registrado correctamente en el directorio.`,
        tono: "exito",
      });
    } catch (error) {
      setErrorGuardado(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  /** Baja lógica vía `PATCH /empleados/:id` con `estatus: "Retirado"`. */
  const desactivarEmpleado = async (empleado: Empleado) => {
    if (!catalogos) return;
    try {
      await retirarEmpleado(empleado.id);
      await cargar(catalogos);
      setSeleccionado((prev) =>
        prev?.id === empleado.id ? { ...prev, estado: "Retirado" as const } : prev,
      );
      setAviso({
        mensaje: `${nombreCompleto(empleado)} fue dado de baja y ya no figura como empleado activo.`,
        tono: "baja",
      });
    } catch (error) {
      setAviso({ mensaje: mensajeDeError(error), tono: "baja" });
    }
  };

  const abrirEdicion = (empleado: Empleado) => {
    setSeleccionado(null);
    setEditando(empleado);
  };

  const opcionesOficina = [
    { value: "Todos", label: "Todas las dependencias" },
    ...catalogos?.oficinas.map((oficina) => ({
      value: oficina.id,
      label: oficina.nombre,
    })) ?? [],
  ];
  const opcionesTipoNomina = [
    { value: "Todos", label: "Todos los tipos de nómina" },
    ...catalogos?.tiposNomina.map((tipo) => ({
      value: tipo.id,
      label: tipo.nombre,
    })) ?? [],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Gestión de talento humano"
        title="Personal"
        description="Directorio de empleados de la Alcaldía Bolivariana del Municipio Guásimos. Busque, filtre y consulte la ficha completa de cada funcionario."
        icon={UsersRound}
        action={
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light"
          >
            <Plus className="h-4 w-4" /> Nuevo Empleado
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Total registros"
          value={cargando ? "…" : String(totalServidor)}
          hint="Directorio municipal"
          icon={UsersRound}
        />
        <MiniStat label="Empleados activos" value={String(activos)} hint="En ejercicio del cargo" icon={UserCheck} />
        <MiniStat label="Contratados y obreros" value={String(noFijos)} hint="Nómina no fija" icon={UserRoundMinus} />
        <MiniStat label="Retirados" value={String(retirados)} hint="Egresos registrados" icon={X} />
      </div>

      {aviso && (
        <div
          className={`mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 ${
            aviso.tono === "baja"
              ? "border-rose-500/40 bg-rose-500/[0.08]"
              : "border-gold/40 bg-gold/[0.08]"
          }`}
        >
          {aviso.tono === "baja" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-light" />
          )}
          <p
            className={`flex-1 text-sm ${
              aviso.tono === "baja"
                ? "text-rose-700 dark:text-rose-200"
                : "text-gold-light"
            }`}
          >
            {aviso.mensaje}
          </p>
          <button
            type="button"
            onClick={() => setAviso(null)}
            aria-label="Cerrar aviso"
            className="rounded-md p-1 text-muted transition hover:bg-card hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Buscador y filtros */}
      <section className="card mt-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cédula, nombre, cargo, hijo o talla…"
              className="w-full rounded-lg border border-line bg-surface/70 py-2.5 pl-10 pr-10 text-base text-ink outline-none transition placeholder:text-subtle focus:border-gold/50 focus:ring-2 focus:ring-gold/10"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 xl:flex xl:items-center">
            <div className="relative">
              <select
                value={oficinaFiltro}
                onChange={(e) => setOficinaFiltro(e.target.value)}
                className={selectCls}
                aria-label="Filtrar por dependencia"
              >
                {opcionesOficina.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>

            <div className="relative">
              <select
                value={tipoNominaFiltro}
                onChange={(e) => setTipoNominaFiltro(e.target.value)}
                className={selectCls}
                aria-label="Filtrar por tipo de nómina"
              >
                {opcionesTipoNomina.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>

            <button
              type="button"
              onClick={() => setAvanzadosAbiertos((abierto) => !abierto)}
              aria-expanded={avanzadosAbiertos}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-muted transition hover:border-gold/40 hover:text-gold xl:col-span-1"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros avanzados
              {filtrosAvanzadosActivos > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold/15 px-1.5 text-xs font-semibold text-gold-light">
                  {filtrosAvanzadosActivos}
                </span>
              )}
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${avanzadosAbiertos ? "rotate-180" : ""}`}
              />
            </button>

            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-muted transition hover:border-gold/40 hover:text-gold xl:col-span-1"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Limpiar
              </button>
            )}
          </div>
        </div>

        {avanzadosAbiertos && (
          <div className="mt-4 border-t border-line/80 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="section-label mb-2">Edad del empleado</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={16}
                    max={100}
                    value={edadMin}
                    onChange={(e) => setEdadMin(e.target.value)}
                    placeholder="Mín."
                    aria-label="Edad mínima del empleado"
                    className={inputCls}
                  />
                  <span className="text-sm text-subtle">—</span>
                  <input
                    type="number"
                    min={16}
                    max={100}
                    value={edadMax}
                    onChange={(e) => setEdadMax(e.target.value)}
                    placeholder="Máx."
                    aria-label="Edad máxima del empleado"
                    className={inputCls}
                  />
                </div>
              </div>

              <SelectControl
                label="¿Tiene hijos?"
                value={tieneHijos}
                onChange={(valor) => setTieneHijos(valor as "Todos" | "Si" | "No")}
                options={[
                  { value: "Todos", label: "Todos" },
                  { value: "Si", label: "Sí" },
                  { value: "No", label: "No" },
                ]}
                ariaLabel="Filtrar por tenencia de hijos"
              />

              <div>
                <p className="section-label mb-2">Edad de los hijos</p>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={edadHijo}
                  onChange={(e) => setEdadHijo(e.target.value)}
                  placeholder="Ej. 10"
                  aria-label="Edad de los hijos"
                  className={inputCls}
                />
              </div>

              <SelectControl
                label="Talla de camisa"
                value={camisaFiltro}
                onChange={setCamisaFiltro}
                options={opcionesCamisa.map((opcion) => ({ value: opcion, label: opcion }))}
                ariaLabel="Filtrar por talla de camisa"
              />
              <SelectControl
                label="Talla de pantalón"
                value={pantalonFiltro}
                onChange={setPantalonFiltro}
                options={opcionesPantalon.map((opcion) => ({ value: opcion, label: opcion }))}
                ariaLabel="Filtrar por talla de pantalón"
              />
              <SelectControl
                label="Talla de zapato"
                value={calzadoFiltro}
                onChange={setCalzadoFiltro}
                options={opcionesCalzado.map((opcion) => ({ value: opcion, label: opcion }))}
                ariaLabel="Filtrar por talla de zapato"
              />
            </div>
            <p className="mt-3 text-xs text-subtle">
              Los filtros se combinan entre sí. La edad de los hijos muestra
              empleados con algún hijo de la edad indicada.
            </p>
          </div>
        )}
      </section>

      {/* Tabla */}
      <section className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line/80 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Directorio de empleados</h2>
            <p className="mt-0.5 text-sm text-muted">
              {cargando
                ? "Cargando directorio desde el servidor…"
                : `Mostrando ${filtrados.length} de ${totalServidor} registros`}
            </p>
          </div>
          <span className="hidden rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted sm:block">
            Ejercicio fiscal {new Date().getFullYear()}
          </span>
        </div>

        {errorCarga && (
          <div className="flex items-center gap-3 border-b border-rose-500/30 bg-rose-500/[0.06] px-5 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
            <p className="flex-1 text-sm text-rose-700 dark:text-rose-200">{errorCarga}</p>
          </div>
        )}

        {cargando ? (
          <div className="flex items-center justify-center gap-3 px-5 py-16 text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
            <span className="text-sm">Consultando el directorio oficial…</span>
          </div>
        ) : filtrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] border-collapse">
              <thead>
                <tr className="border-b border-line/80 bg-surface/40">
                  <th className="table-head">Cédula</th>
                  <th className="table-head">Empleado</th>
                  <th className="table-head">Cargo</th>
                  <th className="table-head">Dependencia</th>
                  <th className="table-head">Tipo de nómina</th>
                  <th className="table-head">Edad</th>
                  <th className="table-head">Hijos</th>
                  <th className="table-head" title="Camisa / Pantalón / Zapato">
                    Tallas (C/P/Z)
                  </th>
                  <th className="table-head">Ingreso</th>
                  <th className="table-head text-right">Sueldo base</th>
                  <th className="table-head text-center">Estatus</th>
                  <th className="table-head text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtrados.map((emp) => {
                  const iniciales = `${emp.nombres[0] ?? ""}${emp.apellidos[0] ?? ""}`.toUpperCase();
                  const edad = calcularEdad(emp.fechaNacimiento, fechaRef);
                  const hijos = hijosDelEmpleado(emp);
                  const detalleHijos =
                    hijos.length > 0
                      ? hijos
                          .map((familiar) => {
                            const edadFamiliar = calcularEdad(
                              familiar.fechaNacimiento,
                              fechaRef,
                            );
                            return `${familiar.nombre.split(" ")[0]} (${edadFamiliar ?? "?"} años)`;
                          })
                          .join(", ")
                      : "Sin hijos registrados";
                  return (
                    <tr key={emp.id} className="group transition hover:bg-card/25">
                      <td className="table-cell font-mono text-base text-muted">{emp.cedula}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-card/60 text-xs font-semibold text-gold-light transition group-hover:border-gold/40">
                            {iniciales}
                          </span>
                          <span>
                            <span className="block text-base font-medium text-ink">
                              {nombreCompleto(emp)}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted">{emp.correo || "—"}</span>
                          </span>
                        </div>
                      </td>
                      <td className="table-cell text-base text-muted">{emp.cargo}</td>
                      <td className="table-cell text-base text-muted">{emp.departamento}</td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${claseTipoNomina(emp.tipoNomina)}`}
                        >
                          {emp.tipoNomina}
                        </span>
                      </td>
                      <td className="table-cell text-base text-muted">
                        {edad === null ? "—" : `${edad} años`}
                      </td>
                      <td className="table-cell" title={detalleHijos}>
                        {hijos.length > 0 ? (
                          <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                            {hijos.length} hijo{hijos.length === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="text-sm text-subtle">Sin hijos</span>
                        )}
                      </td>
                      <td
                        className="table-cell font-mono text-sm text-muted"
                        title={`Camisa ${emp.tallas.camisa} · Pantalón ${emp.tallas.pantalon} · Zapato ${emp.tallas.calzado}`}
                      >
                        {emp.tallas.camisa} / {emp.tallas.pantalon} / {emp.tallas.calzado}
                      </td>
                      <td className="table-cell text-base text-muted">{emp.fechaIngreso || "—"}</td>
                      <td className="table-cell text-right text-base font-medium text-ink">
                        {formatoMoneda(emp.sueldoBase)}
                      </td>
                      <td className="table-cell text-center">
                        <StatusBadge status={emp.estado} />
                      </td>
                      <td className="table-cell text-right">
                        <button
                          type="button"
                          onClick={() => setSeleccionado(emp)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 px-2.5 py-1.5 text-sm font-medium text-muted transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver ficha
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-subtle" />
            <p className="mt-3 text-base font-medium text-muted">
              No se encontraron empleados
            </p>
            <p className="mt-1 text-sm text-muted">
              Intente con otro término de búsqueda o ajuste los filtros seleccionados.
            </p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-4 rounded-lg border border-gold/30 bg-gold/[0.06] px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/10"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      <EmployeeWizard
        open={wizardOpen || editando !== null}
        empleado={editando}
        catalogos={
          catalogos ?? {
            oficinas: [],
            cargos: [],
            tiposNomina: [],
            nombreOficina: () => "—",
            nombreCargo: () => "—",
            nombreTipoNomina: () => "—",
          }
        }
        guardando={guardando}
        error={errorGuardado}
        onClose={() => {
          setWizardOpen(false);
          setEditando(null);
          setErrorGuardado("");
        }}
        onSave={guardarEmpleado}
      />
      <EmployeeDetail
        empleado={seleccionado}
        onClose={() => setSeleccionado(null)}
        onEditar={abrirEdicion}
        onDesactivar={desactivarEmpleado}
      />
    </>
  );
}
