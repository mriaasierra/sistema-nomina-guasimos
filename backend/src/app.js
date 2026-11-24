"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const { testConnection } = require("./config/database");
const routes = require("./routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.disable("x-powered-by");

app.use(helmet());

const allowedOrigins = env.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin:
      allowedOrigins.includes("*") || !allowedOrigins.length
        ? true
        : allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    servicio: "sistema-nomina-guasimos-backend",
    entorno: env.nodeEnv,
    fecha: new Date().toISOString(),
  });
});

app.get("/health/db", async (req, res, next) => {
  try {
    const result = await testConnection();
    res.json({ ok: true, baseDatos: "conectada", fechaServidor: result.now });
  } catch (error) {
    next(error);
  }
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
