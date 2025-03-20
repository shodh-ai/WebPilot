const express = require('express');
const { sendMessage } = require('../controllers/sendMessage');
const { getMessages } = require('../controllers/getMessages');
const router = express.Router();

router.post('/send', sendMessage);
router.post('/get', getMessages);

module.exports = router;
