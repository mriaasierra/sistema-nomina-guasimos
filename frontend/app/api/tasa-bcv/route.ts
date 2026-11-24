import { NextResponse } from "next/server";
import type { RespuestaTasaBcv } from "@/lib/tasa-bcv";

/** La tasa oficial se renueva como máximo una vez por hora. */
export const revalidate = 3600;

const URL_TASA_BCV = "https://ve.dolarapi.com/v1/dolares/oficial";
const TIEMPO_ESPERA_MS = 12000;

interface DatosDolarApi {
  promedio?: number | null;
  venta?: number | null;
  compra?: number | null;
  fechaActualizacion?: string | null;
}

function respuesta(data: RespuestaTasaBcv, esFallback: boolean) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": esFallback
        ? "public, s-maxage=300, stale-while-revalidate=900"
        : "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET() {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_ESPERA_MS);

  try {
    const respuestaApi = await fetch(URL_TASA_BCV, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: controlador.signal,
    });

    if (!respuestaApi.ok) {
      throw new Error(`Respuesta HTTP ${respuestaApi.status}`);
    }

    const datos = (await respuestaApi.json()) as DatosDolarApi;
    const tasa = [datos.promedio, datos.venta, datos.compra].find(
      (valor): valor is number =>
        typeof valor === "number" && Number.isFinite(valor) && valor > 0,
    );

    if (!tasa) {
      throw new Error("La API no devolvió una tasa válida");
    }

    return respuesta(
      {
        tasa,
        fechaActualizacion: datos.fechaActualizacion ?? null,
        esFallback: false,
      },
      false,
    );
  } catch {
    // Sin conexión: no se devuelve ningún valor histórico.
    return respuesta(
      {
        tasa: 0,
        fechaActualizacion: null,
        esFallback: true,
      },
      true,
    );
  } finally {
    clearTimeout(temporizador);
  }
}
