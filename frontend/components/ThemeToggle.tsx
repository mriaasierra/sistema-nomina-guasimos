"use client";

import { Moon, Sun } from "lucide-react";

const CLAVE_TEMA = "tema-guasimos";

/**
 * Interruptor de tema sobre la barra Azul Rey. El estado visual se controla
 * con la clase `dark` del <html>, así que no hay desfase durante la hidratación.
 */
export default function ThemeToggle() {
  const alternar = () => {
    const oscuro = document.documentElement.classList.contains("dark");
    const siguiente = oscuro ? "claro" : "oscuro";
    document.documentElement.classList.toggle("dark", !oscuro);
    try {
      window.localStorage.setItem(CLAVE_TEMA, siguiente);
    } catch {
      // Modo incógnito o almacenamiento bloqueado: el cambio sigue siendo visible.
    }
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Alternar modo claro y oscuro"
      title="Alternar modo claro y oscuro"
      className="inline-flex items-center gap-2 rounded-lg border border-royal-600/50 bg-royal-900/30 px-2.5 py-2 text-blue-100 transition hover:border-gold/60 hover:text-gold-light"
    >
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
      <Moon className="h-[18px] w-[18px] dark:hidden" />
      <span className="hidden text-xs font-semibold uppercase tracking-widest2 sm:inline">
        <span className="dark:hidden">Oscuro</span>
        <span className="hidden dark:inline">Claro</span>
      </span>
      <span aria-hidden="true" className="relative h-4 w-8 rounded-full bg-royal-500/60 transition-colors dark:bg-gold/70">
        <span className="absolute top-0.5 h-3 w-3 translate-x-4 rounded-full bg-white shadow transition-transform dark:translate-x-0.5" />
      </span>
    </button>
  );
}
