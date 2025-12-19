import express from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate, paginationValidation, chargeValidation } from '../middleware/validators';

// Import existing functions
import {
  chargeCash,
  getTransactions,
  applyCoupon,
  getUserCoupons,
} from '../controllers/payment.controller';

const router = express.Router();

// Validation rules
const couponValidation = [
  body('code').notEmpty().withMessage('쿠폰 코드를 입력해주세요.').isLength({ min: 4, max: 50 }).withMessage('유효한 쿠폰 코드를 입력해주세요.').trim().toUpperCase(),
  validate,
];

const transactionQueryValidation = [
  query('type').optional().isIn(['all', 'charge', 'purchase', 'sale', 'refund']).withMessage('유효한 거래 유형을 선택해주세요.'),
  query('startDate').optional().isISO8601().withMessage('유효한 시작 날짜 형식이 아닙니다.'),
  query('endDate').optional().isISO8601().withMessage('유효한 종료 날짜 형식이 아닙니다.'),
  ...paginationValidation.slice(0, -1), // Remove validate from pagination
  validate,
];

// Legacy charge endpoint (for development/testing)
router.post('/charge', authenticate, chargeValidation, chargeCash);

// Toss Payments endpoints
// router.post('/charge/request', authenticate, requestPayment);
// router.post('/charge/confirm', authenticate, confirmPayment);

// Iamport endpoints
// router.post('/charge/iamport', authenticate, chargeWithIamport);

// Refund
// router.post('/refund', authenticate, requestRefund);

// Virtual account
// router.post('/virtual-account', authenticate, issueVirtualAccount);

// Transaction history
router.get('/transactions', authenticate, transactionQueryValidation, getTransactions);

// Coupons
router.post('/coupon/apply', authenticate, couponValidation, applyCoupon);
router.get('/coupons', authenticate, paginationValidation, getUserCoupons);

export default router;
