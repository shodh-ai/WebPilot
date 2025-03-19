const express = require('express');
const { sendMessage } = require('../controllers/sendMessage');
const router = express.Router();

router.post('/send', sendMessage);

module.exports = router;
