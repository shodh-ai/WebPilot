import { Router } from 'express';
import { getDBData } from '../controllers/getDBData.js'
import { getUserData } from '../controllers/getUserData.js';
import { verifyToken } from '../controllers/authController.js';

const router = Router();

router.post('/getDBData',verifyToken, getDBData);
router.post('/getUserData', verifyToken, getUserData);

export default router;
