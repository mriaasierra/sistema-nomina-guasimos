"use strict";

const asyncHandler = require("../middlewares/asyncHandler");
const { HttpError } = require("../utils/httpError");
const { ok, created } = require("../utils/response");

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

/**
 * Genera un controlador CRUD reutilizable para un modelo.
 * Cada entidad puede extenderlo con endpoints propios.
 */
function createCrudController(model, options = {}) {
  const { requiredOnCreate = [] } = options;

  const list = asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await model.list(req.query);
    return ok(res, rows, { total, limit, offset });
  });

  const getById = asyncHandler(async (req, res) => {
    const row = await model.findById(req.params.id);
    if (!row) {
      throw new HttpError(404, `${model.label} no encontrado`);
    }
    return ok(res, row);
  });

  const create = asyncHandler(async (req, res) => {
    const body = req.body || {};

    const missing = requiredOnCreate.filter((field) => isMissing(body[field]));
    if (missing.length) {
      throw new HttpError(
        400,
        "Faltan campos obligatorios",
        missing.map((field) => ({
          field,
          message: "es obligatorio",
        })),
      );
    }

    const row = await model.create(body);
    return created(res, row);
  });

  const update = asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!Object.keys(body).length) {
      throw new HttpError(400, "No se enviaron campos para actualizar");
    }

    const row = await model.update(req.params.id, body);
    if (!row) {
      throw new HttpError(404, `${model.label} no encontrado`);
    }
    return ok(res, row);
  });

  const remove = asyncHandler(async (req, res) => {
    const row = await model.remove(req.params.id);
    if (!row) {
      throw new HttpError(404, `${model.label} no encontrado`);
    }
    return ok(res, row);
  });

  return { list, getById, create, update, remove };
}

module.exports = createCrudController;
