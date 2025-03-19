const express = require('express');
const helloRoutes = require('./helloRoutes');
const postsRoutes = require('./posts');

const router = express.Router();

router.use('/hello', helloRoutes);
router.use('/posts', postsRoutes);

module.exports = router;
