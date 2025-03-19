const express = require('express');
const { getPosts } = require('../controllers/getPosts');
const { addPost } = require('../controllers/addPost');

const router = express.Router();

router.post('/add_post', addPost);
router.get('/get_posts', getPosts);

module.exports = router;
