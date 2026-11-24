"use strict";

const BaseModel = require("./baseModel");

/**
 * Personal de la institución.
 * `tipo_nomina_id` reemplaza al antiguo campo de texto `tipo_nomina`
 * y referencia a `tipos_nomina(id)` con ON DELETE RESTRICT.
 */
class EmpleadoModel extends BaseModel {
  constructor() {
    super({
      table: "empleados",
      label: "Empleado",
      columns: [
        "id",
        "cedula",
        "nombres",
        "apellidos",
        "estatus",
        "fecha_ingreso",
        "sueldo_base",
        "foto_url",
        "created_at",
        "fecha_nacimiento",
        "direccion",
        "telefono",
        "correo",
        "banco",
        "numero_cuenta",
        "formacion_academica",
        "hijos_menores",
        "hijos_detalle",
        "emergencia_nombre",
        "emergencia_telefono",
        "emergencia_parentesco",
        "tiene_enfermedad",
        "enfermedad_detalle",
        "talla_pantalon",
        "talla_camisa",
        "talla_zapatos",
        "enfermedad_notas",
        "genero",
        "antiguedad_otras_instituciones",
        "municipio",
        "parroquia",
        "sector",
        "punto_referencia",
        "zona",
        "estado",
        "tipo_vinculacion",
        "aplica_nomina_regular",
        "nivel_tabulador",
        "tiene_hijos",
        "oficina_id",
        "cargo_id",
        "tipo_nomina_id",
      ],
      filters: {
        oficina_id: { column: "oficina_id" },
        cargo_id: { column: "cargo_id" },
        tipo_nomina_id: { column: "tipo_nomina_id" },
        // ILIKE permite aceptar tanto 'activo' (default del esquema) como 'Activo'.
        estatus: { column: "estatus", op: "ILIKE" },
        tipo_vinculacion: { column: "tipo_vinculacion" },
        aplica_nomina_regular: { column: "aplica_nomina_regular" },
        tiene_hijos: { column: "tiene_hijos" },
        genero: { column: "genero" },
        nivel_tabulador: { column: "nivel_tabulador" },
        estado: { column: "estado" },
        municipio: { column: "municipio" },
        parroquia: { column: "parroquia" },
      },
      searchable: ["cedula", "nombres", "apellidos", "correo", "telefono"],
      defaultOrder: "apellidos ASC, nombres ASC",
      jsonColumns: ["hijos_detalle"],
    });
  }

  findByCedula(cedula) {
    return this.findOne({ cedula });
  }

  findByOficina(oficinaId, params = {}) {
    return this.list({ ...params, oficina_id: oficinaId });
  }

  findByCargo(cargoId, params = {}) {
    return this.list({ ...params, cargo_id: cargoId });
  }

  findByTipoNomina(tipoNominaId, params = {}) {
    return this.list({ ...params, tipo_nomina_id: tipoNominaId });
  }

  findActivos(params = {}) {
    return this.list({ ...params, estatus: "activo" });
  }
}

module.exports = new EmpleadoModel();
