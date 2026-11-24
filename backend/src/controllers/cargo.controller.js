"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const Cargo = require("../models/cargo.model");

const base = createCrudController(Cargo, { requiredOnCreate: ["nombre"] });

module.exports = {
  ...base,

  listActivos: asyncHandler(async (req, res) => {
    const { rows, total } = await Cargo.findActivos();
    return ok(res, rows, { total });
  }),
};
