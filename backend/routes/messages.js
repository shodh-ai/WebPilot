const express = require('express');
const { sendMessage } = require('../controllers/sendMessage');
const { getLiveMessage } = require('../controllers/getLiveMessage');
const { getMessages } = require('../controllers/getMessages');
const { verifyToken } = require('../controllers/authController'); 

const router = express.Router();

router.post('/send', verifyToken, sendMessage);
router.post('/get', verifyToken, getMessages);
router.get('/get_live', verifyToken, getLiveMessage);

module.exports = router;
