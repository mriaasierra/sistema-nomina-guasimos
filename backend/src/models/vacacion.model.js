"use strict";

const BaseModel = require("./baseModel");

class VacacionModel extends BaseModel {
  constructor() {
    super({
      table: "vacaciones",
      label: "Vacación",
      columns: [
        "id",
        "empleado_id",
        "anio_correspondiente",
        "fecha_inicio",
        "fecha_fin",
        "dias_habiles",
        "dias_pendientes",
        "tipo",
        "estatus",
        "observaciones",
        "created_at",
      ],
      filters: {
        empleado_id: { column: "empleado_id" },
        anio_correspondiente: { column: "anio_correspondiente" },
        estatus: { column: "estatus" },
        tipo: { column: "tipo" },
        desde: { column: "fecha_inicio", op: ">=" },
        hasta: { column: "fecha_fin", op: "<=" },
      },
      searchable: ["estatus", "tipo", "observaciones"],
      defaultOrder: "fecha_inicio DESC",
    });
  }

  findByEmpleado(empleadoId, params = {}) {
    return this.list({ ...params, empleado_id: empleadoId });
  }

  findPendientesByEmpleado(empleadoId, params = {}) {
    return this.list({
      ...params,
      empleado_id: empleadoId,
      estatus: "Pendiente",
    });
  }
}

module.exports = new VacacionModel();
