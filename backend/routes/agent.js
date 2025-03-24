import { Router } from 'express';
import { getDBData } from '../controllers/getDBData.js'
import { getUserData } from '../controllers/getUserData.js';
const router = Router();

router.post('/getDBData', getDBData);
router.post('/getUserData', getUserData);

export default router;
