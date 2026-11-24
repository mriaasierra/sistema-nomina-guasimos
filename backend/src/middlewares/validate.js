"use strict";

const { HttpError } = require("../utils/httpError");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkValue(field, value, rules) {
  const { type } = rules;

  if (rules.enum && !rules.enum.includes(value)) {
    return {
      field,
      message: `debe ser uno de: ${rules.enum.join(", ")}`,
    };
  }

  if (type === "string") {
    if (typeof value !== "string") {
      return { field, message: "debe ser una cadena de texto" };
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        field,
        message: `no debe superar ${rules.maxLength} caracteres`,
      };
    }
    if (rules.minLength && value.length < rules.minLength) {
      return {
        field,
        message: `debe tener al menos ${rules.minLength} caracteres`,
      };
    }
  }

  if (type === "uuid") {
    if (typeof value !== "string" || !UUID_RE.test(value)) {
      return { field, message: "debe ser un UUID válido" };
    }
  }

  if (type === "number") {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      return { field, message: "debe ser un número válido" };
    }
    if (rules.min !== undefined && numeric < rules.min) {
      return { field, message: `debe ser mayor o igual a ${rules.min}` };
    }
    if (rules.max !== undefined && numeric > rules.max) {
      return { field, message: `debe ser menor o igual a ${rules.max}` };
    }
  }

  if (type === "integer") {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(numeric)) {
      return { field, message: "debe ser un número entero" };
    }
    if (rules.min !== undefined && numeric < rules.min) {
      return { field, message: `debe ser mayor o igual a ${rules.min}` };
    }
    if (rules.max !== undefined && numeric > rules.max) {
      return { field, message: `debe ser menor o igual a ${rules.max}` };
    }
  }

  if (type === "boolean") {
    if (typeof value !== "boolean") {
      return { field, message: "debe ser verdadero o falso" };
    }
  }

  if (type === "date") {
    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
      return {
        field,
        message: "debe ser una fecha válida (ISO 8601, p. ej. 2026-11-22)",
      };
    }
  }

  if (type === "json") {
    if (!isPlainObject(value) && !Array.isArray(value)) {
      return { field, message: "debe ser un objeto o arreglo JSON" };
    }
  }

  return null;
}

/**
 * Valida el cuerpo de la petición contra un mapa de reglas.
 * `required` contiene los campos obligatorios en la creación.
 */
function validateBody(fields = {}, required = []) {
  return function validateBodyMiddleware(req, res, next) {
    const body = isPlainObject(req.body) ? req.body : {};
    const errors = [];

    for (const field of required) {
      const value = body[field];
      if (value === undefined || value === null || value === "") {
        errors.push({ field, message: "es obligatorio" });
      }
    }

    for (const [field, rules] of Object.entries(fields)) {
      const value = body[field];
      if (value === undefined || value === null) continue;
      const error = checkValue(field, value, rules);
      if (error) errors.push(error);
    }

    if (errors.length) {
      return next(new HttpError(400, "Datos de entrada inválidos", errors));
    }

    return next();
  };
}

/**
 * Valida el parámetro :id según el tipo de clave primaria de la tabla.
 */
function validateIdParam(param = "id", type = "uuid") {
  return function validateIdParamMiddleware(req, res, next) {
    const value = req.params[param];

    if (type === "integer") {
      if (!/^\d+$/.test(String(value))) {
        return next(
          new HttpError(400, `El parámetro '${param}' debe ser un entero válido`),
        );
      }
      return next();
    }

    if (!UUID_RE.test(String(value))) {
      return next(
        new HttpError(400, `El parámetro '${param}' debe ser un UUID válido`),
      );
    }

    return next();
  };
}

module.exports = {
  UUID_RE,
  validateBody,
  validateIdParam,
};
