"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Contact,
  HeartPulse,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRoundMinus,
  UsersRound,
  X,
} from "lucide-react";
import ModalPortal from "@/components/ModalPortal";
import StatusBadge from "@/components/StatusBadge";
import {
  calcularEdad,
  edadesHijos,
  formatoMoneda,
  hijosDelEmpleado,
  nombreCompleto,
  type Empleado,
} from "@/lib/empleados";

interface EmployeeDetailProps {
  empleado: Empleado | null;
  onClose: () => void;
  onEditar: (empleado: Empleado) => void;
  onDesactivar: (empleado: Empleado) => void;
}

function Detalle({
  label,
  valor,
  icono: Icono,
}: {
  label: string;
  valor: string;
  icono?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-line/80 bg-surface/50 p-3.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1.5 flex items-start gap-2 text-base font-medium text-ink">
        {Icono && <Icono className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" />}
        <span className="break-words">{valor || "—"}</span>
      </p>
    </div>
  );
}

function textoEdad(fechaNacimiento: string): string {
  const edad = calcularEdad(fechaNacimiento);
  return edad === null ? "—" : `${edad} años`;
}

const secciones = [
  { label: "Personales", icon: Contact },
  { label: "Laborales y Bancarios", icon: Briefcase },
  { label: "Carga Familiar", icon: UsersRound },
  { label: "Tallas/Salud", icon: HeartPulse },
];

export default function EmployeeDetail({
  empleado,
  onClose,
  onEditar,
  onDesactivar,
}: EmployeeDetailProps) {
  const [seccion, setSeccion] = useState(0);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  useEffect(() => {
    if (empleado) {
      setSeccion(0);
      setConfirmandoBaja(false);
    }
  }, [empleado]);

  useEffect(() => {
    if (!empleado) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmandoBaja) setConfirmandoBaja(false);
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [empleado, onClose, confirmandoBaja]);

  if (!empleado) return null;

  const iniciales = `${empleado.nombres[0] ?? ""}${empleado.apellidos[0] ?? ""}`.toUpperCase();
  const hijos = hijosDelEmpleado(empleado);
  const edadesHijo = edadesHijos(empleado);

  const yaDesactivado = empleado.estado === "Retirado";

  return (
    <>
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
        aria-labelledby="ficha-title"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60"
      >
        {/* Cabecera */}
        <div className="relative overflow-hidden border-b border-line px-5 py-5 sm:px-6">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(249,115,22,0.20), transparent 70%)" }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="gold-gradient flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-navy-950 shadow-gold">
                {iniciales}
              </span>
              <div>
                <p className="section-label mb-1 text-gold/70">
                  Ficha del Empleado · {empleado.id}
                </p>
                <h2 id="ficha-title" className="text-lg font-semibold text-ink">
                  {nombreCompleto(empleado)}
                </h2>
                <p className="mt-0.5 text-sm text-muted">{empleado.cargo}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusBadge status={empleado.estado} />
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted">
                    Nómina {empleado.tipoNomina}
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted">
                    {empleado.departamento}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ficha"
              className="rounded-lg p-2 text-muted transition hover:bg-card hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 overflow-x-auto border-b border-line bg-surface/30 px-3 py-3 sm:px-5">
          {secciones.map((sec, index) => {
            const Icon = sec.icon;
            const activo = seccion === index;
            return (
              <button
                key={sec.label}
                type="button"
                onClick={() => setSeccion(index)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activo
                    ? "bg-gold/10 text-gold-light"
                    : "text-muted hover:bg-card/60 hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {seccion === 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detalle label="Cédula de identidad" valor={empleado.cedula} icono={IdCard} />
              <Detalle label="Fecha de nacimiento" valor={empleado.fechaNacimiento || "—"} />
              <Detalle label="Edad" valor={textoEdad(empleado.fechaNacimiento)} />
              <Detalle label="Lugar de nacimiento" valor={empleado.lugarNacimiento ?? "—"} icono={MapPin} />
              <Detalle label="Estado civil" valor={empleado.estadoCivil ?? "—"} />
              <Detalle label="Género" valor={empleado.genero || "—"} />
              <Detalle label="Teléfono" valor={empleado.telefono || "—"} icono={Phone} />
              <Detalle label="Correo electrónico" valor={empleado.correo || "—"} icono={Mail} />
              <div className="sm:col-span-2">
                <Detalle label="Dirección de habitación" valor={empleado.direccion || "—"} icono={MapPin} />
              </div>
            </div>
          )}

          {seccion === 1 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detalle label="Cargo" valor={empleado.cargo} />
              <Detalle label="Grado académico" valor={empleado.gradoAcademico} />
              <Detalle label="Oficina / Dependencia" valor={empleado.departamento} />
              <Detalle label="Tipo de nómina" valor={empleado.tipoNomina} />
              <Detalle label="Tipo de vinculación" valor={empleado.tipoVinculacion || "—"} />
              <Detalle label="Fecha de ingreso" valor={empleado.fechaIngreso || "—"} />
              <Detalle label="Sueldo base" valor={formatoMoneda(empleado.sueldoBase)} />
              <Detalle label="Estatus" valor={empleado.estado} />
              <div className="sm:col-span-2 mt-1 border-t border-line pt-4">
                <p className="section-label mb-3 text-gold/70">Información bancaria</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Detalle label="Banco" valor={empleado.banco || "—"} />
                  <Detalle label="Tipo de cuenta" valor={empleado.tipoCuenta ?? "—"} />
                  <div className="sm:col-span-2">
                    <Detalle label="Número de cuenta" valor={empleado.numeroCuenta || "—"} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {seccion === 2 && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Familiares a cargo</h3>
                  <p className="mt-0.5 text-sm text-muted">
                    {empleado.cargaFamiliar.length} registro(s) asociado(s) a esta ficha
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg border border-gold/20 bg-gold/[0.06] px-2.5 py-1.5 text-xs font-semibold text-gold-light">
                    {empleado.cargaFamiliar.length} familiar(es)
                  </span>
                  <span
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      hijos.length > 0
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-line bg-surface/60 text-muted"
                    }`}
                  >
                    {hijos.length > 0 ? `Sí · ${hijos.length} hijo(s)` : "Sin hijos"}
                  </span>
                </div>
              </div>
              {hijos.length > 0 && (
                <p className="mb-3 text-xs text-subtle">
                  Edades de los hijos: {edadesHijo.map((edad) => `${edad} años`).join(", ")}
                </p>
              )}
              {empleado.cargaFamiliar.length > 0 ? (
                <div className="space-y-3">
                  {empleado.cargaFamiliar.map((f, index) => (
                    <div
                      key={`${f.cedula}-${index}`}
                      className="rounded-xl border border-line/80 bg-surface/50 p-4"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/[0.07] text-sm font-semibold text-gold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-base font-medium text-ink">{f.nombre}</p>
                          <p className="mt-0.5 text-xs text-muted">{f.parentesco}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line/70 pt-3 sm:grid-cols-3">
                        <Detalle label="Cédula" valor={f.cedula} />
                        <Detalle label="Fecha de nacimiento" valor={f.fechaNacimiento} />
                        <Detalle label="Edad" valor={textoEdad(f.fechaNacimiento)} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line py-10 text-center">
                  <UsersRound className="mx-auto h-7 w-7 text-subtle" />
                  <p className="mt-3 text-sm font-medium text-muted">
                    Sin carga familiar registrada
                  </p>
                  <p className="mt-1 text-sm text-subtle">
                    Este empleado no tiene familiares a cargo declarados.
                  </p>
                </div>
              )}
            </div>
          )}

          {seccion === 3 && (
            <div className="space-y-6">
              <div>
                <p className="section-label mb-3 text-gold/70">Tallas de dotación</p>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">
                      Código de dotación (C/P/Z)
                    </p>
                    <p className="mt-1 font-mono text-base font-semibold text-gold-light">
                      {empleado.tallas.camisa} / {empleado.tallas.pantalon} / {empleado.tallas.calzado}
                    </p>
                  </div>
                  <span className="text-xs text-subtle">
                    Camisa / Pantalón / Zapato
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Detalle label="Camisa" valor={empleado.tallas.camisa} />
                  <Detalle label="Pantalón" valor={empleado.tallas.pantalon} />
                  <Detalle label="Zapato (calzado)" valor={empleado.tallas.calzado} />
                </div>
              </div>
              <div>
                <p className="section-label mb-3 text-gold/70">Información de salud</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Detalle label="Tipo de sangre" valor={empleado.salud.tipoSangre ?? "—"} />
                  <Detalle label="Discapacidad" valor={empleado.salud.discapacidad ?? "—"} />
                  <Detalle label="Alergias" valor={empleado.salud.alergias ?? "—"} />
                  <Detalle label="Condición médica" valor={empleado.salud.detalle ?? empleado.salud.enfermedades ?? "Ninguna"} />
                  <div className="sm:col-span-2">
                    <Detalle label="Notas médicas" valor={empleado.salud.notas ?? empleado.salud.observaciones ?? "Sin observaciones"} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie con acciones principales */}
        <div className="flex flex-col gap-3 border-t border-line bg-surface/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-subtle">
            Registro {empleado.id.slice(0, 8).toUpperCase()} · Directorio oficial
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-3.5 py-2.5 text-sm font-medium text-muted transition hover:border-gold/40 hover:text-gold"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoBaja(true)}
              disabled={yaDesactivado}
              title={
                yaDesactivado
                  ? "Este registro ya está dado de baja"
                  : "Dar de baja al empleado"
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/[0.08] px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
            >
              <UserRoundMinus className="h-4 w-4" />
              {yaDesactivado ? "Desactivado" : "Desactivar"}
            </button>
            <button
              type="button"
              onClick={() => onEditar(empleado)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2.5 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light"
            >
              <Pencil className="h-4 w-4" /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>

    {confirmandoBaja && (
      <ModalPortal>
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setConfirmandoBaja(false);
        }}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="baja-title"
          className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-2xl shadow-black/60 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 id="baja-title" className="text-base font-semibold text-ink">
                Confirmar baja del empleado
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Se desactivará el registro de{" "}
                <span className="font-semibold text-ink">
                  {nombreCompleto(empleado)}
                </span>{" "}
                ({empleado.cedula}). El empleado dejará de estar activo en el
                sistema.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmandoBaja(false)}
              className="rounded-lg border border-royal-700/40 px-4 py-2.5 text-sm font-medium text-royal-800 transition hover:border-royal-700 hover:bg-royal-700/10 dark:text-royal-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onDesactivar(empleado);
                setConfirmandoBaja(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              <UserRoundMinus className="h-4 w-4" /> Confirmar baja
            </button>
          </div>
        </div>
      </div>
      </ModalPortal>
    )}
    </>
  );
}
