"use strict";

const { HttpError } = require("../utils/httpError");

function notFound(req, res, next) {
  next(
    new HttpError(
      404,
      `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    ),
  );
}

module.exports = notFound;
