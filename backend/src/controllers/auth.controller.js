"use strict";

const asyncHandler = require("../middlewares/asyncHandler");
const { HttpError } = require("../utils/httpError");
const { firmarToken } = require("../utils/jwt");
const {
  validarPasswordLogin,
  verifyPassword,
} = require("../utils/password");
const Usuario = require("../models/usuario.model");

function cuerpo(req) {
  return req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body
    : {};
}

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function passwordDe(body) {
  if (typeof body.password === "string") return body.password;
  if (typeof body.contrasena === "string") return body.contrasena;
  return "";
}

/** Proyección pública: nunca incluye `password_hash`. */
function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    usuario: usuario.usuario,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    activo: usuario.activo,
    ultimo_login: usuario.ultimo_login,
  };
}

/**
 * POST /api/auth/login
 * Acepta `identificador` (usuario o correo) y `password`.
 * También admite `usuario`, `email` y `contrasena` por compatibilidad.
 */
const login = asyncHandler(async (req, res) => {
  const body = cuerpo(req);
  const identificador = texto(
    body.identificador ?? body.usuario ?? body.email,
  );
  const password = passwordDe(body);
  const detalles = [];

  if (!identificador) {
    detalles.push({ field: "identificador", message: "es obligatorio" });
  } else if (identificador.length > 200) {
    detalles.push({
      field: "identificador",
      message: "no debe superar 200 caracteres",
    });
  }

  const errorPassword = validarPasswordLogin(password);
  if (errorPassword) {
    detalles.push({ field: "password", message: errorPassword });
  }

  if (detalles.length) {
    throw new HttpError(400, "Datos de entrada inválidos", detalles);
  }

  const usuario = await Usuario.findForAuth(identificador);

  // Mensaje genérico: no se revela si el usuario existe o no.
  if (!usuario) {
    throw new HttpError(401, "Usuario o contraseña incorrectos");
  }

  const coincide = await verifyPassword(password, usuario.password_hash);
  if (!coincide) {
    throw new HttpError(401, "Usuario o contraseña incorrectos");
  }

  if (!usuario.activo) {
    throw new HttpError(
      403,
      "El usuario está inactivo. Comuníquese con el administrador del sistema.",
    );
  }

  const actualizado = await Usuario.registrarAcceso(usuario.id);
  const datos = actualizado || usuario;

  return res.status(200).json({
    ok: true,
    token: firmarToken(datos),
    usuario: usuarioPublico(datos),
  });
});

/**
 * GET /api/auth/me
 * Devuelve los datos actualizados del usuario dueño del token.
 */
const me = asyncHandler(async (req, res) => {
  const usuario = await Usuario.findById(req.auth.id);

  if (!usuario) {
    throw new HttpError(401, "La sesión no corresponde a un usuario válido");
  }

  if (!usuario.activo) {
    throw new HttpError(
      403,
      "El usuario está inactivo. Comuníquese con el administrador del sistema.",
    );
  }

  return res.status(200).json({
    ok: true,
    usuario: usuarioPublico(usuario),
  });
});

module.exports = { login, me, usuarioPublico };
