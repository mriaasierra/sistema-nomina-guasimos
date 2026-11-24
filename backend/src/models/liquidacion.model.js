"use strict";

const BaseModel = require("./baseModel");

class LiquidacionModel extends BaseModel {
  constructor() {
    super({
      table: "liquidaciones",
      label: "Liquidación",
      columns: [
        "id",
        "empleado_id",
        "fecha_retiro",
        "motivo",
        "sueldo_integral_diario_final",
        "dias_prestaciones_total",
        "dias_vacaciones_pendientes",
        "dias_bono_vacacional_pendientes",
        "dias_utilidades_pendientes",
        "monto_total_prestaciones",
        "monto_total_vacaciones_fraccionadas",
        "monto_total_bono_vacacional_fraccionado",
        "monto_total_utilidades_fraccionadas",
        "total_anticipos_deducidos",
        "monto_neto_liquidacion",
        "estatus",
        "observaciones",
        "created_at",
        "created_by",
      ],
      filters: {
        empleado_id: { column: "empleado_id" },
        estatus: { column: "estatus" },
        created_by: { column: "created_by" },
        desde: { column: "fecha_retiro", op: ">=" },
        hasta: { column: "fecha_retiro", op: "<=" },
      },
      searchable: ["motivo", "estatus", "observaciones"],
      defaultOrder: "created_at DESC",
    });
  }

  findByEmpleado(empleadoId, params = {}) {
    return this.list({ ...params, empleado_id: empleadoId });
  }

  findByEstatus(estatus, params = {}) {
    return this.list({ ...params, estatus });
  }
}

module.exports = new LiquidacionModel();
