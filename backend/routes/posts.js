const express = require('express');
const { getPosts } = require('../controllers/getPosts');
const { addPost } = require('../controllers/addPost');
const { verifyToken } = require('../controllers/authController');
const { searchPosts } = require('../controllers/searchPosts');

const router = express.Router();

router.post('/add_post',verifyToken, addPost);
router.post('/get_posts',verifyToken, getPosts);
router.get('/search', searchPosts);

module.exports = router;