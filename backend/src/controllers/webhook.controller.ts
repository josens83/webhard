import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Environment variables for webhook secrets
const TOSS_WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET || '';
const IAMPORT_WEBHOOK_SECRET = process.env.IAMPORT_WEBHOOK_SECRET || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Verify Toss Payments webhook signature
 */
const verifyTossSignature = (payload: string, signature: string): boolean => {
  if (!TOSS_WEBHOOK_SECRET) return false;
  const expectedSignature = crypto
    .createHmac('sha256', TOSS_WEBHOOK_SECRET)
    .update(payload)
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Verify Iamport webhook signature
 */
const verifyIamportSignature = (impUid: string, merchantUid: string): boolean => {
  // Iamport uses imp_uid and merchant_uid validation
  return !!impUid && !!merchantUid;
};

/**
 * Toss Payments webhook handler
 * Handles payment confirmation, cancellation, and virtual account events
 */
export const handleTossWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['toss-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Skip signature verification in development
    if (process.env.NODE_ENV === 'production' && !verifyTossSignature(payload, signature)) {
      console.error('Invalid Toss webhook signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const { eventType, data } = req.body;

    console.log(`[Toss Webhook] Event: ${eventType}`, data);

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handleTossPaymentStatus(data);
        break;

      case 'VIRTUAL_ACCOUNT_DEPOSIT':
        await handleVirtualAccountDeposit(data);
        break;

      case 'PAYMENT_CANCEL':
        await handlePaymentCancel(data);
        break;

      default:
        console.log(`[Toss Webhook] Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error('[Toss Webhook] Error:', error);
    // Always return 200 to prevent retries for handled errors
    res.status(200).json({ success: false, error: 'Processing failed' });
  }
};

/**
 * Handle Toss payment status change
 */
const handleTossPaymentStatus = async (data: any) => {
  const { orderId, paymentKey, status, totalAmount } = data;

  // Find the pending transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      description: { contains: orderId },
      status: 'PENDING',
    },
    include: { user: true },
  });

  if (!transaction) {
    console.log(`[Toss] Transaction not found for order: ${orderId}`);
    return;
  }

  if (status === 'DONE') {
    // Payment successful - credit user's cash balance
    await prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          metadata: JSON.stringify({ paymentKey, ...data }),
        },
      });

      // Credit user balance
      await tx.user.update({
        where: { id: transaction.userId },
        data: { cash: { increment: totalAmount } },
      });

      console.log(`[Toss] Payment completed: ${orderId}, Amount: ${totalAmount}`);
    });
  } else if (status === 'CANCELED' || status === 'FAILED') {
    // Update transaction as failed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        metadata: JSON.stringify(data),
      },
    });

    console.log(`[Toss] Payment ${status}: ${orderId}`);
  }
};

/**
 * Handle virtual account deposit
 */
const handleVirtualAccountDeposit = async (data: any) => {
  const { orderId, paymentKey, status, totalAmount } = data;

  if (status !== 'DONE') return;

  const transaction = await prisma.transaction.findFirst({
    where: {
      description: { contains: orderId },
      status: 'PENDING',
      type: 'CHARGE',
    },
  });

  if (!transaction) {
    console.log(`[Toss VA] Transaction not found: ${orderId}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        metadata: JSON.stringify({ paymentKey, ...data }),
      },
    });

    await tx.user.update({
      where: { id: transaction.userId },
      data: { cash: { increment: totalAmount } },
    });

    console.log(`[Toss VA] Deposit received: ${orderId}, Amount: ${totalAmount}`);
  });
};

/**
 * Handle payment cancellation
 */
const handlePaymentCancel = async (data: any) => {
  const { orderId, paymentKey, cancels } = data;

  const transaction = await prisma.transaction.findFirst({
    where: {
      description: { contains: orderId },
      status: 'COMPLETED',
    },
    include: { user: true },
  });

  if (!transaction) {
    console.log(`[Toss Cancel] Transaction not found: ${orderId}`);
    return;
  }

  const cancelAmount = cancels?.reduce((sum: number, c: any) => sum + c.cancelAmount, 0) || transaction.amount;

  await prisma.$transaction(async (tx) => {
    // Create refund transaction
    await tx.transaction.create({
      data: {
        userId: transaction.userId,
        type: 'REFUND',
        amount: -cancelAmount,
        balance: transaction.user.cash - cancelAmount,
        currency: 'CASH',
        description: `환불: ${orderId}`,
        status: 'COMPLETED',
        metadata: JSON.stringify({ paymentKey, cancels }),
      },
    });

    // Deduct from user balance
    await tx.user.update({
      where: { id: transaction.userId },
      data: { cash: { decrement: cancelAmount } },
    });

    console.log(`[Toss Cancel] Refund processed: ${orderId}, Amount: ${cancelAmount}`);
  });
};

/**
 * Iamport (포트원) webhook handler
 */
export const handleIamportWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imp_uid, merchant_uid, status } = req.body;

    console.log(`[Iamport Webhook] Status: ${status}, ImpUID: ${imp_uid}, MerchantUID: ${merchant_uid}`);

    if (!verifyIamportSignature(imp_uid, merchant_uid)) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        description: { contains: merchant_uid },
        status: 'PENDING',
      },
      include: { user: true },
    });

    if (!transaction) {
      console.log(`[Iamport] Transaction not found: ${merchant_uid}`);
      return res.status(200).json({ success: true, message: 'Transaction not found' });
    }

    switch (status) {
      case 'paid':
        // Verify payment with Iamport API (in production)
        await prisma.$transaction(async (tx) => {
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              metadata: JSON.stringify({ imp_uid, merchant_uid }),
            },
          });

          await tx.user.update({
            where: { id: transaction.userId },
            data: { cash: { increment: transaction.amount } },
          });
        });
        console.log(`[Iamport] Payment completed: ${merchant_uid}`);
        break;

      case 'cancelled':
      case 'failed':
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: JSON.stringify({ imp_uid, merchant_uid, status }),
          },
        });
        console.log(`[Iamport] Payment ${status}: ${merchant_uid}`);
        break;

      case 'ready':
        // Virtual account issued - waiting for deposit
        console.log(`[Iamport] Virtual account ready: ${merchant_uid}`);
        break;

      default:
        console.log(`[Iamport] Unknown status: ${status}`);
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error('[Iamport Webhook] Error:', error);
    res.status(200).json({ success: false, error: 'Processing failed' });
  }
};

/**
 * Stripe webhook handler (for international payments)
 */
export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    // In production, verify signature using Stripe library
    // const event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);

    const event = req.body;

    console.log(`[Stripe Webhook] Event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleStripeRefund(event.data.object);
        break;

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

const handleStripePaymentSuccess = async (paymentIntent: any) => {
  const { id, amount, metadata } = paymentIntent;
  const { userId, orderId } = metadata || {};

  if (!userId || !orderId) return;

  const transaction = await prisma.transaction.findFirst({
    where: {
      description: { contains: orderId },
      status: 'PENDING',
    },
  });

  if (!transaction) return;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        metadata: JSON.stringify(paymentIntent),
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { cash: { increment: amount / 100 } }, // Stripe uses cents
    });
  });

  console.log(`[Stripe] Payment succeeded: ${orderId}`);
};

const handleStripePaymentFailed = async (paymentIntent: any) => {
  const { metadata } = paymentIntent;
  const { orderId } = metadata || {};

  if (!orderId) return;

  const transaction = await prisma.transaction.findFirst({
    where: {
      description: { contains: orderId },
      status: 'PENDING',
    },
  });

  if (!transaction) return;

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'FAILED',
      metadata: JSON.stringify(paymentIntent),
    },
  });

  console.log(`[Stripe] Payment failed: ${orderId}`);
};

const handleStripeRefund = async (charge: any) => {
  const { payment_intent, amount_refunded, metadata } = charge;
  const { userId, orderId } = metadata || {};

  if (!userId || !orderId) return;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await tx.transaction.create({
      data: {
        userId,
        type: 'REFUND',
        amount: -(amount_refunded / 100),
        balance: user.cash - (amount_refunded / 100),
        currency: 'CASH',
        description: `Stripe 환불: ${orderId}`,
        status: 'COMPLETED',
        metadata: JSON.stringify(charge),
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { cash: { decrement: amount_refunded / 100 } },
    });
  });

  console.log(`[Stripe] Refund processed: ${orderId}`);
};

/**
 * Generic payment status check endpoint
 * Can be called from frontend to verify payment status
 */
export const checkPaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        description: { contains: orderId },
      },
      select: {
        id: true,
        status: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: '거래를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: {
        orderId,
        status: transaction.status,
        amount: transaction.amount,
        completedAt: transaction.status === 'COMPLETED' ? transaction.updatedAt : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
