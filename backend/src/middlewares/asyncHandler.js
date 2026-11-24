"use strict";

/**
 * Envuelve controladores async para que cualquier error llegue al
 * manejador centralizado sin repetir try/catch en cada función.
 */
function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
