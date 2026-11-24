"use strict";

const BaseModel = require("./baseModel");

class AuditLogModel extends BaseModel {
  constructor() {
    super({
      table: "audit_log",
      label: "Registro de auditoría",
      columns: [
        "id",
        "fecha",
        "usuario_id",
        "usuario_email",
        "usuario_rol",
        "modulo",
        "accion",
        "entidad_id",
        "detalle",
        "ip",
        "user_agent",
      ],
      filters: {
        usuario_id: { column: "usuario_id" },
        modulo: { column: "modulo" },
        accion: { column: "accion" },
        entidad_id: { column: "entidad_id" },
        desde: { column: "fecha", op: ">=" },
        hasta: { column: "fecha", op: "<=" },
      },
      searchable: [
        "usuario_email",
        "modulo",
        "accion",
        "entidad_id",
        "ip",
      ],
      defaultOrder: "fecha DESC",
      idColumn: "id",
      immutableColumns: ["id"],
      jsonColumns: ["detalle"],
    });
  }

  findByUsuario(usuarioId, params = {}) {
    return this.list({ ...params, usuario_id: usuarioId });
  }

  findByModulo(modulo, params = {}) {
    return this.list({ ...params, modulo });
  }
}

module.exports = new AuditLogModel();
