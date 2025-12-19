import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { paginationValidation } from '../middleware/validators';

const router = express.Router();

// 모든 알림 라우트는 인증 필요
router.use(authenticate);

// 알림 목록 조회
router.get('/', paginationValidation, getNotifications);

// 읽지 않은 알림 수
router.get('/unread-count', getUnreadCount);

// 모든 알림 읽음 처리
router.post('/mark-all-read', markAllAsRead);

// 읽은 알림 모두 삭제
router.delete('/read', deleteReadNotifications);

// 개별 알림 읽음 처리
router.patch('/:id/read', markAsRead);

// 개별 알림 삭제
router.delete('/:id', deleteNotification);

export default router;
