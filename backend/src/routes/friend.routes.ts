import express from 'express';
import { body, param, query } from 'express-validator';
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
import { validate, paginationValidation } from '../middleware/validators';

const router = express.Router();

// 모든 친구 관련 라우트는 인증 필요
router.use(authenticate);

// Validation rules
const friendRequestValidation = [
  body('userId').notEmpty().withMessage('사용자 ID가 필요합니다.').isString(),
  body('message').optional().isLength({ max: 500 }).withMessage('메시지는 500자 이하여야 합니다.').trim(),
  validate,
];

const searchValidation = [
  query('q').notEmpty().withMessage('검색어를 입력해주세요.').isLength({ min: 2, max: 50 }).withMessage('검색어는 2자 이상 50자 이하여야 합니다.').trim(),
  validate,
];

const friendIdValidation = [
  param('friendId').notEmpty().withMessage('친구 ID가 필요합니다.').isString(),
  validate,
];

const groupValidation = [
  param('friendId').notEmpty().isString(),
  body('group').optional().isLength({ max: 50 }).withMessage('그룹명은 50자 이하여야 합니다.').trim(),
  validate,
];

const nicknameValidation = [
  param('friendId').notEmpty().isString(),
  body('nickname').optional().isLength({ max: 50 }).withMessage('별명은 50자 이하여야 합니다.').trim(),
  validate,
];

// 친구 목록 조회
router.get('/', paginationValidation, getFriends);

// 친구 수 및 요청 수 조회
router.get('/counts', getFriendCounts);

// 사용자 검색 (친구 추가용)
router.get('/search', searchValidation, searchUsers);

// 차단 목록
router.get('/blocked', paginationValidation, getBlockedUsers);

// 친구 요청 관련
router.get('/requests/received', paginationValidation, getReceivedRequests);
router.get('/requests/sent', paginationValidation, getSentRequests);
router.post('/requests', friendRequestValidation, sendFriendRequest);
router.post('/requests/:id/accept', acceptFriendRequest);
router.post('/requests/:id/reject', rejectFriendRequest);
router.delete('/requests/:id', cancelFriendRequest);

// 친구 관리
router.delete('/:friendId', friendIdValidation, removeFriend);
router.post('/:friendId/block', friendIdValidation, blockFriend);
router.post('/:friendId/unblock', friendIdValidation, unblockFriend);
router.patch('/:friendId/group', groupValidation, updateFriendGroup);
router.patch('/:friendId/nickname', nicknameValidation, updateFriendNickname);
router.post('/:friendId/favorite', friendIdValidation, toggleFavorite);

export default router;
