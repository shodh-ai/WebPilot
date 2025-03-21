import { Router } from 'express';
import { getPosts } from '../controllers/getPosts.js';
import { addPost } from '../controllers/addPost.js';
import { verifyToken } from '../controllers/authController.js';
import { searchPosts } from '../controllers/searchPosts.js';

const router = Router();

router.post('/add_post', verifyToken, addPost);
router.post('/get_posts', verifyToken, getPosts);
router.get('/search', searchPosts);

export default router;
