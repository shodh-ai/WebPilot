const express = require('express');
const helloRoutes = require('./helloRoutes');
const postsRoutes = require('./posts');
const messagesRoutes = require('./messages');


const router = express.Router();

router.use('/hello', helloRoutes);
router.use('/posts', postsRoutes);
router.use('/messages', messagesRoutes);

module.exports = router;
