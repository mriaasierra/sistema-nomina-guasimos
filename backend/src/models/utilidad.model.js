"use strict";

const BaseModel = require("./baseModel");

class UtilidadModel extends BaseModel {
  constructor() {
    super({
      table: "utilidades",
      label: "Utilidad",
      columns: [
        "id",
        "empleado_id",
        "anio",
        "dias_pagados",
        "monto_utilidades",
        "observaciones",
        "created_at",
      ],
      filters: {
        empleado_id: { column: "empleado_id" },
        anio: { column: "anio" },
      },
      searchable: ["observaciones"],
      defaultOrder: "anio DESC",
    });
  }

  findByEmpleado(empleadoId, params = {}) {
    return this.list({ ...params, empleado_id: empleadoId });
  }

  findByAnio(anio, params = {}) {
    return this.list({ ...params, anio });
  }
}

module.exports = new UtilidadModel();
