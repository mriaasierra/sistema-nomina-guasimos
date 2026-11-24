"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const Oficina = require("../models/oficina.model");

const base = createCrudController(Oficina, { requiredOnCreate: ["nombre"] });

module.exports = {
  ...base,

  listActivas: asyncHandler(async (req, res) => {
    const { rows, total } = await Oficina.findActivas();
    return ok(res, rows, { total });
  }),
};
