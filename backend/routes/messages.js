import { Router } from 'express';
import { sendMessage } from '../controllers/sendMessage.js';
import { getLiveMessage } from '../controllers/getLiveMessage.js';
import { getMessages } from '../controllers/getMessages.js';
import { verifyToken } from '../controllers/authController.js';
const router = Router();

router.post('/send', verifyToken, sendMessage);
router.post('/get', verifyToken, getMessages);
router.get('/get_live', verifyToken, getLiveMessage);

export default router;
