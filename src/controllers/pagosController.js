import Stripe from 'stripe';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import Cita from '../models/Cita.js';
import Pago from '../models/Pago.js';

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);
const getMPClient = () => new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const getCitaConServicio = (id) =>
  Cita.findById(id).populate('servicio', 'nombre precio');

// ── STRIPE ────────────────────────────────────────────────────────────────────
export const stripeCrearSesion = async (req, res) => {
  const { cita_id } = req.body;
  const cita = await getCitaConServicio(cita_id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  if (String(cita.cliente) !== req.usuario.id) return res.status(403).json({ error: 'Sin acceso' });

  const pagado = await Pago.findOne({ cita: cita_id, estado: 'completado' });
  if (pagado) return res.status(409).json({ error: 'Esta cita ya fue pagada' });

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'ars',
        product_data: { name: `Barbería de la Esquina — ${cita.servicio.nombre}` },
        unit_amount: Math.round(Number(cita.servicio.precio) * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    metadata: { cita_id: String(cita_id), usuario_id: req.usuario.id },
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago/cancelado`,
  });

  await Pago.create({ cita: cita_id, usuario: req.usuario.id, monto: cita.servicio.precio, proveedor: 'stripe', proveedor_id: session.id });
  res.json({ session_id: session.id, url: session.url });
};

export const stripeWebhook = async (req, res) => {
  let evento;
  try {
    evento = getStripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  if (evento.type === 'checkout.session.completed') {
    const session = evento.data.object;
    await Pago.findOneAndUpdate({ proveedor_id: session.id }, { estado: 'completado', metadata: session });
    if (session.metadata?.cita_id)
      await Cita.findByIdAndUpdate(session.metadata.cita_id, { estado: 'confirmada' });
  }
  if (evento.type === 'charge.refunded') {
    await Pago.findOneAndUpdate({ proveedor_id: evento.data.object.payment_intent }, { estado: 'reembolsado' });
  }
  res.json({ received: true });
};

export const stripeVerificarSesion = async (req, res) => {
  const session = await getStripe().checkout.sessions.retrieve(req.params.session_id);
  const pago = await Pago.findOne({ proveedor_id: req.params.session_id });
  res.json({ session: { id: session.id, status: session.payment_status }, pago });
};

// ── MERCADOPAGO ───────────────────────────────────────────────────────────────
export const mpCrearPreferencia = async (req, res) => {
  const { cita_id } = req.body;
  const cita = await getCitaConServicio(cita_id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  if (String(cita.cliente) !== req.usuario.id) return res.status(403).json({ error: 'Sin acceso' });

  const pagado = await Pago.findOne({ cita: cita_id, estado: 'completado' });
  if (pagado) return res.status(409).json({ error: 'Esta cita ya fue pagada' });

  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  const result = await new Preference(getMPClient()).create({
    body: {
      items: [{ title: `Barbería — ${cita.servicio.nombre}`, quantity: 1, unit_price: Number(cita.servicio.precio), currency_id: 'ARS' }],
      external_reference: String(cita_id),
      back_urls: { success: `${base}/pago/exito`, failure: `${base}/pago/fallo`, pending: `${base}/pago/pendiente` },
      auto_return: 'approved',
      notification_url: `${process.env.API_URL || 'http://localhost:3000'}/api/pagos/mp/webhook`,
    },
  });

  await Pago.create({ cita: cita_id, usuario: req.usuario.id, monto: cita.servicio.precio, proveedor: 'mercadopago', proveedor_id: result.id });
  res.json({ preference_id: result.id, init_point: result.init_point, sandbox_init_point: result.sandbox_init_point });
};

export const mpWebhook = async (req, res) => {
  const { type, data } = req.body;
  if (type !== 'payment') return res.sendStatus(200);
  try {
    const payment = await new Payment(getMPClient()).get({ id: data.id });
    const estado = payment.status === 'approved' ? 'completado' : payment.status === 'rejected' ? 'fallido' : 'pendiente';
    await Pago.findOneAndUpdate({ cita: payment.external_reference, proveedor: 'mercadopago' }, { estado, proveedor_id: String(payment.id), metadata: payment });
    if (estado === 'completado') await Cita.findByIdAndUpdate(payment.external_reference, { estado: 'confirmada' });
  } catch (err) { console.error('MP Webhook error:', err); }
  res.sendStatus(200);
};

export const pagosDeCita = async (req, res) => {
  const cita = await Cita.findById(req.params.cita_id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  if (req.usuario.rol === 'cliente' && String(cita.cliente) !== req.usuario.id)
    return res.status(403).json({ error: 'Sin acceso' });
  res.json(await Pago.find({ cita: req.params.cita_id }).sort({ createdAt: -1 }));
};
