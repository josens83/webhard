import express from 'express';
import {
  chargeCash,
  getTransactions,
  applyCoupon,
  getUserCoupons,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/charge', authenticate, chargeCash);
router.get('/transactions', authenticate, getTransactions);
router.post('/coupon/apply', authenticate, applyCoupon);
router.get('/coupons', authenticate, getUserCoupons);

export default router;
