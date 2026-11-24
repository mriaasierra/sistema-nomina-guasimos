"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

const ISSUER = "sistema-nomina-guasimos";
const ALGORITHM = "HS256";

function getSecret() {
  const secret = env.jwt.secret;

  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error(
      "JWT_SECRET no está configurado o es demasiado corto (mínimo 32 caracteres).",
    );
  }

  return secret;
}

function firmarToken(usuario) {
  if (!usuario || !usuario.id) {
    throw new Error("No se puede firmar un token sin un usuario válido.");
  }

  return jwt.sign(
    {
      sub: String(usuario.id),
      usuario: usuario.usuario,
      rol: usuario.rol,
    },
    getSecret(),
    {
      expiresIn: env.jwt.expiresIn,
      issuer: ISSUER,
      algorithm: ALGORITHM,
    },
  );
}

function verificarToken(token) {
  return jwt.verify(token, getSecret(), {
    issuer: ISSUER,
    algorithms: [ALGORITHM],
  });
}

module.exports = {
  ISSUER,
  ALGORITHM,
  getSecret,
  firmarToken,
  verificarToken,
};
