import AppShell from "@/components/AppShell";
import SessionProvider from "@/components/SessionProvider";

/**
 * Panel principal: valida la sesión antes de montar el sidebar y la barra
 * superior. Si no hay sesión válida, `SessionProvider` redirige a `/login`.
 */
export default function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
