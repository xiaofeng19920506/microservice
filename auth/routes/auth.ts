import { Router } from 'express';
import { registerRoutes } from './register';
import { loginRoutes } from './login';
import { refreshRoutes } from './refresh';
import { logoutRoutes } from './logout';
import { meRoutes } from './me';
import { confirmEmailRoutes } from './confirmEmail';

const router = Router();

router.use(registerRoutes);
router.use(loginRoutes);
router.use(refreshRoutes);
router.use(logoutRoutes);
router.use(meRoutes);
router.use(confirmEmailRoutes);

export default router;

