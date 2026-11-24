"use strict";

const { Router } = require("express");
const controller = require("../controllers/empleado.controller");
const { validateBody, validateIdParam } = require("../middlewares/validate");
const schemas = require("../middlewares/validationSchemas");

const router = Router();
const schema = schemas.empleados;

router.get("/cedula/:cedula", controller.getByCedula);

router.get(
  "/tipo-nomina/:tipoNominaId",
  validateIdParam("tipoNominaId", "uuid"),
  controller.listByTipoNomina,
);

router.get("/", controller.list);

router.post(
  "/",
  validateBody(schema.fields, schema.requiredOnCreate),
  controller.create,
);

router.get(
  "/:id/pagos",
  validateIdParam("id", "uuid"),
  controller.listPagos,
);

router.get(
  "/:id/vacaciones",
  validateIdParam("id", "uuid"),
  controller.listVacaciones,
);

router.get(
  "/:id/liquidaciones",
  validateIdParam("id", "uuid"),
  controller.listLiquidaciones,
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
