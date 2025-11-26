import express from 'express';
import {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getReceivedRequests,
  getSentRequests,
  cancelFriendRequest,
  removeFriend,
  blockFriend,
  unblockFriend,
  getBlockedUsers,
  updateFriendGroup,
  updateFriendNickname,
  toggleFavorite,
  getFriendCounts,
  searchUsers,
} from '../controllers/friend.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 모든 친구 관련 라우트는 인증 필요
router.use(authenticate);

// 친구 목록 조회
router.get('/', getFriends);

// 친구 수 및 요청 수 조회
router.get('/counts', getFriendCounts);

// 사용자 검색 (친구 추가용)
router.get('/search', searchUsers);

// 차단 목록
router.get('/blocked', getBlockedUsers);

// 친구 요청 관련
router.get('/requests/received', getReceivedRequests);
router.get('/requests/sent', getSentRequests);
router.post('/requests', sendFriendRequest);
router.post('/requests/:id/accept', acceptFriendRequest);
router.post('/requests/:id/reject', rejectFriendRequest);
router.delete('/requests/:id', cancelFriendRequest);

// 친구 관리
router.delete('/:friendId', removeFriend);
router.post('/:friendId/block', blockFriend);
router.post('/:friendId/unblock', unblockFriend);
router.patch('/:friendId/group', updateFriendGroup);
router.patch('/:friendId/nickname', updateFriendNickname);
router.post('/:friendId/favorite', toggleFavorite);

export default router;
