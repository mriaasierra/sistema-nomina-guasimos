"use strict";

const { Router } = require("express");
const domain = require("../config/domain");
const { authenticateToken } = require("../middlewares/authenticateToken");

const authRoutes = require("./auth.routes");
const oficinaRoutes = require("./oficina.routes");
const cargoRoutes = require("./cargo.routes");
const tipoNominaRoutes = require("./tipoNomina.routes");
const empleadoRoutes = require("./empleado.routes");
const nominaPeriodoRoutes = require("./nominaPeriodo.routes");
const pagoHistorialRoutes = require("./pagoHistorial.routes");
const vacacionRoutes = require("./vacacion.routes");
const bonoEspecialRoutes = require("./bonoEspecial.routes");
const tasaBcvRoutes = require("./tasaBcv.routes");
const usuarioRoutes = require("./usuario.routes");
const auditLogRoutes = require("./auditLog.routes");
const bonoVacacionalRoutes = require("./bonoVacacional.routes");
const prestacionSocialRoutes = require("./prestacionSocial.routes");
const utilidadRoutes = require("./utilidad.routes");
const liquidacionRoutes = require("./liquidacion.routes");

const router = Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    servicio: "Sistema de Nómina · Alcaldía Bolivariana del Municipio Guásimos",
    version: "1.2.0",
    siglas: domain.siglasInstitucionales,
    reglas: {
      primaPorHijo: `${domain.primaPorHijo.toFixed(2).replace(".", ",")} ${domain.primaPorHijoMoneda}`,
      cargosEnSingular: domain.cargosEnSingular,
      tasaBcvSinConexion: domain.tasaBcvFallbackTexto,
    },
    endpoints: [
      "/auth",
      "/oficinas",
      "/cargos",
      "/tipos-nomina",
      "/empleados",
      "/nominas-periodos",
      "/pagos-historial",
      "/vacaciones",
      "/bonos-especiales",
      "/tasa-bcv",
      "/usuarios",
      "/audit-log",
      "/bonos-vacacionales",
      "/prestaciones-sociales",
      "/utilidades",
      "/liquidaciones",
    ],
  });
});

// Autenticación: `/auth/login` es el único endpoint público.
router.use("/auth", authRoutes);

// A partir de aquí todas las rutas requieren un JWT válido.
router.use(authenticateToken);

router.use("/oficinas", oficinaRoutes);
router.use("/cargos", cargoRoutes);
router.use("/tipos-nomina", tipoNominaRoutes);
router.use("/empleados", empleadoRoutes);
router.use("/nominas-periodos", nominaPeriodoRoutes);
router.use("/pagos-historial", pagoHistorialRoutes);
router.use("/vacaciones", vacacionRoutes);
router.use("/bonos-especiales", bonoEspecialRoutes);

// Ruta principal conforme a la tabla real `tasa_bcv`; se conserva
// el alias plural por compatibilidad con integraciones anteriores.
router.use("/tasa-bcv", tasaBcvRoutes);
router.use("/tasas-bcv", tasaBcvRoutes);

router.use("/usuarios", usuarioRoutes);
router.use("/audit-log", auditLogRoutes);
router.use("/bonos-vacacionales", bonoVacacionalRoutes);
router.use("/prestaciones-sociales", prestacionSocialRoutes);
router.use("/utilidades", utilidadRoutes);
router.use("/liquidaciones", liquidacionRoutes);

module.exports = router;
