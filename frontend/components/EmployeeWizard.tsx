"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Contact,
  HeartPulse,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import ModalPortal from "@/components/ModalPortal";
import {
  cargoOficial,
  gradosAcademicos,
  PORCENTAJES_PROFESIONALIZACION,
  type GradoAcademico,
} from "@/lib/cargos";
import {
  formatoMoneda,
  type Empleado,
  type Familiar,
} from "@/lib/empleados";
import type { Catalogos } from "@/lib/api/catalogos";

interface EmployeeWizardProps {
  open: boolean;
  onClose: () => void;
  onSave: (empleado: Empleado) => void;
  /** Empleado a editar; si es null el formulario crea uno nuevo. */
  empleado?: Empleado | null;
  /** Catálogos reales (`cargos`, `oficinas`, `tipos-nomina`) con sus UUIDs. */
  catalogos: Catalogos;
  /** Deshabilita el botón de guardar mientras viaja la petición. */
  guardando?: boolean;
  /** Mensaje de error devuelto por el backend, si lo hay. */
  error?: string;
}

interface FormState {
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  direccion: string;
  telefono: string;
  correo: string;
  // Datos laborales (UUIDs de los catálogos reales)
  cargoId: string;
  gradoAcademico: string;
  oficinaId: string;
  tipoNominaId: string;
  tipoVinculacion: string;
  estatus: string;
  fechaIngreso: string;
  sueldoBase: string;
  banco: string;
  numeroCuenta: string;
  // Tallas y salud
  camisa: string;
  pantalon: string;
  calzado: string;
  tieneEnfermedad: string;
  enfermedadDetalle: string;
  enfermedadNotas: string;
}

const formularioVacio: FormState = {
  cedula: "",
  nombres: "",
  apellidos: "",
  fechaNacimiento: "",
  genero: "Masculino",
  direccion: "",
  telefono: "",
  correo: "",
  cargoId: "",
  gradoAcademico: "No registra",
  oficinaId: "",
  tipoNominaId: "",
  tipoVinculacion: "Fijo",
  estatus: "Activo",
  fechaIngreso: "",
  sueldoBase: "",
  banco: "Banco de Venezuela",
  numeroCuenta: "",
  camisa: "",
  pantalon: "",
  calzado: "",
  tieneEnfermedad: "No",
  enfermedadDetalle: "",
  enfermedadNotas: "",
};

const familiarVacio: Familiar = {
  nombre: "",
  parentesco: "Hijo(a)",
  cedula: "",
  fechaNacimiento: "",
};

/** Convierte DD/MM/AAAA a AAAA-MM-DD para los campos date del formulario. */
function aInputFecha(fecha: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  const coincidencia = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(fecha);
  return coincidencia
    ? `${coincidencia[3]}-${coincidencia[2].padStart(2, "0")}-${coincidencia[1].padStart(2, "0")}`
    : "";
}

/** Normaliza la fecha guardada al formato institucional DD/MM/AAAA. */
function aFechaGuardada(fecha: string, porDefecto: string): string {
  if (!fecha) return porDefecto;
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  return coincidencia
    ? `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`
    : fecha;
}

/** Verifica que el grado académico seleccionado sea uno de los reconocidos. */
function esGradoAcademico(valor: string): valor is GradoAcademico {
  return gradosAcademicos.some((grado) => grado === valor);
}

function formDesdeEmpleado(empleado: Empleado): FormState {
  return {
    cedula: empleado.cedula,
    nombres: empleado.nombres,
    apellidos: empleado.apellidos,
    fechaNacimiento: aInputFecha(empleado.fechaNacimiento),
    genero: empleado.genero || "Masculino",
    direccion: empleado.direccion,
    telefono: empleado.telefono,
    correo: empleado.correo,
    cargoId: empleado.cargoId ?? "",
    gradoAcademico: empleado.gradoAcademico || "No registra",
    oficinaId: empleado.oficinaId ?? "",
    tipoNominaId: empleado.tipoNominaId ?? "",
    tipoVinculacion: empleado.tipoVinculacion || "Fijo",
    estatus: empleado.estado === "Retirado" ? "Retirado" : "Activo",
    fechaIngreso: aInputFecha(empleado.fechaIngreso),
    sueldoBase: String(empleado.sueldoBase ?? ""),
    banco: empleado.banco || "Banco de Venezuela",
    numeroCuenta: empleado.numeroCuenta ?? "",
    camisa: empleado.tallas.camisa === "—" ? "" : empleado.tallas.camisa,
    pantalon: empleado.tallas.pantalon === "—" ? "" : empleado.tallas.pantalon,
    calzado: empleado.tallas.calzado === "—" ? "" : empleado.tallas.calzado,
    tieneEnfermedad: empleado.salud.tieneEnfermedad ? "Sí" : "No",
    enfermedadDetalle: empleado.salud.detalle ?? "",
    enfermedadNotas: empleado.salud.notas ?? "",
  };
}

const pasos = [
  {
    label: "Datos Personales",
    short: "Personales",
    desc: "Identificación y contacto",
    icon: UserRound,
  },
  {
    label: "Datos Laborales y Bancarios",
    short: "Laborales",
    desc: "Cargo, nómina y cuenta bancaria",
    icon: Briefcase,
  },
  {
    label: "Carga Familiar/Hijos",
    short: "Familiar",
    desc: "Familiares a cargo",
    icon: UsersRound,
  },
  {
    label: "Tallas/Salud",
    short: "Tallas/Salud",
    desc: "Tallas e información médica",
    icon: HeartPulse,
  },
];

const inputCls =
  "w-full rounded-lg border border-line/70 bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-subtle focus:border-gold/60 focus:ring-2 focus:ring-gold/10 [color-scheme:light] dark:[color-scheme:dark]";
const labelCls = "mb-1.5 block text-sm font-medium text-muted";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  wide = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  type?: string;
  wide?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-readonly={readOnly}
        className={`${inputCls} ${readOnly ? "cursor-not-allowed opacity-80" : ""}`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  wide = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  options: readonly { value: string; label: string }[];
  wide?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className={labelCls}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 border-b border-line/70 pb-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export default function EmployeeWizard({
  open,
  onClose,
  onSave,
  empleado = null,
  catalogos,
  guardando = false,
  error: errorBackend = "",
}: EmployeeWizardProps) {
  const [paso, setPaso] = useState(0);
  const [form, setForm] = useState<FormState>(formularioVacio);
  const [familiares, setFamiliares] = useState<Familiar[]>([{ ...familiarVacio }]);
  const [error, setError] = useState("");
  const editando = Boolean(empleado);

  useEffect(() => {
    if (!open) return;
    setForm(empleado ? formDesdeEmpleado(empleado) : formularioVacio);
    setFamiliares(
      empleado && empleado.cargaFamiliar.length > 0
        ? empleado.cargaFamiliar.map((familiar) => ({
            ...familiar,
            fechaNacimiento: aInputFecha(familiar.fechaNacimiento),
          }))
        : [{ ...familiarVacio }],
    );
    setPaso(0);
    setError("");
  }, [open, empleado]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const set = (campo: keyof FormState) => (valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setError("");
  };

  /**
   * Al elegir un cargo se sugiere el sueldo base de la escala oficial;
   * el valor queda editable porque el backend persiste `sueldo_base`.
   */
  const seleccionarCargo = (cargoId: string) => {
    const nombre = catalogos.nombreCargo(cargoId);
    const config = nombre === "—" ? undefined : cargoOficial(nombre);
    setForm((prev) => ({
      ...prev,
      cargoId,
      sueldoBase:
        config && (prev.sueldoBase === "" || prev.cargoId !== cargoId)
          ? String(config.sueldoBase)
          : prev.sueldoBase,
    }));
    setError("");
  };

  const actualizarFamiliar = (
    index: number,
    campo: keyof Familiar,
    valor: string,
  ) => {
    setFamiliares((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [campo]: valor } : f)),
    );
  };

  const siguiente = () => {
    if (paso === 0 && (!form.cedula.trim() || !form.nombres.trim() || !form.apellidos.trim())) {
      setError("La cédula, los nombres y los apellidos son obligatorios.");
      return;
    }
    if (
      paso === 1 &&
      (!form.cargoId ||
        !form.oficinaId ||
        (opcionesTipoNomina.length > 0 && !form.tipoNominaId) ||
        !form.fechaIngreso ||
        Number(form.sueldoBase) <= 0)
    ) {
      setError(
        "Seleccione cargo, oficina y tipo de nómina, indique la fecha de ingreso y un sueldo base válido.",
      );
      return;
    }
    setError("");
    setPaso((p) => Math.min(p + 1, pasos.length - 1));
  };

  const guardar = () => {
    if (!form.cedula.trim() || !form.nombres.trim() || !form.apellidos.trim()) {
      setError("Complete la identificación del empleado en el paso 1.");
      setPaso(0);
      return;
    }
    if (
      !form.cargoId ||
      !form.oficinaId ||
      (opcionesTipoNomina.length > 0 && !form.tipoNominaId) ||
      !form.fechaIngreso ||
      Number(form.sueldoBase) <= 0
    ) {
      setError("Complete los datos laborales en el paso 2.");
      setPaso(1);
      return;
    }

    const gradoSeleccionado: GradoAcademico = esGradoAcademico(form.gradoAcademico)
      ? form.gradoAcademico
      : "No registra";

    const cargaFamiliar = familiares
      .filter((f) => f.nombre.trim() !== "")
      .map((f) => ({
        ...f,
        nombre: f.nombre.trim(),
        fechaNacimiento: aFechaGuardada(f.fechaNacimiento, "No registrada"),
      }));

    const resultado: Empleado = {
      id: empleado?.id ?? "",
      cedula: form.cedula.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      cargo: catalogos.nombreCargo(form.cargoId),
      departamento: catalogos.nombreOficina(form.oficinaId),
      tipoNomina: catalogos.nombreTipoNomina(form.tipoNominaId),
      tipoVinculacion: form.tipoVinculacion,
      gradoAcademico: gradoSeleccionado,
      fechaIngreso: aFechaGuardada(form.fechaIngreso, ""),
      sueldoBase: Number(form.sueldoBase) || 0,
      estado: form.estatus === "Retirado" ? "Retirado" : "Activo",
      fechaNacimiento: aFechaGuardada(form.fechaNacimiento, ""),
      genero: form.genero,
      direccion: form.direccion,
      telefono: form.telefono,
      correo: form.correo,
      banco: form.banco,
      numeroCuenta: form.numeroCuenta,
      cargaFamiliar,
      tallas: {
        camisa: form.camisa || "—",
        pantalon: form.pantalon || "—",
        calzado: form.calzado || "—",
      },
      salud: {
        enfermedades: form.enfermedadDetalle || "Ninguna",
        observaciones: form.enfermedadNotas || "Sin observaciones",
        tieneEnfermedad: form.tieneEnfermedad === "Sí",
        detalle: form.enfermedadDetalle,
        notas: form.enfermedadNotas,
      },
      // UUIDs reales de los catálogos, tal como los espera el backend.
      cargoId: form.cargoId,
      oficinaId: form.oficinaId,
      tipoNominaId: form.tipoNominaId,
    };

    onSave(resultado);
  };

  const nombreCargo = catalogos.nombreCargo(form.cargoId);
  const configCargo = nombreCargo === "—" ? undefined : cargoOficial(nombreCargo);
  const porcentajeProfesionalizacion = esGradoAcademico(form.gradoAcademico)
    ? PORCENTAJES_PROFESIONALIZACION[form.gradoAcademico]
    : 0;

  const opcionesCargo = catalogos.cargos.map((cargo) => ({
    value: cargo.id,
    label: cargo.nombre,
  }));
  const opcionesOficina = catalogos.oficinas.map((oficina) => ({
    value: oficina.id,
    label: oficina.nombre,
  }));
  const opcionesTipoNomina = catalogos.tiposNomina.map((tipo) => ({
    value: tipo.id,
    label: tipo.nombre,
  }));

  let contenido: ReactNode = null;

  if (paso === 0) {
    contenido = (
      <>
        <SectionTitle
          title="Datos Personales"
          subtitle="Información de identificación, nacimiento y medios de contacto."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cédula de identidad" value={form.cedula} onChange={set("cedula")} placeholder="Ej. 25.618.094" />
          <Field label="Correo electrónico institucional" value={form.correo} onChange={set("correo")} placeholder="nombre@guasimos.gob.ve" type="email" />
          <Field label="Nombres" value={form.nombres} onChange={set("nombres")} placeholder="Ej. José Antonio" />
          <Field label="Apellidos" value={form.apellidos} onChange={set("apellidos")} placeholder="Ej. Ferrer Rodríguez" />
          <Field label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={set("fechaNacimiento")} type="date" />
          <SelectField
            label="Género"
            value={form.genero}
            onChange={set("genero")}
            options={[
              { value: "Masculino", label: "Masculino" },
              { value: "Femenino", label: "Femenino" },
            ]}
          />
          <Field label="Dirección de habitación" value={form.direccion} onChange={set("direccion")} placeholder="Calle, número, sector" wide />
          <Field label="Teléfono" value={form.telefono} onChange={set("telefono")} placeholder="0414-000-0000" />
        </div>
      </>
    );
  } else if (paso === 1) {
    contenido = (
      <>
        <SectionTitle
          title="Datos Laborales y Bancarios"
          subtitle="Relación laboral, tipo de nómina y datos para el pago de la nómina."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Cargo"
            value={form.cargoId}
            onChange={seleccionarCargo}
            options={opcionesCargo}
            placeholder="Seleccione un cargo"
          />
          <SelectField
            label="Grado académico"
            value={form.gradoAcademico}
            onChange={set("gradoAcademico")}
            options={gradosAcademicos.map((grado) => ({ value: grado, label: grado }))}
          />
          <SelectField
            label="Oficina / Dependencia"
            value={form.oficinaId}
            onChange={set("oficinaId")}
            options={opcionesOficina}
            placeholder="Seleccione una oficina"
          />
          <SelectField
            label="Tipo de nómina"
            value={form.tipoNominaId}
            onChange={set("tipoNominaId")}
            options={opcionesTipoNomina}
            placeholder="Seleccione el tipo de nómina"
          />
          <SelectField
            label="Tipo de vinculación"
            value={form.tipoVinculacion}
            onChange={set("tipoVinculacion")}
            options={[
              { value: "Fijo", label: "Fijo" },
              { value: "Contratado", label: "Contratado" },
              { value: "Obrero", label: "Obrero" },
            ]}
          />
          <SelectField
            label="Estatus"
            value={form.estatus}
            onChange={set("estatus")}
            options={[
              { value: "Activo", label: "Activo" },
              { value: "Retirado", label: "Retirado" },
            ]}
          />
          <Field label="Fecha de ingreso" value={form.fechaIngreso} onChange={set("fechaIngreso")} type="date" />
          <Field
            label="Sueldo base (Bs.)"
            value={form.sueldoBase}
            onChange={set("sueldoBase")}
            type="number"
            placeholder="Ej. 348"
          />
          <p className="mt-1 text-xs leading-relaxed text-muted sm:col-span-2">
            {configCargo
              ? `Escala oficial para ${nombreCargo}: ${formatoMoneda(configCargo.sueldoBase)} · S.S.O. ${formatoMoneda(configCargo.sso)} · P.I.E. ${formatoMoneda(configCargo.pje)} · Profesionalización ${Math.round(porcentajeProfesionalizacion * 100)}%.`
              : "El sueldo base se sugiere desde la escala oficial al elegir el cargo y queda editable."}
          </p>
          <SelectField
            label="Banco"
            value={form.banco}
            onChange={set("banco")}
            options={[
              { value: "Banco de Venezuela", label: "Banco de Venezuela" },
              { value: "Banesco", label: "Banesco" },
              { value: "Banco Provincial", label: "Banco Provincial" },
              { value: "BOD", label: "BOD" },
              { value: "Banco Bis", label: "Banco Bis" },
            ]}
          />
          <Field label="Número de cuenta" value={form.numeroCuenta} onChange={set("numeroCuenta")} placeholder="0000-0000-00-0000000000" />
        </div>
      </>
    );
  } else if (paso === 2) {
    contenido = (
      <>
        <SectionTitle
          title="Carga Familiar/Hijos"
          subtitle="Registre los familiares a cargo para efectos de beneficios y deducciones."
        />
        <div className="space-y-3">
          {familiares.map((f, index) => (
            <div
              key={index}
              className="rounded-xl border border-line/60 bg-surface/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold/80">
                  <Contact className="h-3.5 w-3.5" /> Familiar {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setFamiliares((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded-md p-1.5 text-muted transition hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label={`Eliminar familiar ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre completo"
                  value={f.nombre}
                  onChange={(v) => actualizarFamiliar(index, "nombre", v)}
                  placeholder="Nombre y apellidos"
                />
                <SelectField
                  label="Parentesco"
                  value={f.parentesco}
                  onChange={(v) => actualizarFamiliar(index, "parentesco", v)}
                  options={[
                    { value: "Hijo(a)", label: "Hijo(a)" },
                    { value: "Cónyuge", label: "Cónyuge" },
                    { value: "Madre", label: "Madre" },
                    { value: "Padre", label: "Padre" },
                    { value: "Hermano(a)", label: "Hermano(a)" },
                    { value: "Otro", label: "Otro" },
                  ]}
                />
                <Field
                  label="Cédula"
                  value={f.cedula}
                  onChange={(v) => actualizarFamiliar(index, "cedula", v)}
                  placeholder="Ej. 32.114.908"
                />
                <Field
                  label="Fecha de nacimiento"
                  value={f.fechaNacimiento}
                  onChange={(v) => actualizarFamiliar(index, "fechaNacimiento", v)}
                  type="date"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFamiliares((prev) => [...prev, { ...familiarVacio }])}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gold/40 bg-gold/[0.04] px-4 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/10"
          >
            <Plus className="h-4 w-4" /> Agregar familiar
          </button>
        </div>
      </>
    );
  } else {
    contenido = (
      <>
        <SectionTitle
          title="Tallas/Salud"
          subtitle="Tallas de dotación y condición de salud relevante para el puesto."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Talla de camisa"
            value={form.camisa}
            onChange={set("camisa")}
            options={["XS", "S", "M", "L", "XL", "XXL"].map((talla) => ({
              value: talla,
              label: talla,
            }))}
          />
          <Field label="Talla de pantalón" value={form.pantalon} onChange={set("pantalon")} placeholder="Ej. 32" />
          <Field label="Talla de zapato (calzado)" value={form.calzado} onChange={set("calzado")} placeholder="Ej. 41" />
          <SelectField
            label="¿Presenta alguna condición médica?"
            value={form.tieneEnfermedad}
            onChange={set("tieneEnfermedad")}
            options={[
              { value: "No", label: "No" },
              { value: "Sí", label: "Sí" },
            ]}
          />
          <Field
            label="Condición médica / alergias"
            value={form.enfermedadDetalle}
            onChange={set("enfermedadDetalle")}
            placeholder="Ej. Hipertensión controlada"
            wide
          />
          <label className="sm:col-span-2">
            <span className={labelCls}>Notas médicas</span>
            <textarea
              value={form.enfermedadNotas}
              onChange={(e) => set("enfermedadNotas")(e.target.value)}
              rows={3}
              placeholder="Información adicional relevante"
              className={inputCls}
            />
          </label>
        </div>
      </>
    );
  }

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60"
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              {editando ? <Pencil className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
            </span>
            <div>
              <h2 id="wizard-title" className="text-base font-semibold text-ink">
                {editando ? "Editar Empleado" : "Nuevo Empleado"}
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {editando
                  ? `Modificación de ficha · ${empleado?.id} · Alcaldía Bolivariana del Municipio Guásimos`
                  : "Registro de personal · Alcaldía Bolivariana del Municipio Guásimos"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="rounded-lg p-2 text-muted transition hover:bg-card hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 overflow-x-auto border-b border-line bg-surface/30 px-3 py-3 sm:px-5">
          {pasos.map((p, index) => {
            const Icon = p.icon;
            const activo = index === paso;
            const completo = index < paso;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPaso(index);
                  setError("");
                }}
                className={`flex min-w-[130px] flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  activo
                    ? "border-gold/40 bg-gold/10"
                    : completo
                      ? "border-emerald-300 bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/[0.05]"
                      : "border-transparent hover:bg-card/50"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold ${
                    activo
                      ? "border-gold/40 bg-gold text-navy-950"
                      : completo
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "border-line text-muted"
                  }`}
                >
                  {completo ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      activo ? "text-gold-light" : "text-muted"
                    }`}
                  >
                    {p.short}
                  </span>
                  <span className="mt-0.5 hidden truncate text-sm text-muted sm:block">
                    {p.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {(error || errorBackend) && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error || errorBackend}
            </div>
          )}
          {contenido}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface/40 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:border-slate-500 hover:text-ink"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            {paso > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPaso((p) => p - 1);
                  setError("");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:border-slate-500 hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" /> Atrás
              </button>
            )}
            {paso < pasos.length - 1 ? (
              <button
                type="button"
                onClick={siguiente}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar empleado"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
