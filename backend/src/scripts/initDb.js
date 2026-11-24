"use strict";

const fs = require("fs");
const path = require("path");
const { pool, closePool } = require("../config/database");

const schemaPath = path.resolve(__dirname, "../../database/schema.sql");

async function main() {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`No se encontró el esquema en ${schemaPath}`);
  }

  const sql = fs.readFileSync(schemaPath, "utf8");

  console.log("[db:init] Aplicando esquema relacional...");
  await pool.query(sql);
  console.log("[db:init] Esquema aplicado correctamente.");
}

main()
  .catch((error) => {
    console.error("[db:init] Error al inicializar la base de datos:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
