import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="royal-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-royal-950/50">
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
        </span>
        <div>
          <p className="section-label mb-1.5 flex items-center gap-2 text-royal-700 dark:text-blue-300">
            <span className="h-px w-5 bg-royal-500" />
            {eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink lg:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
