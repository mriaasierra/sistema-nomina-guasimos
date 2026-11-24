"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { HttpError } = require("../utils/httpError");
const { ok } = require("../utils/response");
const Empleado = require("../models/empleado.model");
const PagoHistorial = require("../models/pagoHistorial.model");
const Vacacion = require("../models/vacacion.model");
const Liquidacion = require("../models/liquidacion.model");

const base = createCrudController(Empleado, {
  requiredOnCreate: [
    "cedula",
    "nombres",
    "apellidos",
    "fecha_ingreso",
    "tipo_vinculacion",
  ],
});

module.exports = {
  ...base,

  getByCedula: asyncHandler(async (req, res) => {
    const empleado = await Empleado.findByCedula(req.params.cedula);
    if (!empleado) {
      throw new HttpError(404, "Empleado no encontrado");
    }
    return ok(res, empleado);
  }),

  listByTipoNomina: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await Empleado.findByTipoNomina(
      req.params.tipoNominaId,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),

  listPagos: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await PagoHistorial.findByEmpleado(
      req.params.id,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),

  listVacaciones: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await Vacacion.findByEmpleado(
      req.params.id,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),

  listLiquidaciones: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await Liquidacion.findByEmpleado(
      req.params.id,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),
};
