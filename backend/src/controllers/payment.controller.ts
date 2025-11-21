import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

// 캐시 충전
export const chargeCash = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, paymentMethod, pgProvider, pgTransactionId } = req.body;
    const userId = req.user!.id;

    if (!amount || amount < 1000) {
      throw new AppError('Minimum charge amount is 1000', 400);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 보너스 계산 (10% 이상 충전시)
    let bonusPoint = 0;
    let bonusCash = 0;

    if (amount >= 10000) {
      bonusPoint = Math.floor(amount * 0.1); // 10% 포인트 보너스
    }
    if (amount >= 50000) {
      bonusCash = Math.floor(amount * 0.05); // 5% 캐시 보너스
    }

    // Process transaction
    await prisma.$transaction(async (tx) => {
      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          cash: { increment: amount + bonusCash },
          point: { increment: bonusPoint },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount,
          balance: user.cash + amount + bonusCash,
          currency: 'CASH',
          description: `Cash charge: ${amount}원`,
          paymentMethod,
          pgProvider,
          pgTransactionId,
          status: 'COMPLETED',
          metadata: {
            bonusCash,
            bonusPoint,
          },
        },
      });

      // Bonus point transaction
      if (bonusPoint > 0) {
        await tx.transaction.create({
          data: {
            userId,
            type: 'BONUS',
            amount: bonusPoint,
            balance: user.point + bonusPoint,
            currency: 'POINT',
            description: '충전 보너스 포인트',
            status: 'COMPLETED',
          },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Cash charged successfully',
      data: {
        amount,
        bonusCash,
        bonusPoint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 거래 내역 조회
export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20', type, currency } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (currency) {
      where.currency = currency;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 쿠폰 적용
export const applyCoupon = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) {
      throw new AppError('Coupon code is required', 400);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new AppError('Invalid coupon code', 404);
    }

    if (!coupon.isActive) {
      throw new AppError('Coupon is not active', 400);
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new AppError('Coupon is not valid at this time', 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit exceeded', 400);
    }

    // Check if user already used this coupon
    const existingUse = await prisma.userCoupon.findFirst({
      where: {
        userId,
        couponId: coupon.id,
      },
    });

    if (existingUse) {
      throw new AppError('Coupon already used', 400);
    }

    // Add coupon to user
    await prisma.$transaction(async (tx) => {
      await tx.userCoupon.create({
        data: {
          userId,
          couponId: coupon.id,
        },
      });

      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });

      await tx.user.update({
        where: { id: userId },
        data: { couponCount: { increment: 1 } },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// 사용자 쿠폰 목록
export const getUserCoupons = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const coupons = await prisma.userCoupon.findMany({
      where: {
        userId,
        isUsed: false,
      },
      include: {
        coupon: true,
      },
    });

    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};
