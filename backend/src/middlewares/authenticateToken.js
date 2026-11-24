"use strict";

const { HttpError } = require("../utils/httpError");
const { verificarToken } = require("../utils/jwt");
const { UUID_RE } = require("./validate");

function extraerToken(header) {
  if (typeof header !== "string") return null;

  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (!/^Bearer$/i.test(scheme) || rest.length === 0) return null;

  return rest.join(" ");
}

/**
 * Verifica el JWT enviado en `Authorization: Bearer <token>`.
 * Deja los datos básicos en `req.auth` para las rutas protegidas.
 */
function authenticateToken(req, res, next) {
  const token = extraerToken(req.headers.authorization);

  if (!token) {
    return next(new HttpError(401, "Token de autenticación requerido"));
  }

  let payload;
  try {
    payload = verificarToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(
        new HttpError(401, "La sesión ha expirado. Inicie sesión nuevamente."),
      );
    }
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return next(new HttpError(401, "Token de autenticación inválido"));
    }
    return next(error);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !UUID_RE.test(payload.sub)
  ) {
    return next(new HttpError(401, "Token de autenticación inválido"));
  }

  req.auth = {
    id: payload.sub,
    usuario: payload.usuario,
    rol: payload.rol,
  };
  req.usuario = req.auth;

  return next();
}

module.exports = { authenticateToken, extraerToken };
