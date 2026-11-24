"use strict";

const bcrypt = require("bcryptjs");

const RONDAS = 12;
const MIN_LENGTH = 8;
const MAX_BYTES = 72; // Límite de entrada de bcrypt.

function validarPasswordNueva(password) {
  if (typeof password !== "string" || password.length === 0) {
    return "es obligatorio";
  }
  if (password.length < MIN_LENGTH) {
    return `debe tener al menos ${MIN_LENGTH} caracteres`;
  }
  if (Buffer.byteLength(password, "utf8") > MAX_BYTES) {
    return `no debe superar ${MAX_BYTES} bytes`;
  }
  return null;
}

function validarPasswordLogin(password) {
  if (typeof password !== "string" || password.length === 0) {
    return "es obligatorio";
  }
  if (Buffer.byteLength(password, "utf8") > MAX_BYTES) {
    return `no debe superar ${MAX_BYTES} bytes`;
  }
  return null;
}

async function hashPassword(password) {
  return bcrypt.hash(password, RONDAS);
}

async function verifyPassword(password, hash) {
  if (
    typeof password !== "string" ||
    password.length === 0 ||
    typeof hash !== "string" ||
    hash.length === 0
  ) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

module.exports = {
  RONDAS,
  MIN_LENGTH,
  MAX_BYTES,
  validarPasswordNueva,
  validarPasswordLogin,
  hashPassword,
  verifyPassword,
};
