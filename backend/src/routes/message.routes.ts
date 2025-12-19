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
import { authenticate, requireMessageAccess, requireDailyLimit } from '../middleware/auth';
import { sendMessageValidation, paginationValidation } from '../middleware/validators';

const router = express.Router();

// 모든 쪽지 관련 라우트는 인증 필요
router.use(authenticate);

// 쪽지 보내기 (일일 100개 제한)
router.post('/send', requireDailyLimit('messages', 100), sendMessageValidation, sendMessage);

// 받은 쪽지 목록
router.get('/inbox', paginationValidation, getInbox);

// 보낸 쪽지 목록
router.get('/sent', paginationValidation, getSentMessages);

// 읽지 않은 쪽지 수
router.get('/unread-count', getUnreadCount);

// 모든 쪽지 읽음 처리
router.post('/mark-all-read', markAllAsRead);

// 여러 쪽지 삭제
router.post('/delete-many', deleteMessages);

// 쪽지 상세 보기 (본인 메시지만)
router.get('/:id', requireMessageAccess, getMessage);

// 쪽지 삭제 (본인 메시지만)
router.delete('/:id', requireMessageAccess, deleteMessage);

export default router;
