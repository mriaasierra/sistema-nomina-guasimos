"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { HttpError } = require("../utils/httpError");
const { ok, created } = require("../utils/response");
const {
  hashPassword,
  validarPasswordNueva,
} = require("../utils/password");
const Usuario = require("../models/usuario.model");

const requiredOnCreate = ["nombre", "usuario", "email", "rol"];

const base = createCrudController(Usuario, { requiredOnCreate });

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

/**
 * Separa la contraseña en texto plano del resto del payload.
 * `password_hash` nunca se acepta directamente desde la API.
 */
function separarCuerpo(body = {}) {
  const payload = { ...body };
  const tienePassword =
    Object.prototype.hasOwnProperty.call(body, "password") ||
    Object.prototype.hasOwnProperty.call(body, "contrasena");

  let password = null;
  if (tienePassword) {
    password = body.password ?? body.contrasena;
  }

  delete payload.password;
  delete payload.contrasena;
  delete payload.password_hash;

  return { payload, password, tienePassword };
}

async function hashDePassword(password) {
  const error = validarPasswordNueva(password);
  if (error) {
    throw new HttpError(400, "Datos de entrada inválidos", [
      { field: "password", message: error },
    ]);
  }
  return hashPassword(password);
}

const create = asyncHandler(async (req, res) => {
  const body =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : {};
  const { payload, password, tienePassword } = separarCuerpo(body);

  const missing = requiredOnCreate.filter((field) => isMissing(payload[field]));
  if (missing.length) {
    throw new HttpError(
      400,
      "Faltan campos obligatorios",
      missing.map((field) => ({ field, message: "es obligatorio" })),
    );
  }

  if (tienePassword && typeof password !== "string") {
    throw new HttpError(400, "Datos de entrada inválidos", [
      { field: "password", message: "debe ser una cadena de texto" },
    ]);
  }

  const hash = tienePassword ? await hashDePassword(password) : null;
  const row = hash
    ? await Usuario.createConPassword(payload, hash)
    : await Usuario.create(payload);

  return created(res, row);
});

const update = asyncHandler(async (req, res) => {
  const body =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : {};
  const { payload, password, tienePassword } = separarCuerpo(body);

  if (!Object.keys(payload).length && !tienePassword) {
    throw new HttpError(400, "No se enviaron campos para actualizar");
  }

  if (tienePassword && typeof password !== "string") {
    throw new HttpError(400, "Datos de entrada inválidos", [
      { field: "password", message: "debe ser una cadena de texto" },
    ]);
  }

  const hash = tienePassword ? await hashDePassword(password) : null;
  const row = hash
    ? await Usuario.updateConPassword(req.params.id, payload, hash)
    : await Usuario.update(req.params.id, payload);

  if (!row) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  return ok(res, row);
});

module.exports = {
  ...base,
  create,
  update,

  getByEmail: asyncHandler(async (req, res) => {
    const usuario = await Usuario.findByEmail(req.params.email);
    if (!usuario) {
      throw new HttpError(404, "Usuario no encontrado");
    }
    return ok(res, usuario);
  }),

  getByUsuario: asyncHandler(async (req, res) => {
    const usuario = await Usuario.findByUsuario(req.params.usuario);
    if (!usuario) {
      throw new HttpError(404, "Usuario no encontrado");
    }
    return ok(res, usuario);
  }),
};
