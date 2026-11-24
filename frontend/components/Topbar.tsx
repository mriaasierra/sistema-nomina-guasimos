"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
} from "lucide-react";
import FechaActual from "@/components/FechaActual";
import ThemeToggle from "@/components/ThemeToggle";
import { useSession } from "@/components/SessionProvider";
import { cerrarSesion } from "@/lib/auth";
import { getNavItem } from "@/lib/navigation";

interface TopbarProps {
  onMenuClick: () => void;
}

const ETIQUETAS_ROL: Record<string, string> = {
  admin: "Administrador",
  administrador: "Administrador",
  rrhh: "Recursos Humanos",
  "recursos-humanos": "Recursos Humanos",
  "recursos_humanos": "Recursos Humanos",
};

function formatearRol(rol?: string): string {
  const valor = (rol ?? "").trim();
  if (!valor) return "Usuario";

  const clave = valor.toLowerCase().replace(/\s+/g, "-");
  const etiqueta = ETIQUETAS_ROL[clave] ?? ETIQUETAS_ROL[valor.toLowerCase()];
  if (etiqueta) return etiqueta;

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function inicialesDe(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "US";
  return `${partes[0]?.charAt(0) ?? ""}${partes[1]?.charAt(0) ?? ""}`.toUpperCase();
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const current = getNavItem(pathname);
  const { usuario } = useSession();
  const [saliendo, setSaliendo] = useState(false);

  const nombre = usuario.nombre?.trim() || usuario.usuario;
  const rol = formatearRol(usuario.rol);
  const iniciales = inicialesDe(nombre);

  const manejarSalida = () => {
    if (saliendo) return;
    setSaliendo(true);
    cerrarSesion();
    // Recarga completa: descarta estado en memoria y vuelve a montar /login.
    window.location.assign("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-royal-800/70 bg-royal-700/95 shadow-lg shadow-slate-950/30 backdrop-blur-xl">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="rounded-lg border border-royal-600/70 bg-royal-800/40 p-2 text-blue-100 transition hover:border-gold/60 hover:text-gold-light lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 sm:block">
          <div className="flex items-center gap-1.5 text-sm text-blue-200/80">
            <span>Inicio</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate text-white">{current.label}</span>
          </div>
          <h2 className="mt-0.5 truncate text-base font-semibold text-white">
            {current.description}
          </h2>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div className="hidden items-center gap-2 rounded-lg border border-royal-600/50 bg-royal-900/30 px-3 py-2 text-sm text-blue-100 xl:flex">
            <CalendarDays className="h-3.5 w-3.5 text-gold-light" />
            <FechaActual variante="extensa" />
          </div>

          <button
            type="button"
            aria-label="Buscar"
            className="rounded-lg border border-royal-600/50 bg-royal-900/30 p-2 text-blue-100 transition hover:border-gold/60 hover:text-gold-light"
          >
            <Search className="h-[17px] w-[17px]" />
          </button>

          <button
            type="button"
            aria-label="Notificaciones"
            className="relative rounded-lg border border-royal-600/50 bg-royal-900/30 p-2 text-blue-100 transition hover:border-gold/60 hover:text-gold-light"
          >
            <Bell className="h-[17px] w-[17px]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold ring-2 ring-royal-700" />
          </button>

          <div className="mx-1 hidden h-8 w-px bg-royal-600/50 sm:block" />

          <div className="flex items-center gap-2.5 rounded-xl border border-royal-600/50 bg-royal-900/30 py-1.5 pl-1.5 pr-3">
            <span className="gold-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-slate-950">
              {iniciales}
            </span>
            <span className="hidden text-left md:block">
              <span
                className="block max-w-[180px] truncate text-sm font-semibold leading-tight text-white"
                title={nombre}
              >
                {nombre}
              </span>
              <span className="mt-0.5 block text-xs leading-tight text-gold-light">
                {rol}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={manejarSalida}
            disabled={saliendo}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex items-center gap-2 rounded-lg border border-royal-600/50 bg-royal-900/30 p-2 text-blue-100 transition hover:border-gold/60 hover:text-gold-light disabled:cursor-wait disabled:opacity-70 sm:px-3"
          >
            {saliendo ? (
              <LoaderCircle className="h-[17px] w-[17px] animate-spin" />
            ) : (
              <LogOut className="h-[17px] w-[17px]" />
            )}
            <span className="hidden text-sm font-medium xl:inline">
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
