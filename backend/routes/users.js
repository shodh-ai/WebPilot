import { Router } from 'express';
import { getUsers } from '../controllers/getUsers.js';
import { verifyToken } from '../controllers/authController.js';

const router = Router();

router.post('/get', verifyToken, getUsers);

export default router;
