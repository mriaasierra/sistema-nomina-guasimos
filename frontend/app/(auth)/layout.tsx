import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión | Sistema de Nómina · Guásimos",
  description:
    "Acceso exclusivo para personal autorizado de la Dirección de Recursos Humanos de la Alcaldía Bolivariana del Municipio Guásimos.",
};

/**
 * Layout de autenticación: pantalla limpia, sin sidebar ni barra superior.
 * Hereda el tema (claro/oscuro) del layout raíz.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(800px 460px at 82% -12%, rgba(30,64,175,0.16), transparent 62%), radial-gradient(700px 420px at 6% 108%, rgba(249,115,22,0.07), transparent 60%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
