"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { HttpError } = require("../utils/httpError");
const { ok } = require("../utils/response");
const TipoNomina = require("../models/tipoNomina.model");

const base = createCrudController(TipoNomina, {
  requiredOnCreate: ["codigo", "nombre"],
});

module.exports = {
  ...base,

  listActivas: asyncHandler(async (req, res) => {
    const { rows, total } = await TipoNomina.findActivas();
    return ok(res, rows, { total });
  }),

  getByCodigo: asyncHandler(async (req, res) => {
    const tipoNomina = await TipoNomina.findByCodigo(req.params.codigo);
    if (!tipoNomina) {
      throw new HttpError(404, "Tipo de nómina no encontrado");
    }
    return ok(res, tipoNomina);
  }),
};
