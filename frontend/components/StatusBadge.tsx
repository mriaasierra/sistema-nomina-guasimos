import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleDashed, Clock3, CircleX } from "lucide-react";

const styles: Record<string, { cls: string; icon: LucideIcon; dot: string }> = {
  Procesada: {
    cls: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: CircleCheck,
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  Pagado: {
    cls: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: CircleCheck,
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  Aprobado: {
    cls: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: CircleCheck,
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  Activo: {
    cls: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: CircleCheck,
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  "En curso": {
    cls: "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    icon: CircleDashed,
    dot: "bg-sky-600 dark:bg-sky-400",
  },
  "En revisión": {
    cls: "border-orange-300 bg-orange-100 text-orange-700 dark:border-gold/40 dark:bg-gold/15 dark:text-gold-light",
    icon: CircleDashed,
    dot: "bg-gold",
  },
  "En Disfrute": {
    cls: "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    icon: CircleDashed,
    dot: "bg-sky-600 dark:bg-sky-400",
  },
  "En vacaciones": {
    cls: "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    icon: CircleDashed,
    dot: "bg-sky-600 dark:bg-sky-400",
  },
  Registrado: {
    cls: "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    icon: CircleDashed,
    dot: "bg-sky-600 dark:bg-sky-400",
  },
  Pendiente: {
    cls: "border-orange-300 bg-orange-100 text-orange-700 dark:border-gold/40 dark:bg-gold/15 dark:text-gold-light",
    icon: Clock3,
    dot: "bg-gold",
  },
  Inactivo: {
    cls: "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
    icon: CircleX,
    dot: "bg-rose-600 dark:bg-rose-400",
  },
  Retirado: {
    cls: "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
    icon: CircleX,
    dot: "bg-rose-600 dark:bg-rose-400",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = styles[status] ?? styles.Pendiente;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${config.cls}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {status}
    </span>
  );
}
