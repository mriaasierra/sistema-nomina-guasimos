import Image from "next/image";

interface LogoOficialProps {
  width?: number;
  height?: number;
  className?: string;
  /** Fondo blanco para garantizar contraste sobre superficies azules. */
  conFondo?: boolean;
  priority?: boolean;
}

/**
 * Logo oficial de la Alcaldía Bolivariana del Municipio Guásimos.
 * Se usa en el sidebar y en las cabeceras de reportes, planillas y recibos.
 */
export default function LogoOficial({
  width = 64,
  height = 36,
  className = "",
  conFondo = false,
  priority = true,
}: LogoOficialProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${
        conFondo
          ? "rounded-lg bg-white/95 p-1 shadow-sm ring-1 ring-royal-900/20"
          : ""
      } ${className}`}
    >
      <Image
        src="/logo-guasmos.jpg"
        alt="Logo oficial de la Alcaldía Bolivariana del Municipio Guásimos"
        width={width}
        height={height}
        priority={priority}
        className="object-contain"
      />
    </span>
  );
}
