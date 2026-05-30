import { Router } from 'express';
import { body } from 'express-validator';
import {
  listarServicios, obtenerServicio, crearServicio,
  actualizarServicio, eliminarServicio
} from '../controllers/serviciosController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = Router();

// Públicas
router.get('/',    listarServicios);
router.get('/:id', obtenerServicio);

// Admin
router.post('/', autenticar, autorizar('admin'), [
  body('nombre').trim().notEmpty(),
  body('duracion').isInt({ min: 5 }),
  body('precio').isFloat({ min: 0 }),
], crearServicio);

router.put('/:id',    autenticar, autorizar('admin'), actualizarServicio);
router.delete('/:id', autenticar, autorizar('admin'), eliminarServicio);

export default router;
