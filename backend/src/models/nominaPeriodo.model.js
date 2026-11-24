"use strict";

const BaseModel = require("./baseModel");

class NominaPeriodoModel extends BaseModel {
  constructor() {
    super({
      table: "nominas_periodos",
      label: "Periodo de nómina",
      columns: [
        "id",
        "tipo",
        "fecha_corte",
        "estado",
        "created_at",
        "anio",
        "mes",
        "quincena",
        "fecha_inicio",
        "fecha_fin",
        "fecha_pago",
        "cantidad_empleados",
        "total_asignaciones",
        "total_deducciones",
        "total_neto",
        "config_snapshot",
        "cerrado_por",
        "cerrado_por_email",
        "cerrado_at",
      ],
      filters: {
        tipo: { column: "tipo" },
        estado: { column: "estado" },
        anio: { column: "anio" },
        mes: { column: "mes" },
        quincena: { column: "quincena" },
        cerrado_por: { column: "cerrado_por" },
        desde: { column: "fecha_corte", op: ">=" },
        hasta: { column: "fecha_corte", op: "<=" },
      },
      searchable: ["tipo", "estado", "cerrado_por_email"],
      defaultOrder: "fecha_corte DESC",
      jsonColumns: ["config_snapshot"],
    });
  }

  findByAnioMes(anio, mes) {
    return this.list({ anio, mes, limit: 100, orderBy: "fecha_corte", orderDir: "desc" });
  }

  findByEstado(estado, params = {}) {
    return this.list({ ...params, estado });
  }
}

module.exports = new NominaPeriodoModel();
