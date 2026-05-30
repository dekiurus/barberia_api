import Usuario from '../models/Usuario.js';
import Servicio from '../models/Servicio.js';
import Cita from '../models/Cita.js';
import Pago from '../models/Pago.js';

const paginar = (req) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const meta = (total, page, limit) => ({
  total, page, limit, total_paginas: Math.ceil(total / limit),
});

// GET /api/buscar/servicios?q=corte&precio_min=&precio_max=&duracion_max=
export const buscarServicios = async (req, res) => {
  const { q, precio_min, precio_max, duracion_min, duracion_max } = req.query;
  const { page, limit, skip } = paginar(req);
  const filtro = { activo: true };

  if (q) filtro.$or = [{ nombre: new RegExp(q, 'i') }, { descripcion: new RegExp(q, 'i') }];
  if (precio_min || precio_max) {
    filtro.precio = {};
    if (precio_min) filtro.precio.$gte = Number(precio_min);
    if (precio_max) filtro.precio.$lte = Number(precio_max);
  }
  if (duracion_min || duracion_max) {
    filtro.duracion = {};
    if (duracion_min) filtro.duracion.$gte = Number(duracion_min);
    if (duracion_max) filtro.duracion.$lte = Number(duracion_max);
  }

  const [total, data] = await Promise.all([
    Servicio.countDocuments(filtro),
    Servicio.find(filtro).sort({ nombre: 1 }).skip(skip).limit(limit),
  ]);
  res.json({ data, meta: meta(total, page, limit) });
};

// GET /api/buscar/usuarios?q=juan&rol=barbero
export const buscarUsuarios = async (req, res) => {
  const { q, rol } = req.query;
  const { page, limit, skip } = paginar(req);
  const filtro = {};

  if (q) filtro.$or = [{ nombre: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { telefono: new RegExp(q, 'i') }];
  if (rol) filtro.rol = rol;

  const [total, data] = await Promise.all([
    Usuario.countDocuments(filtro),
    Usuario.find(filtro).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  res.json({ data, meta: meta(total, page, limit) });
};

// GET /api/buscar/citas?q=&estado=&fecha_desde=&fecha_hasta=&barbero_id=&servicio_id=
export const buscarCitas = async (req, res) => {
  const { q, estado, fecha_desde, fecha_hasta, barbero_id, servicio_id } = req.query;
  const { page, limit, skip } = paginar(req);
  const filtro = {};

  if (req.usuario.rol === 'cliente') filtro.cliente = req.usuario.id;
  else if (req.usuario.rol === 'barbero') filtro.barbero = req.usuario.id;

  if (estado) filtro.estado = estado;
  if (barbero_id) filtro.barbero = barbero_id;
  if (servicio_id) filtro.servicio = servicio_id;
  if (fecha_desde || fecha_hasta) {
    filtro.fecha = {};
    if (fecha_desde) filtro.fecha.$gte = new Date(fecha_desde);
    if (fecha_hasta) filtro.fecha.$lte = new Date(fecha_hasta);
  }

  const populate = [
    { path: 'cliente', select: 'nombre email' },
    { path: 'barbero',  select: 'nombre' },
    { path: 'servicio', select: 'nombre precio' },
  ];

  let query = Cita.find(filtro).populate(populate).sort({ fecha: -1 }).skip(skip).limit(limit);

  // Búsqueda por texto requiere post-filtro sobre campos populados
  let [total, data] = await Promise.all([Cita.countDocuments(filtro), query]);

  if (q) {
    const re = new RegExp(q, 'i');
    data = data.filter(c =>
      re.test(c.cliente?.nombre) || re.test(c.cliente?.email) ||
      re.test(c.servicio?.nombre) || re.test(c.notas)
    );
    total = data.length;
  }

  res.json({ data, meta: meta(total, page, limit) });
};

// GET /api/buscar/pagos?estado=&proveedor=&fecha_desde=&fecha_hasta=
export const buscarPagos = async (req, res) => {
  const { estado, proveedor, fecha_desde, fecha_hasta } = req.query;
  const { page, limit, skip } = paginar(req);
  const filtro = {};

  if (req.usuario.rol === 'cliente') filtro.usuario = req.usuario.id;
  if (estado)    filtro.estado    = estado;
  if (proveedor) filtro.proveedor = proveedor;
  if (fecha_desde || fecha_hasta) {
    filtro.createdAt = {};
    if (fecha_desde) filtro.createdAt.$gte = new Date(fecha_desde);
    if (fecha_hasta) filtro.createdAt.$lte = new Date(fecha_hasta);
  }

  const [total, data] = await Promise.all([
    Pago.countDocuments(filtro),
    Pago.find(filtro)
      .populate('usuario', 'nombre email')
      .populate({ path: 'cita', populate: { path: 'servicio', select: 'nombre' } })
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  res.json({ data, meta: meta(total, page, limit) });
};

// GET /api/buscar/global?q=texto
export const buscarGlobal = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2)
    return res.status(400).json({ error: 'q debe tener al menos 2 caracteres' });

  const re = new RegExp(q, 'i');

  const [usuarios, servicios, citas] = await Promise.all([
    Usuario.find({ $or: [{ nombre: re }, { email: re }] }).select('-password').limit(5),
    Servicio.find({ $or: [{ nombre: re }, { descripcion: re }], activo: true }).limit(5),
    Cita.find({ notas: re }).populate('cliente', 'nombre email').populate('servicio', 'nombre').limit(5),
  ]);

  res.json({
    query: q,
    resultados: {
      usuarios:  { data: usuarios,  total: usuarios.length },
      servicios: { data: servicios, total: servicios.length },
      citas:     { data: citas,     total: citas.length },
    },
  });
};
