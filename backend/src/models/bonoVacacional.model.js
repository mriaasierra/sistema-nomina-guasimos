"use strict";

const BaseModel = require("./baseModel");

class BonoVacacionalModel extends BaseModel {
  constructor() {
    super({
      table: "bonos_vacacionales",
      label: "Bono vacacional",
      columns: [
        "id",
        "empleado_id",
        "anio",
        "dias_bono",
        "sueldo_base_calculo",
        "monto_bono",
        "pagado",
        "fecha_pago",
        "created_at",
      ],
      filters: {
        empleado_id: { column: "empleado_id" },
        anio: { column: "anio" },
        pagado: { column: "pagado" },
        desde: { column: "fecha_pago", op: ">=" },
        hasta: { column: "fecha_pago", op: "<=" },
      },
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

module.exports = new BonoVacacionalModel();
