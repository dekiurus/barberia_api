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



## Flujo de pago típico

```
1. Cliente crea una cita        POST /api/citas
2. Elige proveedor de pago:
   - Stripe: POST /api/pagos/stripe/crear-sesion  → redirigir a session.url
   - MP:     POST /api/pagos/mp/crear-preferencia → redirigir a init_point
3. El proveedor llama al webhook → la cita pasa a "confirmada"
4. El cliente verifica:          GET /api/pagos/cita/:id

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
