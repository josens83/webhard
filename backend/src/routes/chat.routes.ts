import express from 'express';
import {
  getChatRooms,
  createChatRoom,
  getChatRoom,
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  leaveChatRoom,
  inviteParticipants,
  markAsRead,
  searchUsers,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 모든 채팅 라우트는 인증 필요
router.use(authenticate);

// 사용자 검색 (채팅 시작용)
router.get('/users/search', searchUsers);

// 채팅방 목록 조회
router.get('/rooms', getChatRooms);

// 채팅방 생성
router.post('/rooms', createChatRoom);

// 채팅방 상세 조회
router.get('/rooms/:roomId', getChatRoom);

// 메시지 목록 조회
router.get('/rooms/:roomId/messages', getMessages);

// 메시지 전송
router.post('/rooms/:roomId/messages', sendMessage);

// 메시지 수정
router.put('/messages/:messageId', updateMessage);

// 메시지 삭제
router.delete('/messages/:messageId', deleteMessage);

// 채팅방 나가기
router.post('/rooms/:roomId/leave', leaveChatRoom);

// 참가자 초대
router.post('/rooms/:roomId/invite', inviteParticipants);

// 읽음 처리
router.post('/rooms/:roomId/read', markAsRead);

export default router;
