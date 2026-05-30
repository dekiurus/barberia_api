-- ============================================================
--  Barbería de la Esquina — Schema PostgreSQL
--  Ejecutar una sola vez: psql -U postgres -d barberia -f schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL      PRIMARY KEY,
  nombre      TEXT        NOT NULL,
  email       TEXT        UNIQUE NOT NULL,
  password    TEXT        NOT NULL,
  rol         TEXT        NOT NULL DEFAULT 'cliente'
                          CHECK (rol IN ('cliente','barbero','admin')),
  telefono    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servicios (
  id          SERIAL      PRIMARY KEY,
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  duracion    INTEGER     NOT NULL,        -- minutos
  precio      NUMERIC(10,2) NOT NULL,
  activo      BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS citas (
  id          SERIAL      PRIMARY KEY,
  cliente_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  barbero_id  INTEGER              REFERENCES usuarios(id) ON DELETE SET NULL,
  servicio_id INTEGER     NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
  fecha       TIMESTAMPTZ NOT NULL,
  estado      TEXT        NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente','confirmada','cancelada','completada')),
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citas_cliente  ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_barbero  ON citas(barbero_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha    ON citas(fecha);

CREATE TABLE IF NOT EXISTS pagos (
  id            SERIAL        PRIMARY KEY,
  cita_id       INTEGER       NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  usuario_id    INTEGER       NOT NULL REFERENCES usuarios(id),
  monto         NUMERIC(10,2) NOT NULL,
  moneda        TEXT          NOT NULL DEFAULT 'ARS',
  proveedor     TEXT          NOT NULL CHECK (proveedor IN ('stripe','mercadopago')),
  proveedor_id  TEXT,
  estado        TEXT          NOT NULL DEFAULT 'pendiente'
                              CHECK (estado IN ('pendiente','completado','fallido','reembolsado')),
  metadata      JSONB,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_cita ON pagos(cita_id);

-- ── Seed servicios ──────────────────────────────────────────
INSERT INTO servicios (nombre, descripcion, duracion, precio) VALUES
  ('Corte clásico',    'Corte a tijera o máquina',             30, 2500),
  ('Corte + barba',    'Corte con arreglo de barba incluido',  50, 3800),
  ('Arreglo de barba', 'Perfilado y arreglo de barba',         20, 1800),
  ('Corte infantil',   'Corte para niños hasta 12 años',       25, 1800),
  ('Afeitado clásico', 'Afeitado con navaja y toalla caliente',35, 2200)
ON CONFLICT DO NOTHING;
