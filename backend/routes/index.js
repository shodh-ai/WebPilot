const express = require('express');
const helloRoutes = require('./helloRoutes');
const query = require('./query');
const postsRoutes = require('./posts');
const messagesRoutes = require('./messages');
const authRoutes = require('./auth');

const router = express.Router();

router.use('/hello', helloRoutes);
router.use('/query', query);
router.use('/posts', postsRoutes);
router.use('/messages', messagesRoutes);
router.use('/auth', authRoutes);

module.exports = router;