import { Router } from 'express';
import { body } from 'express-validator';
import { registro, login, perfil, actualizarPerfil } from '../controllers/authController.js';
import { autenticar } from '../middlewares/auth.js';

const router = Router();

router.post('/registro', [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
], registro);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.get('/perfil', autenticar, perfil);
router.put('/perfil', autenticar, actualizarPerfil);

export default router;
