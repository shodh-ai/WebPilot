import { Router } from 'express';
import helloRoutes from './helloRoutes.js';
import query from './query.js';
import postsRoutes from './posts.js';
import messagesRoutes from './messages.js';
import userRoutes from './users.js';
import authRoutes from './auth.js';
import agentRoutes from './agent.js';

const router = Router();

router.use('/hello', helloRoutes);
router.use('/query', query);
router.use('/posts', postsRoutes);
router.use('/messages', messagesRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/agent', agentRoutes);

export default router;
