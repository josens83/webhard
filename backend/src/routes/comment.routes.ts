import express from 'express';
import { createComment, updateComment, deleteComment, rateFile } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, createComment);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);
router.post('/rating', authenticate, rateFile);

export default router;
