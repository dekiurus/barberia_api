import { validationResult } from 'express-validator';
import Cita from '../models/Cita.js';
import Servicio from '../models/Servicio.js';
import Usuario from '../models/Usuario.js';

const populate = [
  { path: 'cliente', select: 'nombre email' },
  { path: 'barbero',  select: 'nombre' },
  { path: 'servicio', select: 'nombre precio duracion' },
];

export const listarCitas = async (req, res) => {
  const { estado, fecha_desde, fecha_hasta, barbero_id } = req.query;
  const filtro = {};

  if (req.usuario.rol === 'cliente') filtro.cliente = req.usuario.id;
  else if (req.usuario.rol === 'barbero') filtro.barbero = req.usuario.id;

  if (estado) filtro.estado = estado;
  if (fecha_desde || fecha_hasta) {
    filtro.fecha = {};
    if (fecha_desde) filtro.fecha.$gte = new Date(fecha_desde);
    if (fecha_hasta) filtro.fecha.$lte = new Date(fecha_hasta);
  }
  if (barbero_id && req.usuario.rol === 'admin') filtro.barbero = barbero_id;

  const citas = await Cita.find(filtro).populate(populate).sort({ fecha: 1 });
  res.json(citas);
};

export const obtenerCita = async (req, res) => {
  const cita = await Cita.findById(req.params.id).populate(populate);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  if (req.usuario.rol === 'cliente' && String(cita.cliente._id) !== req.usuario.id)
    return res.status(403).json({ error: 'Sin acceso a esta cita' });
  res.json(cita);
};

export const crearCita = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

  const { servicio_id, barbero_id, fecha, notas } = req.body;

  const servicio = await Servicio.findOne({ _id: servicio_id, activo: true });
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado o inactivo' });

  if (barbero_id) {
    const barbero = await Usuario.findOne({ _id: barbero_id, rol: 'barbero' });
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    const fechaInicio = new Date(fecha);
    const fechaFin = new Date(fechaInicio.getTime() + servicio.duracion * 60000);

    const solape = await Cita.findOne({
      barbero: barbero_id,
      estado: { $ne: 'cancelada' },
      $or: [{ fecha: { $gte: fechaInicio, $lt: fechaFin } }],
    });
    if (solape) return res.status(409).json({ error: 'El barbero ya tiene una cita en ese horario' });
  }

  const cita = await Cita.create({
    cliente: req.usuario.id,
    barbero: barbero_id || null,
    servicio: servicio_id,
    fecha,
    notas,
  });
  res.status(201).json(await cita.populate(populate));
};

export const cambiarEstado = async (req, res) => {
  const { estado } = req.body;
  const validos = ['confirmada', 'cancelada', 'completada'];
  if (!validos.includes(estado))
    return res.status(400).json({ error: `Estado inválido. Válidos: ${validos.join(', ')}` });

  const cita = await Cita.findById(req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

  if (req.usuario.rol === 'cliente') {
    if (String(cita.cliente) !== req.usuario.id) return res.status(403).json({ error: 'Sin acceso' });
    if (estado !== 'cancelada') return res.status(403).json({ error: 'Los clientes solo pueden cancelar' });
  }

  cita.estado = estado;
  await cita.save();
  res.json(await cita.populate(populate));
};

export const eliminarCita = async (req, res) => {
  const cita = await Cita.findByIdAndDelete(req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  res.status(204).send();
};

export const disponibilidad = async (req, res) => {
  const { barbero_id, fecha } = req.query;
  if (!barbero_id || !fecha)
    return res.status(400).json({ error: 'Parámetros requeridos: barbero_id, fecha' });

  const inicio = new Date(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);

  const citas = await Cita.find({
    barbero: barbero_id,
    estado: { $ne: 'cancelada' },
    fecha: { $gte: inicio, $lt: fin },
  }).populate('servicio', 'nombre duracion');

  res.json({ fecha, barbero_id, citas_ocupadas: citas });
};
