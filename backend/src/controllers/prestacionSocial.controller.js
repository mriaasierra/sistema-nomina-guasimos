"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const PrestacionSocial = require("../models/prestacionSocial.model");

const base = createCrudController(PrestacionSocial, {
  requiredOnCreate: [
    "empleado_id",
    "anio",
    "trimestre",
    "dias_acreditados",
    "sueldo_integral_diario",
    "monto_trimestre",
  ],
});

module.exports = {
  ...base,

  listByEmpleado: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } =
      await PrestacionSocial.findByEmpleado(req.params.empleadoId, req.query);
    return ok(res, rows, { total, limit, offset });
  }),
};
