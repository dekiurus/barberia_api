import { validationResult } from 'express-validator';
import Servicio from '../models/Servicio.js';

export const listarServicios = async (_req, res) => {
  res.json(await Servicio.find({ activo: true }).sort({ nombre: 1 }));
};

export const obtenerServicio = async (req, res) => {
  const s = await Servicio.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Servicio no encontrado' });
  res.json(s);
};

export const crearServicio = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
  const { nombre, descripcion, duracion, precio } = req.body;
  res.status(201).json(await Servicio.create({ nombre, descripcion, duracion, precio }));
};

export const actualizarServicio = async (req, res) => {
  const s = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!s) return res.status(404).json({ error: 'Servicio no encontrado' });
  res.json(s);
};

export const eliminarServicio = async (req, res) => {
  const s = await Servicio.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
  if (!s) return res.status(404).json({ error: 'Servicio no encontrado' });
  res.status(204).send();
};
