"use strict";

const { Router } = require("express");
const controller = require("../controllers/auditLog.controller");
const { validateBody, validateIdParam } = require("../middlewares/validate");
const schemas = require("../middlewares/validationSchemas");

const router = Router();
const schema = schemas.auditLog;

router.get(
  "/usuario/:usuarioId",
  validateIdParam("usuarioId", "uuid"),
  controller.listByUsuario,
);

router.get("/modulo/:modulo", controller.listByModulo);

router.get("/", controller.list);

router.post(
  "/",
  validateBody(schema.fields, schema.requiredOnCreate),
  controller.create,
);

router.get("/:id", validateIdParam("id", "integer"), controller.getById);

router.put(
  "/:id",
  validateIdParam("id", "integer"),
  validateBody(schema.fields),
  controller.update,
);

router.patch(
  "/:id",
  validateIdParam("id", "integer"),
  validateBody(schema.fields),
  controller.update,
);

router.delete("/:id", validateIdParam("id", "integer"), controller.remove);

module.exports = router;
