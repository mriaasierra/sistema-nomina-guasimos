"use strict";

const BaseModel = require("./baseModel");

/**
 * Catálogo de tipos de nómina.
 * `codigo` y `nombre` son únicos; `frecuencia` inicia en 'quincenal'
 * y `activa` en true según el esquema real.
 */
class TipoNominaModel extends BaseModel {
  constructor() {
    super({
      table: "tipos_nomina",
      label: "Tipo de nómina",
      columns: [
        "id",
        "codigo",
        "nombre",
        "frecuencia",
        "activa",
        "descripcion",
        "created_at",
      ],
      filters: {
        activa: { column: "activa" },
        frecuencia: { column: "frecuencia" },
        codigo: { column: "codigo" },
      },
      searchable: ["codigo", "nombre", "descripcion"],
      defaultOrder: "nombre ASC",
    });
  }

  findByCodigo(codigo) {
    return this.findOne({ codigo });
  }

  findActivas(params = {}) {
    return this.list({
      ...params,
      activa: true,
      limit: 500,
      orderBy: "nombre",
      orderDir: "asc",
    });
  }
}

module.exports = new TipoNominaModel();
