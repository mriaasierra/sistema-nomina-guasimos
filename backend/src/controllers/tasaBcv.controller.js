"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { HttpError } = require("../utils/httpError");
const { ok } = require("../utils/response");
const domain = require("../config/domain");
const TasaBcv = require("../models/tasaBcv.model");

const base = createCrudController(TasaBcv, {
  requiredOnCreate: ["anio", "mes"],
});

module.exports = {
  ...base,

  getByPeriodo: asyncHandler(async (req, res) => {
    const anio = Number(req.params.anio);
    const mes = Number(req.params.mes);

    if (!Number.isInteger(anio) || anio < 1900) {
      throw new HttpError(400, "El año debe ser un entero válido");
    }
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
      throw new HttpError(400, "El mes debe ser un entero entre 1 y 12");
    }

    const tasa = await TasaBcv.findByPeriodo(anio, mes);
    if (!tasa) {
      throw new HttpError(
        404,
        `No existe una tasa BCV registrada para ${anio}-${String(mes).padStart(2, "0")}`,
        {
          tasaFallback: domain.tasaBcvFallback,
          textoFallback: domain.tasaBcvFallbackTexto,
        },
      );
    }
    return ok(res, tasa);
  }),

  getVigente: asyncHandler(async (req, res) => {
    const { rows } = await TasaBcv.findVigente();
    if (!rows.length) {
      // Sin conexión o sin registros: el cliente muestra "Bs. 00,00".
      throw new HttpError(404, "No hay tasas BCV registradas", {
        tasaFallback: domain.tasaBcvFallback,
        textoFallback: domain.tasaBcvFallbackTexto,
      });
    }
    return ok(res, rows[0]);
  }),
};
