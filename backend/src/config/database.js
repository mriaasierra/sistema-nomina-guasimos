"use strict";

const { Pool } = require("pg");
const env = require("./env");

const poolConfig = env.database.connectionString
  ? { connectionString: env.database.connectionString }
  : {
      host: env.database.host,
      port: env.database.port,
      user: env.database.user,
      password: env.database.password,
      database: env.database.name,
    };

const pool = new Pool({
  ...poolConfig,
  max: env.database.poolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: env.database.ssl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (error) => {
  // Un cliente inactivo del pool falló; se registra para diagnóstico.
  console.error("[database] Error inesperado en el pool de PostgreSQL:", error);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

async function testConnection() {
  const result = await pool.query("SELECT NOW() AS now");
  return result.rows[0];
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool,
};
