const express = require('express');
const { signup, login, verifyToken } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;