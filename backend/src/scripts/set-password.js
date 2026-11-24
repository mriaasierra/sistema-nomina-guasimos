"use strict";

const Usuario = require("../models/usuario.model");
const { closePool } = require("../config/database");
const {
  hashPassword,
  validarPasswordNueva,
} = require("../utils/password");

function mostrarUso() {
  console.log(`
Uso:
  npm run set-password -- <usuario|email> "<nueva contraseña>"

También puede omitir la contraseña y definirla en la variable de entorno
NUEVA_PASSWORD para no dejarla en el historial del shell:

  $env:NUEVA_PASSWORD = "MiClaveSegura123"
  npm run set-password -- usuario@guasimos.gob.ve
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    mostrarUso();
    return;
  }

  const identificador = String(args[0] || "").trim();
  const password = args[1] || process.env.NUEVA_PASSWORD || "";

  if (!identificador || !password) {
    mostrarUso();
    process.exitCode = 1;
    return;
  }

  const errorPassword = validarPasswordNueva(password);
  if (errorPassword) {
    console.error(`[set-password] Contraseña inválida: ${errorPassword}.`);
    process.exitCode = 1;
    return;
  }

  const hash = await hashPassword(password);
  const actualizado = await Usuario.setPassword(identificador, hash);

  if (!actualizado) {
    console.error(
      `[set-password] No se encontró un usuario con '${identificador}'.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `[set-password] Contraseña actualizada para ${actualizado.usuario} (${actualizado.email}).`,
  );
}

main()
  .catch((error) => {
    console.error("[set-password] Error:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
