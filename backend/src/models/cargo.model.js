"use strict";

const BaseModel = require("./baseModel");

/**
 * Catálogo de cargos. El esquema real solo conserva `nombre`
 * (único y obligatorio), `activo` y `created_at`.
 * Los cargos se muestran en singular: Director, Coordinador, etc.
 */
class CargoModel extends BaseModel {
  constructor() {
    super({
      table: "cargos",
      label: "Cargo",
      columns: ["id", "nombre", "activo", "created_at"],
      filters: {
        activo: { column: "activo" },
      },
      searchable: ["nombre"],
      defaultOrder: "nombre ASC",
    });
  }

  findActivos() {
    return this.list({ activo: true, limit: 500, orderBy: "nombre", orderDir: "asc" });
  }
}

module.exports = new CargoModel();
