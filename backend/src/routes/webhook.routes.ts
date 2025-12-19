import express from 'express';
import {
  handleTossWebhook,
  handleIamportWebhook,
  handleStripeWebhook,
  checkPaymentStatus,
} from '../controllers/webhook.controller';

const router = express.Router();

/**
 * Payment Provider Webhooks
 *
 * These endpoints receive notifications from payment providers
 * about payment status changes.
 *
 * IMPORTANT:
 * - These endpoints should NOT require authentication
 * - They use provider-specific signature verification instead
 * - Always return 200 to prevent unnecessary retries
 */

// Toss Payments webhook
// POST /api/webhooks/toss
router.post('/toss', express.json(), handleTossWebhook);

// Iamport (포트원) webhook
// POST /api/webhooks/iamport
router.post('/iamport', express.json(), handleIamportWebhook);

// Stripe webhook
// POST /api/webhooks/stripe
// Note: Stripe requires raw body for signature verification
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Payment status check (for frontend polling)
// GET /api/webhooks/status/:orderId
router.get('/status/:orderId', checkPaymentStatus);

export default router;
