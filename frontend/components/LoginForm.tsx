"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import LogoOficial from "@/components/LogoOficial";
import { AuthError, iniciarSesion } from "@/lib/auth";

type Campo = "identificador" | "contrasena";

export default function LoginForm() {
  const router = useRouter();

  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [erroresCampo, setErroresCampo] = useState<Partial<Record<Campo, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const limpiarError = (campo: Campo) => {
    setErroresCampo((actuales) => {
      if (!actuales[campo]) return actuales;
      const { [campo]: _omitido, ...resto } = actuales;
      return resto;
    });
    setErrorGeneral(null);
  };

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (enviando) return;

    const usuario = identificador.trim();
    const errores: Partial<Record<Campo, string>> = {};

    if (!usuario) errores.identificador = "Ingrese su usuario o correo electrónico.";
    if (!contrasena) errores.contrasena = "Ingrese su contraseña.";

    if (Object.keys(errores).length > 0) {
      setErroresCampo(errores);
      setErrorGeneral(null);
      return;
    }

    setErroresCampo({});
    setErrorGeneral(null);
    setEnviando(true);

    try {
      await iniciarSesion({ identificador: usuario, contrasena });
      router.push("/");
      router.refresh();
    } catch (error) {
      setErrorGeneral(
        error instanceof AuthError
          ? error.message
          : "Ocurrió un problema inesperado. Intente nuevamente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const claseBaseCampo =
    "w-full rounded-xl border bg-surface py-3 pl-11 pr-4 text-ink outline-none transition placeholder:text-muted/70 focus:ring-2 focus:ring-gold/10";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="card w-full max-w-[440px] border-t-2 border-t-gold/70 p-7 sm:p-9" aria-labelledby="titulo-login">
        <div className="mb-7 flex flex-col items-center text-center">
          <LogoOficial
            width={200}
            height={113}
            conFondo
            className="mb-5 rounded-2xl"
          />
          <h1
            id="titulo-login"
            className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]"
          >
            Dirección de Recursos Humanos
          </h1>
          <p className="mt-2 max-w-[340px] text-sm leading-relaxed text-muted">
            Ingrese sus credenciales para acceder al sistema de gestión de nómina y
            liquidaciones.
          </p>
        </div>

        {errorGeneral && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-300/70 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorGeneral}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="identificador"
              className="mb-2 block text-sm font-medium text-ink"
            >
              Usuario o correo electrónico
            </label>
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="identificador"
                name="identificador"
                type="text"
                autoComplete="username"
                placeholder="ej. nombre.usuario o correo@guasimos.gob.ve"
                value={identificador}
                onChange={(evento) => {
                  setIdentificador(evento.target.value);
                  limpiarError("identificador");
                }}
                disabled={enviando}
                aria-invalid={Boolean(erroresCampo.identificador)}
                aria-describedby={
                  erroresCampo.identificador ? "error-identificador" : undefined
                }
                className={`${claseBaseCampo} ${
                  erroresCampo.identificador
                    ? "border-rose-400"
                    : "border-line hover:border-gold/40 focus:border-gold/60"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </div>
            {erroresCampo.identificador && (
              <p
                id="error-identificador"
                className="mt-1.5 text-xs text-rose-600 dark:text-rose-300"
              >
                {erroresCampo.identificador}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="contrasena"
              className="mb-2 block text-sm font-medium text-ink"
            >
              Contraseña
            </label>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="contrasena"
                name="contrasena"
                type={mostrarContrasena ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Ingrese su contraseña"
                value={contrasena}
                onChange={(evento) => {
                  setContrasena(evento.target.value);
                  limpiarError("contrasena");
                }}
                disabled={enviando}
                aria-invalid={Boolean(erroresCampo.contrasena)}
                aria-describedby={erroresCampo.contrasena ? "error-contrasena" : undefined}
                className={`${claseBaseCampo} pr-12 ${
                  erroresCampo.contrasena
                    ? "border-rose-400"
                    : "border-line hover:border-gold/40 focus:border-gold/60"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena((visible) => !visible)}
                disabled={enviando}
                aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted transition hover:bg-gold/10 hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mostrarContrasena ? (
                  <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                )}
              </button>
            </div>
            {erroresCampo.contrasena && (
              <p id="error-contrasena" className="mt-1.5 text-xs text-rose-600 dark:text-rose-300">
                {erroresCampo.contrasena}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-navy-950 shadow-gold transition hover:bg-gold-light focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-70"
          >
            {enviando ? (
              <>
                <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
                Iniciando sesión…
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <div className="mt-7 flex items-start justify-center gap-2 border-t border-line pt-5 text-center text-xs leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold/70 dark:text-gold-light" aria-hidden="true" />
          <p>Acceso exclusivo para personal autorizado de Recursos Humanos.</p>
        </div>
      </section>
    </main>
  );
}
