const express = require('express');
const helloRoutes = require('./helloRoutes');
const messagesRoutes = require('./messages');

const router = express.Router();

router.use('/hello', helloRoutes);
router.use('/messages', messagesRoutes);

module.exports = router;
