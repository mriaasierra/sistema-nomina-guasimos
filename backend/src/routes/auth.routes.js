"use strict";

const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/authenticateToken");

const router = Router();

// Público: único punto de entrada sin JWT.
router.post("/login", controller.login);

// Protegido: datos del usuario autenticado.
router.get("/me", authenticateToken, controller.me);

module.exports = router;
