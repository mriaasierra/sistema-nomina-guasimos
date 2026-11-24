"use strict";

const { Router } = require("express");
const controller = require("../controllers/usuario.controller");
const { validateBody, validateIdParam } = require("../middlewares/validate");
const schemas = require("../middlewares/validationSchemas");

const router = Router();
const schema = schemas.usuarios;

router.get("/email/:email", controller.getByEmail);

router.get("/usuario/:usuario", controller.getByUsuario);

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
