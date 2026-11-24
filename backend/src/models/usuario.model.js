"use strict";

const BaseModel = require("./baseModel");
const { query } = require("../config/database");

function quote(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

class UsuarioModel extends BaseModel {
  constructor() {
    super({
      table: "usuarios",
      label: "Usuario",
      columns: [
        "id",
        "auth_id",
        "nombre",
        "usuario",
        "email",
        "rol",
        "activo",
        "created_at",
        "ultimo_login",
        "created_by",
      ],
      filters: {
        rol: { column: "rol" },
        activo: { column: "activo" },
        auth_id: { column: "auth_id" },
        created_by: { column: "created_by" },
      },
      searchable: ["nombre", "usuario", "email"],
      defaultOrder: "nombre ASC",
      // Defensa adicional: ninguna consulta CRUD debe devolver el hash.
      hiddenColumns: ["password_hash"],
    });
  }

  findByEmail(email) {
    return this.findOne({ email });
  }

  findByUsuario(usuario) {
    return this.findOne({ usuario });
  }

  findByAuthId(authId) {
    return this.findOne({ auth_id: authId });
  }

  /**
   * Búsqueda exclusiva del login. Es el único método que solicita
   * `password_hash` y solo se usa internamente en el controlador de auth.
   */
  async findForAuth(identificador) {
    const sql = `
      SELECT
        id,
        nombre,
        usuario,
        email,
        rol,
        activo,
        ultimo_login,
        created_at,
        password_hash
      FROM public.usuarios
      WHERE lower(usuario) = lower($1)
         OR lower(email) = lower($1)
      ORDER BY
        CASE WHEN lower(usuario) = lower($1) THEN 0 ELSE 1 END,
        CASE WHEN lower(email) = lower($1) THEN 0 ELSE 1 END
      LIMIT 1
    `;

    return (await query(sql, [identificador])).rows[0] || null;
  }

  /** Actualiza la marca de último acceso y devuelve el usuario sin hash. */
  async registrarAcceso(id) {
    const sql = `
      UPDATE public.usuarios
      SET ultimo_login = NOW()
      WHERE id = $1
      RETURNING ${this.selectClause()}
    `;

    return (await query(sql, [id])).rows[0] || null;
  }

  /** Alta de usuario con contraseña ya hasheada. */
  async createConPassword(payload = {}, passwordHash) {
    const columns = this.columns.filter(
      (column) =>
        column !== "id" &&
        !this.immutableColumns.includes(column) &&
        payload[column] !== undefined,
    );
    const values = columns.map((column) => payload[column]);

    columns.push("password_hash");
    values.push(passwordHash);

    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const sql = `
      INSERT INTO public.usuarios
        (${columns.map(quote).join(", ")})
      VALUES
        (${placeholders.join(", ")})
      RETURNING ${this.selectClause()}
    `;

    return (await query(sql, values)).rows[0] || null;
  }

  /** Edición de usuario con cambio opcional de contraseña. */
  async updateConPassword(id, payload = {}, passwordHash = null) {
    const columns = this.columns.filter(
      (column) =>
        !this.immutableColumns.includes(column) &&
        payload[column] !== undefined,
    );
    const values = columns.map((column) => payload[column]);
    const assignments = columns.map(
      (column, index) => `${quote(column)} = $${index + 1}`,
    );

    if (passwordHash) {
      values.push(passwordHash);
      assignments.push(`"password_hash" = $${values.length}`);
    }

    if (!assignments.length) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE public.usuarios
      SET ${assignments.join(", ")}
      WHERE id = $${values.length}
      RETURNING ${this.selectClause()}
    `;

    return (await query(sql, values)).rows[0] || null;
  }

  /**
   * Asigna contraseña por usuario o correo (case-insensitive).
   * Se usa desde el CLI `npm run set-password`.
   */
  async setPassword(identificador, passwordHash) {
    const sql = `
      UPDATE public.usuarios
      SET password_hash = $1
      WHERE lower(usuario) = lower($2)
         OR lower(email) = lower($2)
      RETURNING ${this.selectClause()}
    `;

    return (await query(sql, [passwordHash, identificador])).rows[0] || null;
  }
}

module.exports = new UsuarioModel();
