"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const NominaPeriodo = require("../models/nominaPeriodo.model");
const PagoHistorial = require("../models/pagoHistorial.model");

const base = createCrudController(NominaPeriodo, {
  requiredOnCreate: [
    "tipo",
    "fecha_corte",
    "anio",
    "mes",
    "fecha_inicio",
    "fecha_fin",
  ],
});

module.exports = {
  ...base,

  listPagos: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await PagoHistorial.findByPeriodo(
      req.params.id,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),
};
