"use strict";

const path = require("path");
const dotenv = require("dotenv");

// Carga backend/.env sin depender del directorio desde donde se ejecute el proceso.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  },
  database: {
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST || "localhost",
    port: toNumber(process.env.DB_PORT, 5432),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    name: process.env.DB_NAME || "nomina_guasimos",
    ssl: toBoolean(process.env.DB_SSL, false),
    poolMax: toNumber(process.env.DB_POOL_MAX, 10),
  },
};

module.exports = env;
