"use strict";

const { Router } = require("express");
const controller = require("../controllers/cargo.controller");
const { validateBody, validateIdParam } = require("../middlewares/validate");
const schemas = require("../middlewares/validationSchemas");

const router = Router();
const schema = schemas.cargos;

router.get("/activos", controller.listActivos);

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
