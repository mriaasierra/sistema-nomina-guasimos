"use strict";

const createCrudController = require("./crudController");
const asyncHandler = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const AuditLog = require("../models/auditLog.model");

const base = createCrudController(AuditLog, {
  requiredOnCreate: ["modulo", "accion"],
});

module.exports = {
  ...base,

  listByUsuario: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await AuditLog.findByUsuario(
      req.params.usuarioId,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),

  listByModulo: asyncHandler(async (req, res) => {
    const { rows, total, limit, offset } = await AuditLog.findByModulo(
      req.params.modulo,
      req.query,
    );
    return ok(res, rows, { total, limit, offset });
  }),
};
