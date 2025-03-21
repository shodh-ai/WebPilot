const express = require('express');
const { getUsers } = require('../controllers/getUsers');
const { verifyToken } = require('../controllers/authController');


const router = express.Router();

router.post('/get', verifyToken, getUsers);

module.exports = router;
