import { Router } from 'express';
import { getDBData } from '../controllers/getDBData.js'
const router = Router();

router.post('/getDBData', getDBData);

export default router;
