import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// 파일 승인/거부
export const reviewFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const file = await prisma.file.update({
      where: { id },
      data: {
        status,
        publishedAt: status === 'APPROVED' ? new Date() : null,
      },
    });

    // Send notification to uploader
    await prisma.notification.create({
      data: {
        userId: file.uploaderId,
        type: 'SYSTEM',
        title: `파일 ${status === 'APPROVED' ? '승인' : '거부'}됨`,
        message: status === 'APPROVED'
          ? `파일 "${file.title}"이 승인되었습니다.`
          : `파일 "${file.title}"이 거부되었습니다. 사유: ${reason || '규정 위반'}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `File ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// 통계 대시보드
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalUsers,
      totalFiles,
      totalPurchases,
      totalRevenue,
      pendingFiles,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.file.count(),
      prisma.purchase.count(),
      prisma.transaction.aggregate({
        where: { type: 'PURCHASE' },
        _sum: { amount: true },
      }),
      prisma.file.count({ where: { status: 'PENDING' } }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalFiles,
        totalPurchases,
        totalRevenue: Math.abs(totalRevenue._sum.amount || 0),
        pendingFiles,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 사용자 관리
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          cash: true,
          point: true,
          isActive: true,
          isAdmin: true,
          isSeller: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// 사용자 활성화/비활성화
export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// 배너 관리
export const createBanner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, imageUrl, link, position, validFrom, validUntil } = req.body;

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        link,
        position,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      },
    });

    res.status(201).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

export const getBanners = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { position } = req.query;

    const where: any = {
      isActive: true,
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() },
    };

    if (position) {
      where.position = position;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};
