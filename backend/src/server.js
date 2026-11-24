"use strict";

const app = require("./app");
const env = require("./config/env");
const { testConnection, closePool } = require("./config/database");

const server = app.listen(env.port, () => {
  console.log(
    `[server] API de nómina escuchando en http://localhost:${env.port} (${env.nodeEnv})`,
  );
  console.log(`[server] Documentación de rutas: http://localhost:${env.port}/api`);
});

testConnection()
  .then(() => {
    console.log("[database] Conexión a PostgreSQL verificada correctamente.");
  })
  .catch((error) => {
    console.error(
      "[database] No se pudo verificar la conexión a PostgreSQL:",
      error.message,
    );
    console.error(
      "[database] Revise backend/.env y ejecute `npm run db:init` si la base no existe.",
    );
  });

async function shutdown(signal) {
  console.log(`\n[server] Recibida señal ${signal}. Cerrando servidor...`);

  server.close(async () => {
    try {
      await closePool();
      console.log("[server] Pool de PostgreSQL cerrado. Hasta luego.");
      process.exit(0);
    } catch (error) {
      console.error("[server] Error al cerrar el pool:", error);
      process.exit(1);
    }
  });

  // Fuerza el cierre si alguna conexión queda colgada.
  setTimeout(() => {
    console.error("[server] Cierre forzado por tiempo de espera.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("[server] Promesa rechazada sin manejar:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[server] Excepción no controlada:", error);
  process.exit(1);
});
