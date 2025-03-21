import { Router } from 'express';
import { addQuery } from '../controllers/addQuery.js';

const router = Router();

router.post('/add_query', addQuery);

export default router;
