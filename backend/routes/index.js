const express = require('express');
const helloRoutes = require('./helloRoutes');
const posts = require('./posts');
const query = require('./query');

const router = express.Router();

router.use('/hello', helloRoutes);
router.use('/posts', posts);
router.use('/query', query);

module.exports = router;
