"use strict";

const BaseModel = require("./baseModel");

class BonoEspecialModel extends BaseModel {
  constructor() {
    super({
      table: "bonos_especiales",
      label: "Bono especial",
      columns: [
        "id",
        "concepto",
        "fecha_proceso",
        "cuenta_origen",
        "monto_total",
        "cantidad_beneficiarios",
        "nombre_archivo",
        "generado_por",
        "generado_por_email",
        "created_at",
      ],
      filters: {
        generado_por: { column: "generado_por" },
        desde: { column: "fecha_proceso", op: ">=" },
        hasta: { column: "fecha_proceso", op: "<=" },
      },
      searchable: ["concepto", "cuenta_origen", "nombre_archivo", "generado_por_email"],
      defaultOrder: "fecha_proceso DESC",
    });
  }

  findByGeneradoPor(usuarioId, params = {}) {
    return this.list({ ...params, generado_por: usuarioId });
  }
}

module.exports = new BonoEspecialModel();
