-- ============================================================
-- Sistema de Nómina · Alcaldía Bolivariana del Municipio Guásimos
-- Esquema relacional PostgreSQL 17.4 (15 tablas)
-- Ejecutar con: npm run db:init
-- Idempotente: CREATE TABLE / INDEX IF NOT EXISTS y
-- recreación controlada de llaves foráneas.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS public.audit_log (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id uuid,
    usuario_email text,
    usuario_rol text,
    modulo text NOT NULL,
    accion text NOT NULL,
    entidad_id text,
    detalle jsonb,
    ip text,
    user_agent text
);

CREATE TABLE IF NOT EXISTS public.bonos_especiales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    concepto text NOT NULL,
    fecha_proceso date NOT NULL,
    cuenta_origen text NOT NULL,
    monto_total numeric(14,2) NOT NULL,
    cantidad_beneficiarios integer NOT NULL,
    nombre_archivo text NOT NULL,
    generado_por uuid,
    generado_por_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bonos_vacacionales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id uuid NOT NULL,
    anio smallint NOT NULL,
    dias_bono integer NOT NULL,
    sueldo_base_calculo numeric(14,2) NOT NULL,
    monto_bono numeric(14,2) NOT NULL,
    pagado boolean DEFAULT false NOT NULL,
    fecha_pago date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cargos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL UNIQUE,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tipos_nomina (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo text NOT NULL UNIQUE,
    nombre text NOT NULL UNIQUE,
    frecuencia text DEFAULT 'quincenal'::text NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.oficinas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL UNIQUE,
    activa boolean DEFAULT true NOT NULL,
    codigo text,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id uuid,
    nombre text NOT NULL,
    usuario text NOT NULL UNIQUE,
    email text NOT NULL UNIQUE,
    rol text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ultimo_login timestamp with time zone,
    created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.empleados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cedula text NOT NULL UNIQUE,
    nombres text NOT NULL,
    apellidos text NOT NULL,
    estatus text DEFAULT 'activo'::text NOT NULL,
    fecha_ingreso date NOT NULL,
    sueldo_base numeric(14,2) DEFAULT 0.00 NOT NULL,
    foto_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    fecha_nacimiento date,
    direccion text,
    telefono text,
    correo text,
    banco text,
    numero_cuenta text,
    formacion_academica text,
    hijos_menores integer DEFAULT 0,
    hijos_detalle jsonb,
    emergencia_nombre text,
    emergencia_telefono text,
    emergencia_parentesco text,
    tiene_enfermedad boolean DEFAULT false,
    enfermedad_detalle text,
    talla_pantalon text,
    talla_camisa text,
    talla_zapatos text,
    enfermedad_notas text,
    genero text,
    antiguedad_otras_instituciones integer DEFAULT 0,
    municipio text,
    parroquia text,
    sector text,
    punto_referencia text,
    zona text,
    estado text,
    tipo_vinculacion text NOT NULL,
    aplica_nomina_regular boolean DEFAULT true NOT NULL,
    nivel_tabulador text,
    tiene_hijos boolean DEFAULT false NOT NULL,
    oficina_id uuid REFERENCES public.oficinas(id) ON DELETE RESTRICT,
    cargo_id uuid REFERENCES public.cargos(id) ON DELETE RESTRICT,
    tipo_nomina_id uuid REFERENCES public.tipos_nomina(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.liquidaciones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE RESTRICT,
    fecha_retiro date NOT NULL,
    motivo text,
    sueldo_integral_diario_final numeric(14,2) NOT NULL,
    dias_prestaciones_total numeric(6,2) DEFAULT 0.00,
    dias_vacaciones_pendientes integer DEFAULT 0,
    dias_bono_vacacional_pendientes integer DEFAULT 0,
    dias_utilidades_pendientes integer DEFAULT 0,
    monto_total_prestaciones numeric(14,2) DEFAULT 0.00,
    monto_total_vacaciones_fraccionadas numeric(14,2) DEFAULT 0.00,
    monto_total_bono_vacacional_fraccionado numeric(14,2) DEFAULT 0.00,
    monto_total_utilidades_fraccionadas numeric(14,2) DEFAULT 0.00,
    total_anticipos_deducidos numeric(14,2) DEFAULT 0.00,
    monto_neto_liquidacion numeric(14,2) NOT NULL,
    estatus text DEFAULT 'borrador'::text NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.nominas_periodos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo text NOT NULL,
    fecha_corte date NOT NULL,
    estado text DEFAULT 'abierta'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    anio smallint NOT NULL,
    mes smallint NOT NULL,
    quincena smallint,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    fecha_pago date,
    cantidad_empleados smallint DEFAULT 0 NOT NULL,
    total_asignaciones numeric(14,2) DEFAULT 0.00 NOT NULL,
    total_deducciones numeric(14,2) DEFAULT 0.00 NOT NULL,
    total_neto numeric(14,2) DEFAULT 0.00 NOT NULL,
    config_snapshot jsonb,
    cerrado_por uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
    cerrado_por_email text,
    cerrado_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.pagos_historial (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE RESTRICT,
    periodo_id uuid NOT NULL REFERENCES public.nominas_periodos(id) ON DELETE CASCADE,
    sueldo_base_historico numeric(14,2) NOT NULL,
    total_asignaciones numeric(14,2) DEFAULT 0.00 NOT NULL,
    total_deducciones numeric(14,2) DEFAULT 0.00 NOT NULL,
    neto_pagado numeric(14,2) DEFAULT 0.00 NOT NULL,
    desglose_calculo jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    empleado_snapshot jsonb,
    observaciones text,
    anulado boolean DEFAULT false NOT NULL,
    anulado_at timestamp with time zone,
    anulado_por uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
    anulado_motivo text
);

CREATE TABLE IF NOT EXISTS public.prestaciones_sociales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE RESTRICT,
    anio smallint NOT NULL,
    trimestre smallint NOT NULL CHECK (trimestre >= 1 AND trimestre <= 4),
    dias_acreditados numeric(5,2) NOT NULL,
    sueldo_integral_diario numeric(14,2) NOT NULL,
    monto_trimestre numeric(14,2) NOT NULL,
    anticipos numeric(14,2) DEFAULT 0.00,
    intereses_prestaciones numeric(14,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasa_bcv (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    anio smallint NOT NULL,
    mes smallint NOT NULL CHECK (mes >= 1 AND mes <= 12),
    promedio numeric(14,4),
    activa numeric(14,4),
    pasiva numeric(14,4),
    gaceta_numero text,
    gaceta_fecha date,
    notas text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text,
    UNIQUE (anio, mes)
);

CREATE TABLE IF NOT EXISTS public.utilidades (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE RESTRICT,
    anio smallint NOT NULL,
    dias_pagados integer NOT NULL,
    monto_utilidades numeric(14,2) NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vacaciones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE RESTRICT,
    anio_correspondiente smallint NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    dias_habiles integer NOT NULL,
    dias_pendientes integer DEFAULT 0,
    tipo character varying(50),
    estatus character varying(50) DEFAULT 'pendiente'::character varying NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_usuario_id_fkey;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.bonos_especiales DROP CONSTRAINT IF EXISTS bonos_especiales_generado_por_fkey;
ALTER TABLE public.bonos_especiales ADD CONSTRAINT bonos_especiales_generado_por_fkey FOREIGN KEY (generado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.bonos_vacacionales DROP CONSTRAINT IF EXISTS bonos_vacacionales_empleado_id_fkey;
ALTER TABLE public.bonos_vacacionales ADD CONSTRAINT bonos_vacacionales_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_audit_log_fecha ON public.audit_log USING btree (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_empleados_cargo ON public.empleados USING btree (cargo_id);
CREATE INDEX IF NOT EXISTS idx_empleados_cedula ON public.empleados USING btree (cedula);
CREATE INDEX IF NOT EXISTS idx_empleados_estatus ON public.empleados USING btree (estatus);
CREATE INDEX IF NOT EXISTS idx_empleados_oficina ON public.empleados USING btree (oficina_id);
CREATE INDEX IF NOT EXISTS idx_empleados_tipo_nomina ON public.empleados USING btree (tipo_nomina_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_empleado ON public.liquidaciones USING btree (empleado_id);
CREATE INDEX IF NOT EXISTS idx_pagos_historial_empleado ON public.pagos_historial USING btree (empleado_id);
CREATE INDEX IF NOT EXISTS idx_pagos_historial_periodo ON public.pagos_historial USING btree (periodo_id);
CREATE INDEX IF NOT EXISTS idx_prestaciones_empleado_anio ON public.prestaciones_sociales USING btree (empleado_id, anio);
CREATE INDEX IF NOT EXISTS idx_vacaciones_empleado ON public.vacaciones USING btree (empleado_id);
