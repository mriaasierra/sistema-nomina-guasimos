"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const Utilidad = require("../models/utilidad.model");

const base = createCrudController(Utilidad, {
  requiredOnCreate: [
    "empleado_id",
    "anio",
    "dias_pagados",
    "monto_utilidades",
  ],
});

module.exports = {
  ...base,

  listByEmpleado: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await Utilidad.findByEmpleado(
      req.params.empleadoId,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),
};
