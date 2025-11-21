import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const createComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId, content, parentId } = req.body;
    const userId = req.user!.id;

    if (!fileId || !content) {
      throw new AppError('File ID and content are required', 400);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        fileId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId && !req.user!.isAdmin) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.comment.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const rateFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId, rating } = req.body;
    const userId = req.user!.id;

    if (!fileId || !rating || rating < 1 || rating > 5) {
      throw new AppError('Valid file ID and rating (1-5) are required', 400);
    }

    // Upsert rating
    await prisma.rating.upsert({
      where: {
        userId_fileId: {
          userId,
          fileId,
        },
      },
      create: {
        userId,
        fileId,
        rating,
      },
      update: {
        rating,
      },
    });

    // Recalculate average rating
    const ratings = await prisma.rating.aggregate({
      where: { fileId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.file.update({
      where: { id: fileId },
      data: {
        ratingAverage: ratings._avg.rating || 0,
        ratingCount: ratings._count,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};
