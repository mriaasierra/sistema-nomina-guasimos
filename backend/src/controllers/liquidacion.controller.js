"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const Liquidacion = require("../models/liquidacion.model");

const base = createCrudController(Liquidacion, {
  requiredOnCreate: [
    "empleado_id",
    "fecha_retiro",
    "sueldo_integral_diario_final",
    "monto_neto_liquidacion",
  ],
});

module.exports = {
  ...base,

  listByEmpleado: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await Liquidacion.findByEmpleado(
      req.params.empleadoId,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),
};
