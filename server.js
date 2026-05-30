import 'dotenv/config';
import express from 'express';
import conectar from './src/config/database.js';
import mongoose from 'mongoose';
import authRoutes      from './src/routes/auth.js';
import citasRoutes     from './src/routes/citas.js';
import serviciosRoutes from './src/routes/servicios.js';
import pagosRoutes     from './src/routes/pagos.js';
import busquedaRoutes  from './src/routes/busqueda.js';
import cors from 'cors';
await conectar();

const app  = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use('/api/pagos/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use('/api/auth',      authRoutes);
app.use('/api/citas',     citasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/pagos',     pagosRoutes);
app.use('/api/buscar',    busquedaRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

app.listen(PORT, () =>
  console.log(`\n🪒  Barbería de la Esquina API\n📡  http://localhost:${PORT}\n`)
);
