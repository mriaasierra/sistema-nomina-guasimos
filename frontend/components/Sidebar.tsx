"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { navItems } from "@/lib/navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`sidebar-surface fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-line transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Marca institucional: logo oficial completo, sin texto adicional */}
        <div className="relative border-b border-royal-800/60 pb-3 pt-3">
          <div className="flex w-full items-center justify-center bg-white">
            <Image
              src="/logo-guasmos.jpg"
              alt="Alcaldía Bolivariana del Municipio Guásimos"
              width={367}
              height={207}
              priority
              className="block h-auto w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="absolute right-2 top-2 rounded-lg bg-navy-950/70 p-1.5 text-white transition hover:bg-navy-950 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-3 pt-5">
          <p className="section-label text-royal-700 dark:text-muted">Menú principal</p>
        </div>

        {/* Navegación: exactamente 5 secciones */}
        <nav className="flex-1 space-y-1 px-3 pb-4" aria-label="Navegación principal">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                  active
                    ? "bg-royal-700/70 text-white shadow-gold"
                    : "text-royal-800 hover:bg-royal-700/10 hover:text-royal-950 dark:text-nav dark:hover:bg-royal-800/60 dark:hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute -left-3 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-gold" />
                )}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                    active
                      ? "border-white/40 bg-white/15 text-white dark:border-gold/40 dark:bg-gold/15 dark:text-gold-light"
                      : "border-royal-700/50 bg-royal-700/10 text-royal-700 group-hover:border-royal-700 group-hover:bg-royal-700/15 group-hover:text-royal-900 dark:border-royal-700/60 dark:bg-royal-500/10 dark:text-nav-muted dark:group-hover:border-gold/30 dark:group-hover:text-gold-light"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold leading-tight">
                    {item.label}
                  </span>
                  <span
                    className={`mt-0.5 block truncate text-xs leading-tight ${
                      active
                        ? "text-white/90 dark:text-gold-light/80"
                        : "text-royal-700 dark:text-nav-muted"
                    }`}
                  >
                    {item.sublabel}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Pie del menú */}
        <div className="border-t border-royal-800/60 p-4">
          <div className="rounded-xl border border-royal-700/50 bg-royal-700/[0.06] p-3.5 dark:bg-royal-900/30">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-royal-700 dark:text-gold" />
              <p className="text-sm font-semibold text-nav">
                Sistema oficial
              </p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-royal-700 dark:text-nav-muted">
              Gestión integral de nómina y liquidaciones · Versión 1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
