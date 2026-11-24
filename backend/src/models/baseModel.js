"use strict";

const { query } = require("../config/database");

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

/**
 * Modelo base con operaciones CRUD parametrizadas.
 * Cada entidad define su tabla, columnas permitidas, filtros y orden.
 * Los nombres de tabla/columna provienen de listas blancas internas,
 * por lo que nunca se interpolan valores del usuario en el SQL.
 */
class BaseModel {
  constructor({
    table,
    label,
    columns,
    filters = {},
    searchable = [],
    defaultOrder = "created_at DESC",
    idColumn = "id",
    immutableColumns = ["id", "created_at"],
    hiddenColumns = [],
    jsonColumns = [],
  }) {
    this.table = table;
    this.label = label;
    this.columns = columns;
    this.filters = filters;
    this.searchable = searchable;
    this.defaultOrder = defaultOrder;
    this.idColumn = idColumn;
    this.immutableColumns = immutableColumns;
    this.hiddenColumns = hiddenColumns;
    this.jsonColumns = jsonColumns;
  }

  /**
   * Normaliza los valores de columnas JSON (`json`/`jsonb`).
   * `node-postgres` serializa objetos/arreglos JS como literales de arreglo
   * de PostgreSQL (`{...}`), que no son JSON válido y provocan un error
   * `22P02` al insertar. Se convierten explícitamente a cadena JSON.
   */
  normalizeValue(column, value) {
    if (
      this.jsonColumns.includes(column) &&
      value !== null &&
      value !== undefined &&
      typeof value === "object"
    ) {
      return JSON.stringify(value);
    }
    return value;
  }

  /**
   * Columnas devueltas por las consultas. Si hay columnas ocultas
   * (p. ej. `password_hash`) se enumeran solo las visibles para que
   * nunca salgan en un SELECT/RETURNING.
   */
  selectClause() {
    if (!this.hiddenColumns.length) return "*";

    const visibles = this.columns.filter(
      (column) => !this.hiddenColumns.includes(column),
    );
    return visibles.map(quoteIdentifier).join(", ");
  }

  buildWhere(params = {}) {
    const clauses = [];
    const values = [];

    for (const [param, definition] of Object.entries(this.filters)) {
      const raw = params[param];
      if (raw === undefined || raw === null || raw === "") continue;

      const column = definition.column || param;
      const operator = definition.op || "=";
      const value = definition.transform ? definition.transform(raw) : raw;

      values.push(value);
      clauses.push(`${quoteIdentifier(column)} ${operator} $${values.length}`);
    }

    if (this.searchable.length && params.q) {
      values.push(`%${params.q}%`);
      const position = values.length;
      const conditions = this.searchable.map(
        (column) => `${quoteIdentifier(column)}::text ILIKE $${position}`,
      );
      clauses.push(`(${conditions.join(" OR ")})`);
    }

    return { clauses, values };
  }

  buildOrder(params = {}) {
    const column = this.columns.includes(params.orderBy)
      ? params.orderBy
      : null;
    const direction =
      String(params.orderDir || "").toLowerCase() === "asc" ? "ASC" : "DESC";

    if (column) {
      return `${quoteIdentifier(column)} ${direction}`;
    }

    return this.defaultOrder;
  }

  async list(params = {}) {
    const { clauses, values } = this.buildWhere(params);
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 500);
    const offset = Math.max(Number(params.offset) || 0, 0);
    const order = this.buildOrder(params);

    const listSql = `
      SELECT ${this.selectClause()}
      FROM ${quoteIdentifier(this.table)}
      ${where}
      ORDER BY ${order}
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const rows = (await query(listSql, [...values, limit, offset])).rows;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM ${quoteIdentifier(this.table)}
      ${where}
    `;
    const total = (await query(countSql, values)).rows[0]?.total ?? rows.length;

    return { rows, total, limit, offset };
  }

  async findById(id) {
    const sql = `
      SELECT ${this.selectClause()}
      FROM ${quoteIdentifier(this.table)}
      WHERE ${quoteIdentifier(this.idColumn)} = $1
      LIMIT 1
    `;
    return (await query(sql, [id])).rows[0] || null;
  }

  async findOne(where = {}) {
    const columns = Object.keys(where).filter(
      (column) => this.columns.includes(column) && where[column] !== undefined,
    );

    if (!columns.length) return null;

    const clauses = columns.map(
      (column, index) => `${quoteIdentifier(column)} = $${index + 1}`,
    );
    const sql = `
      SELECT ${this.selectClause()}
      FROM ${quoteIdentifier(this.table)}
      WHERE ${clauses.join(" AND ")}
      LIMIT 1
    `;

    return (
      (await query(sql, columns.map((column) => where[column]))).rows[0] || null
    );
  }

  async create(payload = {}) {
    const columns = [];
    const values = [];

    for (const column of this.columns) {
      if (column !== "id" && this.immutableColumns.includes(column)) continue;
      if (payload[column] === undefined) continue;
      columns.push(column);
      values.push(this.normalizeValue(column, payload[column]));
    }

    if (!columns.length) {
      const sql = `
        INSERT INTO ${quoteIdentifier(this.table)}
        DEFAULT VALUES
        RETURNING ${this.selectClause()}
      `;
      return (await query(sql)).rows[0];
    }

    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const sql = `
      INSERT INTO ${quoteIdentifier(this.table)}
        (${columns.map(quoteIdentifier).join(", ")})
      VALUES
        (${placeholders.join(", ")})
      RETURNING ${this.selectClause()}
    `;

    return (await query(sql, values)).rows[0];
  }

  async update(id, payload = {}) {
    const columns = [];
    const values = [];

    for (const column of this.columns) {
      if (this.immutableColumns.includes(column)) continue;
      if (payload[column] === undefined) continue;
      columns.push(column);
      values.push(this.normalizeValue(column, payload[column]));
    }

    if (!columns.length) return this.findById(id);

    const assignments = columns.map(
      (column, index) => `${quoteIdentifier(column)} = $${index + 1}`,
    );
    values.push(id);

    const sql = `
      UPDATE ${quoteIdentifier(this.table)}
      SET ${assignments.join(", ")}
      WHERE ${quoteIdentifier(this.idColumn)} = $${values.length}
      RETURNING ${this.selectClause()}
    `;

    return (await query(sql, values)).rows[0] || null;
  }

  async remove(id) {
    const sql = `
      DELETE FROM ${quoteIdentifier(this.table)}
      WHERE ${quoteIdentifier(this.idColumn)} = $1
      RETURNING ${this.selectClause()}
    `;
    return (await query(sql, [id])).rows[0] || null;
  }
}

module.exports = BaseModel;
