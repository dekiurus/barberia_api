import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.js';
import {
  buscarServicios,
  buscarUsuarios,
  buscarCitas,
  buscarPagos,
  buscarGlobal,
} from '../controllers/busquedaController.js';

const router = Router();

// Servicios — público
router.get('/servicios', buscarServicios);

// Resto — requiere login
router.use(autenticar);

router.get('/citas',   buscarCitas);
router.get('/pagos',   buscarPagos);
router.get('/global',  autorizar('admin'), buscarGlobal);
router.get('/usuarios', autorizar('admin'), buscarUsuarios);

export default router;
