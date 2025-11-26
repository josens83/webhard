import express from 'express';
import {
  sendMessage,
  getInbox,
  getSentMessages,
  getMessage,
  deleteMessage,
  deleteMessages,
  getUnreadCount,
  markAllAsRead,
} from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 모든 쪽지 관련 라우트는 인증 필요
router.use(authenticate);

// 쪽지 보내기
router.post('/send', sendMessage);

// 받은 쪽지 목록
router.get('/inbox', getInbox);

// 보낸 쪽지 목록
router.get('/sent', getSentMessages);

// 읽지 않은 쪽지 수
router.get('/unread-count', getUnreadCount);

// 모든 쪽지 읽음 처리
router.post('/mark-all-read', markAllAsRead);

// 여러 쪽지 삭제
router.post('/delete-many', deleteMessages);

// 쪽지 상세 보기
router.get('/:id', getMessage);

// 쪽지 삭제
router.delete('/:id', deleteMessage);

export default router;
