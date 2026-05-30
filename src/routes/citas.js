import { Router } from 'express';
import { body } from 'express-validator';
import {
  listarCitas, obtenerCita, crearCita,
  cambiarEstado, eliminarCita, disponibilidad
} from '../controllers/citasController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = Router();

// Todos autenticados
router.use(autenticar);

router.get('/disponibilidad', disponibilidad);
router.get('/',     listarCitas);
router.get('/:id',  obtenerCita);

router.post('/', [
  body('servicio_id').isInt({ min: 1 }).withMessage('servicio_id requerido'),
  body('fecha').isISO8601().withMessage('fecha debe ser ISO 8601 (ej: 2025-06-10T10:00:00)'),
], crearCita);

router.patch('/:id/estado', cambiarEstado);
router.delete('/:id', autorizar('admin'), eliminarCita);

export default router;
