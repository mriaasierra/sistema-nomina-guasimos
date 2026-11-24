"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  actualizarUsuarioSesion,
  cerrarSesion,
  obtenerSesion,
  type UsuarioSesion,
} from "@/lib/auth";

interface SessionContextValue {
  usuario: UsuarioSesion;
  cargando: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Acceso al usuario autenticado desde cualquier componente del panel. */
export function useSession(): SessionContextValue {
  const contexto = useContext(SessionContext);
  if (!contexto) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>.");
  }
  return contexto;
}

function PantallaSesion({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <section
        aria-live="polite"
        className="card w-full max-w-sm border-t-2 border-t-gold/70 p-8 text-center"
      >
        <span className="gold-gradient mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-slate-950">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-ink">Sistema de Nómina</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{mensaje}</p>
        <LoaderCircle
          className="mx-auto mt-5 h-5 w-5 animate-spin text-gold"
          aria-hidden="true"
        />
      </section>
    </div>
  );
}

/**
 * Valida la sesión guardada contra `GET /api/auth/me` antes de renderizar
 * el panel. Si el token no existe, expiró, es inválido o el usuario está
 * inactivo, limpia la sesión y vuelve a `/login`.
 */
export default function SessionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [mensaje, setMensaje] = useState("Verificando sesión…");

  useEffect(() => {
    let cancelado = false;

    async function validarSesion() {
      const sesion = obtenerSesion();

      if (!sesion) {
        if (cancelado) return;
        cerrarSesion();
        setMensaje("No hay una sesión activa. Redirigiendo al inicio de sesión…");
        router.replace("/login");
        return;
      }

      try {
        const { data } = await apiFetch<{ usuario?: UsuarioSesion }>(
          "/auth/me",
          { redirigir401: false },
        );

        if (cancelado) return;

        if (!data?.usuario) {
          throw new Error("El servidor no devolvió el usuario de la sesión.");
        }

        actualizarUsuarioSesion(data.usuario);
        setUsuario(data.usuario);
      } catch {
        if (cancelado) return;
        cerrarSesion();
        setMensaje(
          "La sesión expiró o no es válida. Redirigiendo al inicio de sesión…",
        );
        router.replace("/login");
      }
    }

    void validarSesion();

    return () => {
      cancelado = true;
    };
  }, [router]);

  if (!usuario) {
    return <PantallaSesion mensaje={mensaje} />;
  }

  return (
    <SessionContext.Provider value={{ usuario, cargando: false }}>
      {children}
    </SessionContext.Provider>
  );
}
