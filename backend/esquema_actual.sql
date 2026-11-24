--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id bigint NOT NULL,
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


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_log ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bonos_especiales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bonos_especiales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


ALTER TABLE public.bonos_especiales OWNER TO postgres;

--
-- Name: bonos_vacacionales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bonos_vacacionales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empleado_id uuid NOT NULL,
    anio smallint NOT NULL,
    dias_bono integer NOT NULL,
    sueldo_base_calculo numeric(14,2) NOT NULL,
    monto_bono numeric(14,2) NOT NULL,
    pagado boolean DEFAULT false NOT NULL,
    fecha_pago date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bonos_vacacionales OWNER TO postgres;

--
-- Name: cargos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cargos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cargos OWNER TO postgres;

--
-- Name: empleados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empleados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cedula text NOT NULL,
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
    oficina_id uuid,
    cargo_id uuid,
    tipo_nomina_id uuid
);


ALTER TABLE public.empleados OWNER TO postgres;

--
-- Name: liquidaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.liquidaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empleado_id uuid NOT NULL,
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
    created_by uuid
);


ALTER TABLE public.liquidaciones OWNER TO postgres;

--
-- Name: nominas_periodos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nominas_periodos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    cerrado_por uuid,
    cerrado_por_email text,
    cerrado_at timestamp with time zone
);


ALTER TABLE public.nominas_periodos OWNER TO postgres;

--
-- Name: oficinas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oficinas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    codigo text,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oficinas OWNER TO postgres;

--
-- Name: pagos_historial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pagos_historial (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empleado_id uuid NOT NULL,
    periodo_id uuid NOT NULL,
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
    anulado_por uuid,
    anulado_motivo text
);


ALTER TABLE public.pagos_historial OWNER TO postgres;

--
-- Name: prestaciones_sociales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prestaciones_sociales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empleado_id uuid NOT NULL,
    anio smallint NOT NULL,
    trimestre smallint NOT NULL,
    dias_acreditados numeric(5,2) NOT NULL,
    sueldo_integral_diario numeric(14,2) NOT NULL,
    monto_trimestre numeric(14,2) NOT NULL,
    anticipos numeric(14,2) DEFAULT 0.00,
    intereses_prestaciones numeric(14,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT prestaciones_sociales_trimestre_check CHECK (((trimestre >= 1) AND (trimestre <= 4)))
);


ALTER TABLE public.prestaciones_sociales OWNER TO postgres;

--
-- Name: tasa_bcv; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasa_bcv (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    anio smallint NOT NULL,
    mes smallint NOT NULL,
    promedio numeric(14,4),
    activa numeric(14,4),
    pasiva numeric(14,4),
    gaceta_numero text,
    gaceta_fecha date,
    notas text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text,
    CONSTRAINT tasa_bcv_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


ALTER TABLE public.tasa_bcv OWNER TO postgres;

--
-- Name: tipos_nomina; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_nomina (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    frecuencia text DEFAULT 'quincenal'::text NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tipos_nomina OWNER TO postgres;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    auth_id uuid,
    nombre text NOT NULL,
    usuario text NOT NULL,
    email text NOT NULL,
    rol text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ultimo_login timestamp with time zone,
    created_by uuid
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: utilidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empleado_id uuid NOT NULL,
    anio smallint NOT NULL,
    dias_pagados integer NOT NULL,
    monto_utilidades numeric(14,2) NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.utilidades OWNER TO postgres;

--
-- Name: vacaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vacaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empleado_id uuid NOT NULL,
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


ALTER TABLE public.vacaciones OWNER TO postgres;

--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: bonos_especiales bonos_especiales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bonos_especiales
    ADD CONSTRAINT bonos_especiales_pkey PRIMARY KEY (id);


--
-- Name: bonos_vacacionales bonos_vacacionales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bonos_vacacionales
    ADD CONSTRAINT bonos_vacacionales_pkey PRIMARY KEY (id);


--
-- Name: cargos cargos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_nombre_key UNIQUE (nombre);


--
-- Name: cargos cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_pkey PRIMARY KEY (id);


--
-- Name: empleados empleados_cedula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_cedula_key UNIQUE (cedula);


--
-- Name: empleados empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id);


--
-- Name: liquidaciones liquidaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.liquidaciones
    ADD CONSTRAINT liquidaciones_pkey PRIMARY KEY (id);


--
-- Name: nominas_periodos nominas_periodos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nominas_periodos
    ADD CONSTRAINT nominas_periodos_pkey PRIMARY KEY (id);


--
-- Name: oficinas oficinas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oficinas
    ADD CONSTRAINT oficinas_nombre_key UNIQUE (nombre);


--
-- Name: oficinas oficinas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oficinas
    ADD CONSTRAINT oficinas_pkey PRIMARY KEY (id);


--
-- Name: pagos_historial pagos_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_historial
    ADD CONSTRAINT pagos_historial_pkey PRIMARY KEY (id);


--
-- Name: prestaciones_sociales prestaciones_sociales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestaciones_sociales
    ADD CONSTRAINT prestaciones_sociales_pkey PRIMARY KEY (id);


--
-- Name: tasa_bcv tasa_bcv_anio_mes_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasa_bcv
    ADD CONSTRAINT tasa_bcv_anio_mes_key UNIQUE (anio, mes);


--
-- Name: tasa_bcv tasa_bcv_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasa_bcv
    ADD CONSTRAINT tasa_bcv_pkey PRIMARY KEY (id);


--
-- Name: tipos_nomina tipos_nomina_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_nomina
    ADD CONSTRAINT tipos_nomina_codigo_key UNIQUE (codigo);


--
-- Name: tipos_nomina tipos_nomina_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_nomina
    ADD CONSTRAINT tipos_nomina_nombre_key UNIQUE (nombre);


--
-- Name: tipos_nomina tipos_nomina_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_nomina
    ADD CONSTRAINT tipos_nomina_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- Name: utilidades utilidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilidades
    ADD CONSTRAINT utilidades_pkey PRIMARY KEY (id);


--
-- Name: vacaciones vacaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacaciones
    ADD CONSTRAINT vacaciones_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_log_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_fecha ON public.audit_log USING btree (fecha DESC);


--
-- Name: idx_empleados_cargo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_cargo ON public.empleados USING btree (cargo_id);


--
-- Name: idx_empleados_cedula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_cedula ON public.empleados USING btree (cedula);


--
-- Name: idx_empleados_estatus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_estatus ON public.empleados USING btree (estatus);


--
-- Name: idx_empleados_oficina; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_oficina ON public.empleados USING btree (oficina_id);


--
-- Name: idx_empleados_tipo_nomina; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_tipo_nomina ON public.empleados USING btree (tipo_nomina_id);


--
-- Name: idx_liquidaciones_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_liquidaciones_empleado ON public.liquidaciones USING btree (empleado_id);


--
-- Name: idx_pagos_historial_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagos_historial_empleado ON public.pagos_historial USING btree (empleado_id);


--
-- Name: idx_pagos_historial_periodo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagos_historial_periodo ON public.pagos_historial USING btree (periodo_id);


--
-- Name: idx_prestaciones_empleado_anio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestaciones_empleado_anio ON public.prestaciones_sociales USING btree (empleado_id, anio);


--
-- Name: idx_vacaciones_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vacaciones_empleado ON public.vacaciones USING btree (empleado_id);


--
-- Name: audit_log audit_log_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: bonos_especiales bonos_especiales_generado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bonos_especiales
    ADD CONSTRAINT bonos_especiales_generado_por_fkey FOREIGN KEY (generado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: bonos_vacacionales bonos_vacacionales_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bonos_vacacionales
    ADD CONSTRAINT bonos_vacacionales_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE RESTRICT;


--
-- Name: empleados empleados_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE RESTRICT;


--
-- Name: empleados empleados_oficina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE RESTRICT;


--
-- Name: empleados empleados_tipo_nomina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_tipo_nomina_id_fkey FOREIGN KEY (tipo_nomina_id) REFERENCES public.tipos_nomina(id) ON DELETE RESTRICT;


--
-- Name: liquidaciones liquidaciones_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.liquidaciones
    ADD CONSTRAINT liquidaciones_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: liquidaciones liquidaciones_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.liquidaciones
    ADD CONSTRAINT liquidaciones_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE RESTRICT;


--
-- Name: nominas_periodos nominas_periodos_cerrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nominas_periodos
    ADD CONSTRAINT nominas_periodos_cerrado_por_fkey FOREIGN KEY (cerrado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: pagos_historial pagos_historial_anulado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_historial
    ADD CONSTRAINT pagos_historial_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: pagos_historial pagos_historial_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_historial
    ADD CONSTRAINT pagos_historial_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE RESTRICT;


--
-- Name: pagos_historial pagos_historial_periodo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_historial
    ADD CONSTRAINT pagos_historial_periodo_id_fkey FOREIGN KEY (periodo_id) REFERENCES public.nominas_periodos(id) ON DELETE CASCADE;


--
-- Name: prestaciones_sociales prestaciones_sociales_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestaciones_sociales
    ADD CONSTRAINT prestaciones_sociales_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE RESTRICT;


--
-- Name: usuarios usuarios_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: utilidades utilidades_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilidades
    ADD CONSTRAINT utilidades_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE RESTRICT;


--
-- Name: vacaciones vacaciones_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacaciones
    ADD CONSTRAINT vacaciones_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

