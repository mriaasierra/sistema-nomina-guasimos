"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Calculator,
  ChevronDown,
  Info,
  Save,
  X,
} from "lucide-react";
import ModalPortal from "@/components/ModalPortal";
import {
  bonoVacacional,
  diasHabilesEntre,
  formatoFecha,
  formatoMoneda,
  nombreCompleto,
  sueldoDiario,
  type ModalidadVacacion,
  type VacacionRegistro,
} from "@/lib/vacaciones";
import type { Empleado } from "@/lib/empleados";

interface VacacionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (registro: VacacionRegistro) => void;
  /** Empleados activos del backend; el select usa sus UUIDs reales. */
  empleados: Empleado[];
  /** Deshabilita el guardado mientras viaja la petición al backend. */
  guardando?: boolean;
  /** Mensaje de error devuelto por el backend, si lo hay. */
  error?: string;
}

const inputCls =
  "w-full rounded-lg border border-line/70 bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-subtle focus:border-gold/60 focus:ring-2 focus:ring-gold/10 [color-scheme:light] dark:[color-scheme:dark]";

export default function VacacionFormModal({
  open,
  onClose,
  onSave,
  empleados,
  guardando = false,
  error: errorBackend = "",
}: VacacionFormModalProps) {
  const activos = useMemo(
    () => empleados.filter((e) => e.estado === "Activo"),
    [empleados],
  );
  const [empleadoId, setEmpleadoId] = useState("");
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [modalidad, setModalidad] = useState<ModalidadVacacion>("Disfrute");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    // Selecciona el primer empleado activo real al abrir.
    setEmpleadoId((prev) =>
      activos.some((e) => e.id === prev) ? prev : (activos[0]?.id ?? ""),
    );
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activos]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const empleado = activos.find((e) => e.id === empleadoId) ?? activos[0];
  const dias = diasHabilesEntre(fechaInicio, fechaFin);
  const diario = empleado ? sueldoDiario(empleado.sueldoBase) : 0;
  const bono = empleado ? bonoVacacional(empleado.sueldoBase) : 0;

  if (!open) return null;

  const guardar = () => {
    if (!empleado) {
      setError("Seleccione un empleado.");
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError("Indique las fechas de inicio y fin del periodo.");
      return;
    }
    if (dias === 0) {
      setError("El rango de fechas debe incluir al menos un día hábil.");
      return;
    }

    const registro: VacacionRegistro = {
      id: "",
      empleadoId: empleado.id,
      cedula: empleado.cedula,
      nombre: nombreCompleto(empleado),
      cargo: empleado.cargo,
      anio,
      fechaInicio,
      fechaFin,
      diasHabiles: dias,
      sueldoDiario: diario,
      montoBono: bono,
      estado: "Pendiente",
      modalidad,
    };

    onSave(registro);
  };

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
        aria-labelledby="vacacion-title"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h2 id="vacacion-title" className="text-base font-semibold text-ink">
                Registrar Vacaciones
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Solicitud y cálculo automático del Bono Vacacional
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

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {(error || errorBackend) && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error || errorBackend}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-muted">Empleado</span>
              <select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                className={inputCls}
              >
                {activos.length === 0 && <option value="">Sin empleados activos</option>}
                {activos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {nombreCompleto(e)} · {e.cedula}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-muted">
                Año correspondiente
              </span>
              <div className="relative">
                <select
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  className={inputCls}
                >
                  {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(
                    (a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ),
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              </div>
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-muted">Modalidad</span>
              <div className="relative">
                <select
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value as ModalidadVacacion)}
                  className={inputCls}
                >
                  <option value="Disfrute">Control de Disfrute</option>
                  <option value="Bono Vacacional">Bono Vacacional</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              </div>
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-muted">Fecha de inicio</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={inputCls}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-muted">Fecha de fin</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className={inputCls}
              />
            </label>

            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-muted">
                Días hábiles (calculados automáticamente)
              </span>
              <div className="flex items-center gap-3 rounded-lg border border-line/70 bg-surface/40 px-3 py-2.5">
                <span className="text-lg font-semibold text-gold-light">{dias}</span>
                <span className="text-sm text-muted">
                  días de lunes a viernes
                  {fechaInicio && fechaFin ? ` · ${formatoFecha(fechaInicio)} al ${formatoFecha(fechaFin)}` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Cálculo del bono */}
          <div className="mt-6 rounded-xl border border-gold/25 bg-gold/[0.04] p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-gold" />
              <h3 className="text-sm font-semibold text-gold-light">
                Cálculo automático del Bono Vacacional
              </h3>
            </div>
            <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Sueldo diario = sueldo base ÷ 30. Bono = 15 días × sueldo diario.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Sueldo base mensual", empleado ? formatoMoneda(empleado.sueldoBase) : "—"],
                ["Sueldo diario", formatoMoneda(diario)],
                ["Días del bono", "15 días"],
                ["Monto del bono", formatoMoneda(bono)],
              ].map(([label, valor], index) => (
                <div
                  key={label}
                  className={`rounded-lg border p-3 ${
                    index === 3
                      ? "border-gold/40 bg-gold/10"
                      : "border-line bg-surface/60"
                  }`}
                >
                  <p className="text-sm font-medium uppercase tracking-wider text-muted">
                    {label}
                  </p>
                  <p
                    className={`mt-1.5 text-base font-semibold ${
                      index === 3 ? "text-gold-light" : "text-ink"
                    }`}
                  >
                    {valor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface/40 px-5 py-4 sm:px-6">
          <p className="hidden text-sm text-muted sm:block">
            El registro se creará con estatus Pendiente
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:border-slate-500 hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || activos.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {guardando ? "Guardando…" : "Guardar solicitud"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
