import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
    isSeller: boolean;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isSeller: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isAdmin) {
    throw new AppError('Admin access required', 403);
  }
  next();
};

export const requireSeller = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isSeller && !req.user?.isAdmin) {
    throw new AppError('Seller access required', 403);
  }
  next();
};

// Verify file ownership (uploader or admin can access)
export const requireFileOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const fileId = req.params.id || req.params.fileId;

    if (!fileId) {
      throw new AppError('File ID is required', 400);
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { uploaderId: true },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    if (file.uploaderId !== req.user?.id && !req.user?.isAdmin) {
      throw new AppError('You do not have permission to access this file', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verify purchase or ownership for download
export const requirePurchaseOrOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const fileId = req.params.id || req.params.fileId;

    if (!fileId) {
      throw new AppError('File ID is required', 400);
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { uploaderId: true, price: true },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    // Owner or admin can always download
    if (file.uploaderId === req.user?.id || req.user?.isAdmin) {
      return next();
    }

    // Free files can be downloaded by anyone
    if (file.price === 0) {
      return next();
    }

    // Check if user has purchased the file
    const purchase = await prisma.purchase.findFirst({
      where: {
        fileId,
        userId: req.user?.id,
        status: 'COMPLETED',
      },
    });

    if (!purchase) {
      throw new AppError('You need to purchase this file first', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verify message access (sender or recipient)
export const requireMessageAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const messageId = req.params.id || req.params.messageId;

    if (!messageId) {
      throw new AppError('Message ID is required', 400);
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, recipientId: true },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.senderId !== req.user?.id && message.recipientId !== req.user?.id && !req.user?.isAdmin) {
      throw new AppError('You do not have permission to access this message', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verify friendship
export const requireFriendship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const friendId = req.params.friendId || req.body.friendId;

    if (!friendId) {
      throw new AppError('Friend ID is required', 400);
    }

    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: req.user?.id, friendId, status: 'ACCEPTED' },
          { userId: friendId, friendId: req.user?.id, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship && !req.user?.isAdmin) {
      throw new AppError('You are not friends with this user', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limit check for specific user actions
export const requireDailyLimit = (limitType: 'uploads' | 'messages' | 'downloads', maxCount: number) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let count = 0;

      switch (limitType) {
        case 'uploads':
          count = await prisma.file.count({
            where: {
              uploaderId: req.user?.id,
              createdAt: { gte: today },
            },
          });
          break;
        case 'messages':
          count = await prisma.message.count({
            where: {
              senderId: req.user?.id,
              createdAt: { gte: today },
            },
          });
          break;
        case 'downloads':
          count = await prisma.download.count({
            where: {
              userId: req.user?.id,
              createdAt: { gte: today },
            },
          });
          break;
      }

      if (count >= maxCount) {
        throw new AppError(`Daily ${limitType} limit (${maxCount}) exceeded. Please try again tomorrow.`, 429);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional authentication (doesn't fail if not authenticated)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          isAdmin: true,
          isSeller: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch {
    // Token invalid, continue without user
    next();
  }
};
