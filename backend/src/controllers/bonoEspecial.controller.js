"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const BonoEspecial = require("../models/bonoEspecial.model");

const base = createCrudController(BonoEspecial, {
  requiredOnCreate: [
    "concepto",
    "fecha_proceso",
    "cuenta_origen",
    "monto_total",
    "cantidad_beneficiarios",
    "nombre_archivo",
  ],
});

module.exports = {
  ...base,

  listByGeneradoPor: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await BonoEspecial.findByGeneradoPor(
      req.params.usuarioId,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),
};
