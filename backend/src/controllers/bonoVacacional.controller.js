"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const BonoVacacional = require("../models/bonoVacacional.model");

const base = createCrudController(BonoVacacional, {
  requiredOnCreate: [
    "empleado_id",
    "anio",
    "dias_bono",
    "sueldo_base_calculo",
    "monto_bono",
  ],
});

module.exports = {
  ...base,

  listByEmpleado: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } =
      await BonoVacacional.findByEmpleado(req.params.empleadoId, req.query);
    return ok(res, rows, { total, limit, offset });
  }),
};
