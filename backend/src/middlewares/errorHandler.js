"use strict";

const env = require("../config/env");

/**
 * Traduce errores de PostgreSQL y errores de aplicación a una
 * respuesta JSON consistente para toda la API.
 */
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.status || 500;
  let message = error.message || "Error interno del servidor";
  let details = error.details;

  switch (error.code) {
    case "23505":
      status = 409;
      message = "Ya existe un registro con los mismos datos únicos";
      details = error.detail;
      break;
    case "23503":
      status = 409;
      message = "El registro referencia un elemento inexistente o está en uso";
      details = error.detail;
      break;
    case "23502":
      status = 400;
      message = "Falta un campo obligatorio en la base de datos";
      details = error.detail;
      break;
    case "23514":
      status = 400;
      message = "El valor enviado no cumple una restricción de la base de datos";
      details = error.detail;
      break;
    case "22P02":
      status = 400;
      message = "El formato de un dato enviado no es válido";
      details = error.detail;
      break;
    case "22007":
    case "22008":
      status = 400;
      message = "La fecha u hora enviada no es válida";
      details = error.detail;
      break;
    default:
      break;
  }

  if (status >= 500) {
    console.error("[error]", error);
    if (env.nodeEnv === "production") {
      message = "Error interno del servidor";
      details = undefined;
    }
  }

  return res.status(status).json({
    ok: false,
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = errorHandler;
