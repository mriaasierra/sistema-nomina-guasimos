"use strict";

const BaseModel = require("./baseModel");

class PagoHistorialModel extends BaseModel {
  constructor() {
    super({
      table: "pagos_historial",
      label: "Pago de nómina",
      columns: [
        "id",
        "empleado_id",
        "periodo_id",
        "sueldo_base_historico",
        "total_asignaciones",
        "total_deducciones",
        "neto_pagado",
        "desglose_calculo",
        "created_at",
        "empleado_snapshot",
        "observaciones",
        "anulado",
        "anulado_at",
        "anulado_por",
        "anulado_motivo",
      ],
      filters: {
        empleado_id: { column: "empleado_id" },
        periodo_id: { column: "periodo_id" },
        anulado: { column: "anulado" },
        anulado_por: { column: "anulado_por" },
        desde: { column: "created_at", op: ">=" },
        hasta: { column: "created_at", op: "<=" },
      },
      searchable: ["observaciones", "anulado_motivo"],
      defaultOrder: "created_at DESC",
      jsonColumns: ["desglose_calculo", "empleado_snapshot"],
    });
  }

  findByEmpleado(empleadoId, params = {}) {
    return this.list({ ...params, empleado_id: empleadoId });
  }

  findByPeriodo(periodoId, params = {}) {
    return this.list({ ...params, periodo_id: periodoId });
  }
}

module.exports = new PagoHistorialModel();
