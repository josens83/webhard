import express from 'express';
import { authenticate } from '../middleware/auth';

// Import existing functions
import {
  chargeCash,
  getTransactions,
  applyCoupon,
  getUserCoupons,
} from '../controllers/payment.controller';

const router = express.Router();

// Legacy charge endpoint (for development/testing)
router.post('/charge', authenticate, chargeCash);

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
router.get('/transactions', authenticate, getTransactions);

// Coupons
router.post('/coupon/apply', authenticate, applyCoupon);
router.get('/coupons', authenticate, getUserCoupons);

export default router;
