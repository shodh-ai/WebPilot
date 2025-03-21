import { Router } from 'express';
import { signup, login, verifyToken } from '../controllers/authController.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;
