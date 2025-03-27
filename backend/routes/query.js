import { Router } from 'express';
import { addQuery } from '../controllers/addQuery.js';
import { verifyToken } from '../controllers/authController.js';


const router = Router();

router.post('/add_query',verifyToken, addQuery);

export default router;
