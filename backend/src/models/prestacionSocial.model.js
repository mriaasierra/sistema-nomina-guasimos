"use strict";

const BaseModel = require("./baseModel");

class PrestacionSocialModel extends BaseModel {
  constructor() {
    super({
      table: "prestaciones_sociales",
      label: "Prestación social",
      columns: [
        "id",
        "empleado_id",
        "anio",
        "trimestre",
        "dias_acreditados",
        "sueldo_integral_diario",
        "monto_trimestre",
        "anticipos",
        "intereses_prestaciones",
        "created_at",
      ],
      filters: {
        empleado_id: { column: "empleado_id" },
        anio: { column: "anio" },
        trimestre: { column: "trimestre" },
      },
      defaultOrder: "anio DESC, trimestre DESC",
    });
  }

  findByEmpleado(empleadoId, params = {}) {
    return this.list({ ...params, empleado_id: empleadoId });
  }

  findByAnio(anio, params = {}) {
    return this.list({ ...params, anio });
  }
}

module.exports = new PrestacionSocialModel();
