"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const Vacacion = require("../models/vacacion.model");

const base = createCrudController(Vacacion, {
  requiredOnCreate: [
    "empleado_id",
    "anio_correspondiente",
    "fecha_inicio",
    "fecha_fin",
    "dias_habiles",
  ],
});

module.exports = {
  ...base,

  listByEmpleado: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await Vacacion.findByEmpleado(
      req.params.empleadoId,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),
};
