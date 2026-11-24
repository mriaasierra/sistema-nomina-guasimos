import type { LucideIcon } from "lucide-react";

interface MiniStatProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

export default function MiniStat({ label, value, hint, icon: Icon }: MiniStatProps) {
  return (
    <div className="card card-hover flex items-center gap-4 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-royal-500/40 bg-royal-700/20 text-royal-700 dark:text-blue-300">
        <Icon className="h-[20px] w-[20px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="mt-1 truncate text-2xl font-bold tracking-tight text-ink">{value}</p>
        <p className="mt-0.5 truncate text-sm text-muted">{hint}</p>
      </div>
    </div>
  );
}
