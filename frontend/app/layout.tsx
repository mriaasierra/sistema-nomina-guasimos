import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Nómina | Alcaldía Bolivariana de Guásimos",
  description:
    "Sistema Web para la Gestión de Nómina y Liquidaciones de la Alcaldía Bolivariana del Municipio Guásimos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('tema-guasimos');if(t==='claro'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
