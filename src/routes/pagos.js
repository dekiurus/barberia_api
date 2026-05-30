import { Router } from 'express';
import express from 'express';
import {
  stripeCrearSesion, stripeWebhook, stripeVerificarSesion,
  mpCrearPreferencia, mpWebhook,
  pagosDeCita
} from '../controllers/pagosController.js';
import { autenticar } from '../middlewares/auth.js';

const router = Router();

// Stripe — webhook necesita body raw
router.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

router.post('/stripe/crear-sesion', autenticar, stripeCrearSesion);
router.get('/stripe/sesion/:session_id', autenticar, stripeVerificarSesion);

// MercadoPago
router.post('/mp/crear-preferencia', autenticar, mpCrearPreferencia);
router.post('/mp/webhook', mpWebhook);

// General
router.get('/cita/:cita_id', autenticar, pagosDeCita);

export default router;
