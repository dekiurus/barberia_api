# 🪒 Barbería de la Esquina — API REST

API backend para gestión de turnos, servicios y pagos de una barbería.

## Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 4
- **BD**: SQLite via `better-sqlite3` (sin configuración externa)
- **Auth**: JWT + bcryptjs
- **Pagos**: Stripe Checkout + MercadoPago Preferences

---

## Instalación

```bash
npm install
cp .env.example .env   # completar las variables
npm run dev            # o npm start en producción
```

---

## Variables de entorno (`.env`)

| Variable               | Descripción                         |
|------------------------|-------------------------------------|
| `PORT`                 | Puerto del servidor (default: 3000) |
| `JWT_SECRET`           | Secreto para firmar tokens JWT      |
| `JWT_EXPIRES_IN`       | Duración del token (ej: `7d`)       |
| `STRIPE_SECRET_KEY`    | Clave secreta de Stripe             |
| `STRIPE_WEBHOOK_SECRET`| Secret del webhook de Stripe        |
| `MP_ACCESS_TOKEN`      | Access token de MercadoPago         |
| `FRONTEND_URL`         | URL del frontend (para redirects)   |
| `API_URL`              | URL pública de esta API             |

---

## Endpoints

### 🔐 Auth  `/api/auth`

| Método | Ruta        | Auth | Descripción               |
|--------|-------------|------|---------------------------|
| POST   | `/registro` | ❌   | Crear cuenta de cliente   |
| POST   | `/login`    | ❌   | Iniciar sesión → JWT      |
| GET    | `/perfil`   | ✅   | Ver perfil propio         |
| PUT    | `/perfil`   | ✅   | Actualizar nombre/tel/pass|

**Roles**: `cliente` (default) · `barbero` · `admin`

---

### ✂️ Servicios  `/api/servicios`

| Método | Ruta    | Auth          | Descripción           |
|--------|---------|---------------|-----------------------|
| GET    | `/`     | ❌            | Listar servicios      |
| GET    | `/:id`  | ❌            | Ver servicio          |
| POST   | `/`     | ✅ admin      | Crear servicio        |
| PUT    | `/:id`  | ✅ admin      | Actualizar servicio   |
| DELETE | `/:id`  | ✅ admin      | Desactivar servicio   |

---

### 📅 Citas  `/api/citas`

| Método | Ruta                    | Auth              | Descripción                            |
|--------|-------------------------|-------------------|----------------------------------------|
| GET    | `/`                     | ✅               | Listar (filtrado por rol)              |
| GET    | `/?estado=&fecha_desde=`| ✅               | Filtrar por estado / fechas            |
| GET    | `/disponibilidad`       | ✅               | Horarios ocupados de un barbero        |
| GET    | `/:id`                  | ✅               | Ver cita                               |
| POST   | `/`                     | ✅               | Crear cita                             |
| PATCH  | `/:id/estado`           | ✅               | Cambiar estado (cancelar/confirmar...) |
| DELETE | `/:id`                  | ✅ admin         | Eliminar cita                          |

**Body POST `/`:**
```json
{
  "servicio_id": 1,
  "barbero_id": 2,       // opcional
  "fecha": "2025-06-10T10:00:00",
  "notas": "Quiero degradado"
}
```

**Estados**: `pendiente` → `confirmada` | `cancelada` | `completada`

---

### 💳 Pagos  `/api/pagos`

#### Stripe

| Método | Ruta                          | Auth | Descripción                          |
|--------|-------------------------------|------|--------------------------------------|
| POST   | `/stripe/crear-sesion`        | ✅   | Crea sesión de Checkout → URL de pago|
| GET    | `/stripe/sesion/:session_id`  | ✅   | Verifica estado de una sesión        |
| POST   | `/stripe/webhook`             | ❌   | Webhook de Stripe (firma verificada) |

#### MercadoPago

| Método | Ruta                      | Auth | Descripción                          |
|--------|---------------------------|------|--------------------------------------|
| POST   | `/mp/crear-preferencia`   | ✅   | Crea preferencia → init_point        |
| POST   | `/mp/webhook`             | ❌   | Webhook de MercadoPago               |

#### General

| Método | Ruta              | Auth | Descripción                    |
|--------|-------------------|------|--------------------------------|
| GET    | `/cita/:cita_id`  | ✅   | Ver todos los pagos de una cita|

---

## Flujo de pago típico

```
1. Cliente crea una cita        POST /api/citas
2. Elige proveedor de pago:
   - Stripe: POST /api/pagos/stripe/crear-sesion  → redirigir a session.url
   - MP:     POST /api/pagos/mp/crear-preferencia → redirigir a init_point
3. El proveedor llama al webhook → la cita pasa a "confirmada"
4. El cliente verifica:          GET /api/pagos/cita/:id
```

---

## Usuarios de prueba (seed automático)

Al iniciar, la BD crea 5 servicios por defecto. Para crear un admin:

```bash
# Registrar un usuario normal y actualizar su rol directo en la BD
sqlite3 db/barberia.db "UPDATE usuarios SET rol='admin' WHERE email='tu@email.com';"
```

---

## Webhooks en desarrollo

Usar [Stripe CLI](https://stripe.com/docs/stripe-cli) para Stripe:
```bash
stripe listen --forward-to localhost:3000/api/pagos/stripe/webhook
```

Para MercadoPago usar [ngrok](https://ngrok.com/):
```bash
ngrok http 3000
# Pegar la URL https en MP_WEBHOOK_SECRET y en la preferencia
```
