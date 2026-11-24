"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const PagoHistorial = require("../models/pagoHistorial.model");

const base = createCrudController(PagoHistorial, {
  requiredOnCreate: [
    "empleado_id",
    "periodo_id",
    "sueldo_base_historico",
  ],
});

module.exports = {
  ...base,

  listByEmpleado: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await PagoHistorial.findByEmpleado(
      req.params.empleadoId,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),

  listByPeriodo: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await PagoHistorial.findByPeriodo(
      req.params.periodoId,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),
};
