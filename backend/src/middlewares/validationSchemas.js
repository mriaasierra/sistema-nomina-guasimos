"use strict";

/**
 * Reglas de validación por entidad.
 * `fields` describe tipos y `requiredOnCreate` los campos exigidos al crear.
 * En las actualizaciones se reutiliza `fields` sin exigir obligatorios.
 */

const str = (maxLength, minLength) => ({ type: "string", maxLength, minLength });
const num = (min) => ({ type: "number", min });
const int = (min, max) => ({ type: "integer", min, max });
const bool = { type: "boolean" };
const uuid = { type: "uuid" };
const date = { type: "date" };
const json = { type: "json" };

const schemas = {
  oficinas: {
    fields: {
      nombre: str(200),
      activa: bool,
      codigo: str(50),
      descripcion: str(1000),
    },
    requiredOnCreate: ["nombre"],
  },

  cargos: {
    fields: {
      nombre: str(200),
      activo: bool,
    },
    requiredOnCreate: ["nombre"],
  },

  tiposNomina: {
    fields: {
      codigo: str(50),
      nombre: str(200),
      frecuencia: str(50),
      activa: bool,
      descripcion: str(1000),
    },
    requiredOnCreate: ["codigo", "nombre"],
  },

  empleados: {
    fields: {
      cedula: str(50),
      nombres: str(200),
      apellidos: str(200),
      oficina_id: uuid,
      cargo_id: uuid,
      tipo_nomina_id: uuid,
      estatus: str(50),
      fecha_ingreso: date,
      sueldo_base: num(0),
      foto_url: str(500),
      fecha_nacimiento: date,
      direccion: str(500),
      telefono: str(50),
      correo: str(200),
      banco: str(100),
      numero_cuenta: str(50),
      formacion_academica: str(200),
      hijos_menores: int(0),
      hijos_detalle: json,
      emergencia_nombre: str(200),
      emergencia_telefono: str(50),
      emergencia_parentesco: str(100),
      tiene_enfermedad: bool,
      enfermedad_detalle: str(1000),
      talla_pantalon: str(20),
      talla_camisa: str(20),
      talla_zapatos: str(20),
      enfermedad_notas: str(1000),
      genero: str(30),
      antiguedad_otras_instituciones: int(0),
      municipio: str(100),
      parroquia: str(100),
      sector: str(100),
      punto_referencia: str(300),
      zona: str(100),
      estado: str(100),
      tipo_vinculacion: str(50),
      aplica_nomina_regular: bool,
      nivel_tabulador: str(100),
      tiene_hijos: bool,
    },
    requiredOnCreate: [
      "cedula",
      "nombres",
      "apellidos",
      "fecha_ingreso",
      "tipo_vinculacion",
    ],
  },

  nominasPeriodos: {
    fields: {
      tipo: str(50),
      fecha_corte: date,
      estado: str(50),
      anio: int(1900),
      mes: int(1),
      quincena: int(1),
      fecha_inicio: date,
      fecha_fin: date,
      fecha_pago: date,
      cantidad_empleados: int(0),
      total_asignaciones: num(0),
      total_deducciones: num(0),
      total_neto: num(0),
      config_snapshot: json,
      cerrado_por: uuid,
      cerrado_por_email: str(200),
      cerrado_at: date,
    },
    requiredOnCreate: [
      "tipo",
      "fecha_corte",
      "anio",
      "mes",
      "fecha_inicio",
      "fecha_fin",
    ],
  },

  pagosHistorial: {
    fields: {
      empleado_id: uuid,
      periodo_id: uuid,
      sueldo_base_historico: num(0),
      total_asignaciones: num(0),
      total_deducciones: num(0),
      neto_pagado: num(0),
      desglose_calculo: json,
      empleado_snapshot: json,
      observaciones: str(1000),
      anulado: bool,
      anulado_at: date,
      anulado_por: uuid,
      anulado_motivo: str(1000),
    },
    requiredOnCreate: [
      "empleado_id",
      "periodo_id",
      "sueldo_base_historico",
    ],
  },

  vacaciones: {
    fields: {
      empleado_id: uuid,
      anio_correspondiente: int(1900),
      fecha_inicio: date,
      fecha_fin: date,
      dias_habiles: int(0),
      dias_pendientes: int(0),
      tipo: str(50),
      estatus: str(50),
      observaciones: str(1000),
    },
    requiredOnCreate: [
      "empleado_id",
      "anio_correspondiente",
      "fecha_inicio",
      "fecha_fin",
      "dias_habiles",
    ],
  },

  bonosEspeciales: {
    fields: {
      concepto: str(200),
      fecha_proceso: date,
      cuenta_origen: str(100),
      monto_total: num(0),
      cantidad_beneficiarios: int(0),
      nombre_archivo: str(300),
      generado_por: uuid,
      generado_por_email: str(200),
    },
    requiredOnCreate: [
      "concepto",
      "fecha_proceso",
      "cuenta_origen",
      "monto_total",
      "cantidad_beneficiarios",
      "nombre_archivo",
    ],
  },

  tasaBcv: {
    fields: {
      anio: int(1900),
      mes: int(1, 12),
      promedio: num(0),
      activa: num(0),
      pasiva: num(0),
      gaceta_numero: str(100),
      gaceta_fecha: date,
      notas: str(1000),
      updated_by: str(200),
    },
    requiredOnCreate: ["anio", "mes"],
  },

  usuarios: {
    fields: {
      auth_id: uuid,
      nombre: str(200),
      usuario: str(100),
      email: str(200),
      rol: str(50),
      activo: bool,
      password: str(72, 8),
      ultimo_login: date,
      created_by: uuid,
    },
    requiredOnCreate: ["nombre", "usuario", "email", "rol"],
  },

  auditLog: {
    fields: {
      fecha: date,
      usuario_id: uuid,
      usuario_email: str(200),
      usuario_rol: str(50),
      modulo: str(100),
      accion: str(100),
      entidad_id: str(100),
      detalle: json,
      ip: str(100),
      user_agent: str(500),
    },
    requiredOnCreate: ["modulo", "accion"],
  },

  bonosVacacionales: {
    fields: {
      empleado_id: uuid,
      anio: int(1900),
      dias_bono: int(0),
      sueldo_base_calculo: num(0),
      monto_bono: num(0),
      pagado: bool,
      fecha_pago: date,
    },
    requiredOnCreate: [
      "empleado_id",
      "anio",
      "dias_bono",
      "sueldo_base_calculo",
      "monto_bono",
    ],
  },

  prestacionesSociales: {
    fields: {
      empleado_id: uuid,
      anio: int(1900),
      trimestre: int(1, 4),
      dias_acreditados: num(0),
      sueldo_integral_diario: num(0),
      monto_trimestre: num(0),
      anticipos: num(0),
      intereses_prestaciones: num(0),
    },
    requiredOnCreate: [
      "empleado_id",
      "anio",
      "trimestre",
      "dias_acreditados",
      "sueldo_integral_diario",
      "monto_trimestre",
    ],
  },

  utilidades: {
    fields: {
      empleado_id: uuid,
      anio: int(1900),
      dias_pagados: int(0),
      monto_utilidades: num(0),
      observaciones: str(1000),
    },
    requiredOnCreate: [
      "empleado_id",
      "anio",
      "dias_pagados",
      "monto_utilidades",
    ],
  },

  liquidaciones: {
    fields: {
      empleado_id: uuid,
      fecha_retiro: date,
      motivo: str(1000),
      sueldo_integral_diario_final: num(0),
      dias_prestaciones_total: num(0),
      dias_vacaciones_pendientes: int(0),
      dias_bono_vacacional_pendientes: int(0),
      dias_utilidades_pendientes: int(0),
      monto_total_prestaciones: num(0),
      monto_total_vacaciones_fraccionadas: num(0),
      monto_total_bono_vacacional_fraccionado: num(0),
      monto_total_utilidades_fraccionadas: num(0),
      total_anticipos_deducidos: num(0),
      monto_neto_liquidacion: num(0),
      estatus: str(50),
      observaciones: str(1000),
      created_by: uuid,
    },
    requiredOnCreate: [
      "empleado_id",
      "fecha_retiro",
      "sueldo_integral_diario_final",
      "monto_neto_liquidacion",
    ],
  },
};

module.exports = schemas;
