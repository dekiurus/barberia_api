import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import Usuario from '../models/Usuario.js';

const signToken = (u) =>
  jwt.sign(
    { id: u._id, email: u.email, rol: u.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

export const registro = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

  const { nombre, email, password, telefono } = req.body;
  const existe = await Usuario.findOne({ email });
  if (existe) return res.status(409).json({ error: 'El email ya está registrado' });

  const hash = await bcrypt.hash(password, 12);
  const usuario = await Usuario.create({ nombre, email, password: hash, telefono });
  const { password: _, ...datos } = usuario.toObject();
  res.status(201).json({ token: signToken(usuario), usuario: datos });
};

export const login = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

  const { email, password } = req.body;
  const usuario = await Usuario.findOne({ email });
  if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido) return res.status(401).json({ error: 'Credenciales inválidas' });

  const { password: _, ...datos } = usuario.toObject();
  res.json({ token: signToken(usuario), usuario: datos });
};

export const perfil = async (req, res) => {
  const usuario = await Usuario.findById(req.usuario.id).select('-password');
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
};

export const actualizarPerfil = async (req, res) => {
  const { nombre, telefono, password } = req.body;
  const update = {};
  if (nombre)   update.nombre   = nombre;
  if (telefono) update.telefono = telefono;
  if (password) update.password = await bcrypt.hash(password, 12);

  if (!Object.keys(update).length) return res.status(400).json({ error: 'Nada para actualizar' });

  const usuario = await Usuario.findByIdAndUpdate(req.usuario.id, update, { new: true }).select('-password');
  res.json(usuario);
};
