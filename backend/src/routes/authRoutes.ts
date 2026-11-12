import { Router } from 'express';
import { loginController, registerPatientController } from '../controllers/authController';

const router = Router();

router.post('/login', loginController);
router.post('/register', registerPatientController);

export default router;
