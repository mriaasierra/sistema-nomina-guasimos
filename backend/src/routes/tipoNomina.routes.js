"use strict";

const { Router } = require("express");
const controller = require("../controllers/tipoNomina.controller");
const { validateBody, validateIdParam } = require("../middlewares/validate");
const schemas = require("../middlewares/validationSchemas");

const router = Router();
const schema = schemas.tiposNomina;

router.get("/activas", controller.listActivas);

router.get("/codigo/:codigo", controller.getByCodigo);

router.get("/", controller.list);

router.post(
  "/",
  validateBody(schema.fields, schema.requiredOnCreate),
  controller.create,
);

router.get("/:id", validateIdParam("id", "uuid"), controller.getById);

router.put(
  "/:id",
  validateIdParam("id", "uuid"),
  validateBody(schema.fields),
  controller.update,
);

router.patch(
  "/:id",
  validateIdParam("id", "uuid"),
  validateBody(schema.fields),
  controller.update,
);

router.delete("/:id", validateIdParam("id", "uuid"), controller.remove);

module.exports = router;
