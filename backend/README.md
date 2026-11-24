# Backend · Sistema de Nómina Guásimos

API REST del sistema de nómina de la **Alcaldía Bolivariana del Municipio Guásimos**, construida con **Node.js + Express + PostgreSQL 17.4**.

La carpeta `frontend/` no fue modificada: este backend vive de forma independiente en `backend/` y ya está sincronizado con el esquema real de la base de datos (15 tablas).

La API incorpora autenticación con **bcryptjs** y **JWT**: los usuarios se validan contra `public.usuarios.password_hash` y las rutas protegidas exigen `Authorization: Bearer <token>`.

## Requisitos

- Node.js 18.18 o superior
- PostgreSQL 17.4 (con extensión `pgcrypto` para `gen_random_uuid()`)

## Puesta en marcha

```bash
cd backend
npm install
copy .env.example .env      # Windows
# cp .env.example .env      # Linux / macOS
```

Edite `.env` con sus credenciales de PostgreSQL y configure `JWT_SECRET` con una cadena larga y aleatoria (mínimo 32 caracteres). Puede generarla así:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Luego cree el esquema y arranque el servidor:

```bash
npm run db:init
npm run dev
```

La API queda disponible en `http://localhost:4000` (configurable con `PORT`).

- `GET /health` → estado del servicio
- `GET /health/db` → verificación de conexión a PostgreSQL
- `GET /api` → índice de módulos, siglas y reglas de dominio
- `POST /api/auth/login` → inicio de sesión (público)
- `GET /api/auth/me` → usuario autenticado (requiere JWT)

> `database/schema.sql` es idempotente para creación (`CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`). Si ya existe una base creada con la versión anterior, aplique los cambios estructurales (tabla `tipos_nomina`, `empleados.tipo_nomina_id`, simplificación de `cargos`, renombre a `tasa_bcv`) con una migración controlada antes de ejecutar `npm run db:init`.

## Estructura

```text
backend/
├── database/
│   └── schema.sql              # DDL exacto de las 15 tablas, FK e índices
├── src/
│   ├── app.js                  # Configuración de Express
│   ├── server.js               # Arranque y cierre ordenado
│   ├── config/
│   │   ├── env.js              # Variables de entorno
│   │   ├── database.js         # Pool de PostgreSQL
│   │   └── domain.js           # P.I.E., prima por hijo, fallback BCV
│   ├── middlewares/
│   │   ├── asyncHandler.js
│   │   ├── authenticateToken.js # Verificación de JWT (Bearer)
│   │   ├── errorHandler.js     # Errores centralizados (incluye códigos PG)
│   │   ├── notFound.js         # 404
│   │   ├── validate.js         # Validación de body y parámetros UUID/enteros
│   │   └── validationSchemas.js
│   ├── models/                 # Un modelo por entidad (15 tablas)
│   │   ├── baseModel.js
│   │   ├── oficina.model.js
│   │   ├── cargo.model.js
│   │   ├── tipoNomina.model.js
│   │   ├── empleado.model.js
│   │   ├── nominaPeriodo.model.js
│   │   ├── pagoHistorial.model.js
│   │   ├── vacacion.model.js
│   │   ├── bonoEspecial.model.js
│   │   ├── tasaBcv.model.js
│   │   ├── usuario.model.js
│   │   ├── auditLog.model.js
│   │   ├── bonoVacacional.model.js
│   │   ├── prestacionSocial.model.js
│   │   ├── utilidad.model.js
│   │   └── liquidacion.model.js
│   ├── controllers/            # auth + un controlador por entidad
│   │   └── auth.controller.js
│   ├── routes/                 # auth + un router por entidad
│   │   └── auth.routes.js
│   ├── utils/
│   │   ├── jwt.js              # Firma y verificación de tokens
│   │   └── password.js         # Hash y comparación con bcryptjs
│   └── scripts/
│       ├── initDb.js           # Aplica database/schema.sql
│       └── set-password.js     # Asigna contraseña a usuarios existentes
├── .env.example
├── package.json
└── README.md
```

## Módulos y endpoints

Cada módulo expone el CRUD estándar:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/{modulo}` | Listado con filtros y paginación |
| `GET` | `/api/{modulo}/:id` | Detalle por ID |
| `POST` | `/api/{modulo}` | Crear |
| `PUT` | `/api/{modulo}/:id` | Actualizar |
| `PATCH` | `/api/{modulo}/:id` | Actualizar parcialmente |
| `DELETE` | `/api/{modulo}/:id` | Eliminar |

Módulos disponibles:

| Módulo | Ruta base | Endpoints adicionales |
|---|---|---|
| Autenticación | `/api/auth` | `POST /login` (público), `GET /me` (JWT) |
| Oficinas | `/api/oficinas` | `GET /activas` |
| Cargos | `/api/cargos` | `GET /activos` |
| Tipos de nómina | `/api/tipos-nomina` | `GET /activas`, `GET /codigo/:codigo` |
| Empleados | `/api/empleados` | `GET /cedula/:cedula`, `GET /tipo-nomina/:tipoNominaId`, `GET /:id/pagos`, `GET /:id/vacaciones`, `GET /:id/liquidaciones` |
| Períodos de nómina | `/api/nominas-periodos` | `GET /:id/pagos` |
| Historial de pagos | `/api/pagos-historial` | `GET /empleado/:empleadoId`, `GET /periodo/:periodoId` |
| Vacaciones | `/api/vacaciones` | `GET /empleado/:empleadoId` |
| Bonos especiales | `/api/bonos-especiales` | `GET /generado-por/:usuarioId` |
| Tasas BCV | `/api/tasa-bcv` (alias `/api/tasas-bcv`) | `GET /vigente`, `GET /periodo/:anio/:mes` |
| Usuarios | `/api/usuarios` | `GET /email/:email`, `GET /usuario/:usuario` |
| Auditoría | `/api/audit-log` | `GET /usuario/:usuarioId`, `GET /modulo/:modulo` |
| Bonos vacacionales | `/api/bonos-vacacionales` | `GET /empleado/:empleadoId` |
| Prestaciones sociales | `/api/prestaciones-sociales` | `GET /empleado/:empleadoId` |
| Utilidades | `/api/utilidades` | `GET /empleado/:empleadoId` |
| Liquidaciones | `/api/liquidaciones` | `GET /empleado/:empleadoId` |

### Autenticación

Todas las rutas de `/api` requieren `Authorization: Bearer <token>`, excepto:

- `GET /api`
- `POST /api/auth/login`
- `GET /health` y `GET /health/db`

`POST /api/auth/login` acepta:

```json
{
  "identificador": "usuario o correo@guasimos.gob.ve",
  "password": "MiClaveSegura123"
}
```

También se admiten `usuario`, `email` y `contrasena` como alias por compatibilidad con el frontend. La búsqueda no distingue mayúsculas de minúsculas, verifica que `activo = true` y compara la contraseña con `password_hash` usando `bcryptjs`. Si es válido, actualiza `ultimo_login = NOW()` y responde:

```json
{
  "ok": true,
  "token": "<jwt>",
  "usuario": {
    "id": "<uuid>",
    "usuario": "nombre.usuario",
    "email": "correo@guasimos.gob.ve",
    "nombre": "Nombre completo",
    "rol": "admin",
    "activo": true,
    "ultimo_login": "2026-11-24T..."
  }
}
```

`GET /api/auth/me` devuelve `{ "ok": true, "usuario": { ... } }` con los datos actualizados. Ningún endpoint devuelve `password_hash`.

#### Asignar contraseña a usuarios existentes

Los usuarios creados antes de esta versión tienen `password_hash = NULL` y no podrán iniciar sesión hasta asignarles una contraseña. Use el CLI:

```bash
# Por correo
npm run set-password -- usuario@guasimos.gob.ve "MiClaveSegura123"

# Por nombre de usuario
npm run set-password -- nombre.usuario "MiClaveSegura123"

# Sin dejar la contraseña en el historial del shell (Windows PowerShell)
$env:NUEVA_PASSWORD = "MiClaveSegura123"
npm run set-password -- nombre.usuario
```

La contraseña debe tener al menos 8 caracteres y como máximo 72 bytes (límite de bcrypt). El hash se genera con 12 rondas de bcryptjs.

También se puede enviar `password` al crear (`POST /api/usuarios`) o editar (`PUT`/`PATCH /api/usuarios/:id`) un usuario; el backend la hashea antes de guardarla.

#### Probar el login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"identificador\":\"usuario@guasimos.gob.ve\",\"password\":\"MiClaveSegura123\"}"

curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Filtros y paginación

Los listados aceptan parámetros de consulta según la entidad:

- `empleado_id`, `periodo_id`, `oficina_id`, `cargo_id`, `tipo_nomina_id`, `usuario_id`
- `anio`, `mes`, `quincena`, `trimestre`, `anio_correspondiente`
- `estatus`, `estado`, `tipo`, `tipo_vinculacion`, `frecuencia`, `rol`, `activo`, `activa`, `pagado`, `anulado`
- `desde` / `hasta` para rangos de fechas
- `q` para búsqueda de texto
- `limit` (máx. 500, por defecto 100), `offset`
- `orderBy` / `orderDir` (`asc` o `desc`)

Ejemplo:

```http
GET /api/pagos-historial?empleado_id=<uuid>&anio=2026&limit=50&offset=0
```

### Formato de respuesta

Éxito:

```json
{
  "ok": true,
  "data": {},
  "meta": { "total": 1, "limit": 100, "offset": 0 }
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "message": "Descripción del error",
    "details": []
  }
}
```

Códigos usados: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.

## Esquema relacional (15 tablas)

El archivo `database/schema.sql` refleja el DDL real exportado de PostgreSQL 17.4:

- Catálogos y personal: `oficinas`, `cargos`, `tipos_nomina`, `empleados`
- Nómina y pagos: `nominas_periodos`, `pagos_historial`, `bonos_especiales`, `tasa_bcv`
- Tiempo libre y beneficios: `vacaciones`, `bonos_vacacionales`, `prestaciones_sociales`, `utilidades`, `liquidaciones`
- Seguridad y auditoría: `usuarios`, `audit_log`

Cambios estructurales reflejados:

- `empleados.tipo_nomina_id` es FK UUID a `tipos_nomina(id)` con `ON DELETE RESTRICT`; se eliminó el campo de texto `tipo_nomina`.
- `cargos` solo conserva `id`, `nombre` (único), `activo` y `created_at`.
- La tabla de tasas se llama `tasa_bcv` (singular), con `UNIQUE (anio, mes)` y `CHECK (mes BETWEEN 1 AND 12)`.
- `audit_log.id` es `bigint GENERATED ALWAYS AS IDENTITY`.
- `usuarios.usuario` y `usuarios.email` son `UNIQUE`.
- `prestaciones_sociales.trimestre` tiene `CHECK (trimestre BETWEEN 1 AND 4)`.

Se respetan los tipos `uuid`, `numeric(14,2)`, `numeric(14,4)`, `numeric(5,2)`, `numeric(6,2)`, `jsonb`, `date`, `timestamptz`, `smallint`, `bigint` y las llaves foráneas indicadas.

### Defaults principales

| Tabla | Campo | Default |
|---|---|---|
| `empleados` | `estatus` | `'activo'` |
| `empleados` | `sueldo_base` | `0.00` |
| `empleados` | `aplica_nomina_regular` | `true` |
| `empleados` | `tiene_hijos` | `false` |
| `nominas_periodos` | `estado` | `'abierta'` |
| `nominas_periodos` | totales y `cantidad_empleados` | `0` / `0.00` |
| `pagos_historial` | `anulado` | `false` |
| `pagos_historial` | `total_asignaciones`, `total_deducciones`, `neto_pagado` | `0.00` |
| `vacaciones` | `estatus` | `'pendiente'` |
| `bonos_vacacionales` | `pagado` | `false` |
| `prestaciones_sociales` | `anticipos`, `intereses_prestaciones` | `0.00` |
| `liquidaciones` | montos y días pendientes | `0.00` / `0` |
| `liquidaciones` | `estatus` | `'borrador'` |
| `tipos_nomina` | `frecuencia` | `'quincenal'` |
| `tipos_nomina` | `activa` | `true` |

## Reglas de dominio

- Siglas institucionales oficiales: **P.I.E.** (nunca `P.J.E.`), expuestas en `GET /api`.
- Cargos siempre en singular: `Director`, `Coordinador`, etc.
- Prima por hijo: **6,25 Bs.**, aditiva al salario (`src/config/domain.js`).
- Tasa BCV: si no hay conexión o registros vigentes, la API responde `404` con `details.tasaFallback = 0` y `textoFallback = "Bs. 00,00"`; el frontend muestra `Bs. 00,00` con su aviso.

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto HTTP | `4000` |
| `DATABASE_URL` | Cadena completa de conexión (prioritaria) | — |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario | `postgres` |
| `DB_PASSWORD` | Contraseña | `postgres` |
| `DB_NAME` | Base de datos | `nomina_guasimos` |
| `DB_SSL` | Usar SSL (`true`/`false`) | `false` |
| `DB_POOL_MAX` | Conexiones máximas del pool | `10` |
| `CORS_ORIGIN` | Origen(es) permitidos, separados por coma | `http://localhost:3000` |
| `JWT_SECRET` | Secreto para firmar/verificar JWT (mínimo 32 caracteres) | — |
| `JWT_EXPIRES_IN` | Vigencia del token (`8h`, `1d`, `30m`, etc.) | `8h` |
