const express = require('express');
const { getPosts } = require('../controllers/getPosts');

const router = express.Router();

router.get('/get_posts', getPosts);

module.exports = router;
