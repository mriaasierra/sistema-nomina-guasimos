"use strict";

const BaseModel = require("./baseModel");

/**
 * Tasa oficial del BCV. La tabla real se llama `tasa_bcv` (singular)
 * y tiene UNIQUE (anio, mes) + CHECK (mes entre 1 y 12).
 * Si no hay registros vigentes, el frontend muestra "Bs. 00,00".
 */
class TasaBcvModel extends BaseModel {
  constructor() {
    super({
      table: "tasa_bcv",
      label: "Tasa BCV",
      columns: [
        "id",
        "anio",
        "mes",
        "promedio",
        "activa",
        "pasiva",
        "gaceta_numero",
        "gaceta_fecha",
        "notas",
        "updated_at",
        "updated_by",
      ],
      filters: {
        anio: { column: "anio" },
        mes: { column: "mes" },
        gaceta_numero: { column: "gaceta_numero" },
        updated_by: { column: "updated_by" },
      },
      searchable: ["gaceta_numero", "notas", "updated_by"],
      defaultOrder: "anio DESC, mes DESC",
      immutableColumns: ["id"],
      idColumn: "id",
    });
  }

  findByPeriodo(anio, mes) {
    return this.findOne({ anio, mes });
  }

  findVigente() {
    return this.list({ limit: 1 });
  }

  /**
   * El esquema real no define trigger para `updated_at`; el modelo
   * lo refresca en cada actualización para no depender del cliente.
   */
  async update(id, payload = {}) {
    return super.update(id, { ...payload, updated_at: new Date() });
  }
}

module.exports = new TasaBcvModel();
