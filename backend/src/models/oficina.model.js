"use strict";

const BaseModel = require("./baseModel");

class OficinaModel extends BaseModel {
  constructor() {
    super({
      table: "oficinas",
      label: "Oficina",
      columns: [
        "id",
        "nombre",
        "activa",
        "codigo",
        "descripcion",
        "created_at",
      ],
      filters: {
        activa: { column: "activa" },
        codigo: { column: "codigo" },
      },
      searchable: ["nombre", "codigo", "descripcion"],
      defaultOrder: "nombre ASC",
    });
  }

  findActivas() {
    return this.list({ activa: true, limit: 500, orderBy: "nombre", orderDir: "asc" });
  }
}

module.exports = new OficinaModel();
