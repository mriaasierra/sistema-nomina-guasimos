"use strict";

/**
 * Reglas de dominio compartidas por el backend.
 * Se documentan aquí para que controladores, validaciones y
 * consumidores de la API hablen el mismo idioma institucional.
 */
const domain = Object.freeze({
  /** Siglas institucionales oficiales: nunca "P.J.E.". */
  siglasInstitucionales: "P.I.E.",

  /** Prima por hijo: 6,25 Bs., aditiva al salario del empleado. */
  primaPorHijo: 6.25,
  primaPorHijoMoneda: "Bs.",

  /** Los cargos se muestran en singular (Director, Coordinador, etc.). */
  cargosEnSingular: true,

  /**
   * Tasa BCV de respaldo cuando no hay conexión o registros vigentes.
   * El frontend muestra "Bs. 00,00" con el aviso correspondiente.
   */
  tasaBcvFallback: 0,
  tasaBcvFallbackTexto: "Bs. 00,00",
});

module.exports = domain;
