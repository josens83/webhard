import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: 파일 목록 조회
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latest, popular, rating]
 *     responses:
 *       200:
 *         description: 파일 목록
 */
export const getFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      search,
      sortBy = 'latest',
      priceType,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'APPROVED',
      isHidden: false,
    };

    // Category filter
    if (category) {
      where.categoryId = category;
    }

    // Price type filter
    if (priceType === 'FREE') {
      where.price = 0;
    } else if (priceType) {
      where.priceType = priceType;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Sort options
    let orderBy: any = { createdAt: 'desc' };

    if (sortBy === 'popular') {
      orderBy = { downloadCount: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { ratingAverage: 'desc' };
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.file.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        files,
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

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: 파일 상세 조회
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 파일 상세 정보
 */
export const getFileById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isSeller: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          where: { isDeleted: false, parentId: null },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            replies: {
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
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    // Increment view count
    await prisma.file.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: 파일 업로드
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               price:
 *                 type: integer
 *               priceType:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 파일 업로드 성공
 */
export const uploadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, categoryId, price, priceType, tags } = req.body;
    const file = (req as any).file;

    if (!file) {
      throw new AppError('File is required', 400);
    }

    if (!title || !categoryId) {
      throw new AppError('Title and category are required', 400);
    }

    // Check if user is seller
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user?.isSeller && price > 0) {
      throw new AppError('Only sellers can upload paid files', 403);
    }

    // Parse tags
    let tagList: string[] = [];
    if (tags) {
      tagList = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Create file record
    const newFile = await prisma.file.create({
      data: {
        title,
        description,
        fileName: file.originalname,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        fileExtension: file.originalname.split('.').pop() || '',
        storagePath: file.path,
        price: parseInt(price) || 0,
        priceType: priceType || 'FREE',
        uploaderId: req.user!.id,
        categoryId,
        status: 'PENDING', // 관리자 승인 필요
        tags: {
          create: await Promise.all(
            tagList.map(async (tagName: string) => {
              const tag = await prisma.tag.upsert({
                where: { name: tagName },
                create: { name: tagName, slug: tagName.toLowerCase() },
                update: { count: { increment: 1 } },
              });
              return { tagId: tag.id };
            })
          ),
        },
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully. Waiting for approval.',
      data: newFile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/files/{id}/download:
 *   post:
 *     summary: 파일 다운로드
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 다운로드 URL 반환
 */
export const downloadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    // Check if user already purchased or file is free
    if (file.price > 0) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId,
          fileId: id,
        },
      });

      if (!purchase) {
        // Check if user is the uploader
        if (file.uploaderId !== userId) {
          throw new AppError('Purchase required', 403);
        }
      }
    }

    // Create download record
    await prisma.download.create({
      data: {
        userId,
        fileId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Increment download count
    await prisma.file.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    // In production, generate signed URL for S3/MinIO
    const downloadUrl = `/files/${file.storagePath}`;

    res.status(200).json({
      success: true,
      data: {
        downloadUrl,
        fileName: file.fileName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/files/{id}/purchase:
 *   post:
 *     summary: 파일 구매
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, POINT, COUPON]
 *     responses:
 *       200:
 *         description: 구매 완료
 */
export const purchaseFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'CASH' } = req.body;
    const userId = req.user!.id;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    if (file.price === 0) {
      throw new AppError('This file is free', 400);
    }

    // Check if already purchased
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId,
        fileId: id,
      },
    });

    if (existingPurchase) {
      throw new AppError('File already purchased', 400);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check balance
    if (paymentMethod === 'CASH' && user.cash < file.price) {
      throw new AppError('Insufficient cash balance', 400);
    }

    if (paymentMethod === 'POINT' && user.point < file.price) {
      throw new AppError('Insufficient point balance', 400);
    }

    // Process purchase
    await prisma.$transaction(async (tx) => {
      // Deduct balance
      if (paymentMethod === 'CASH') {
        await tx.user.update({
          where: { id: userId },
          data: { cash: { decrement: file.price } },
        });
      } else if (paymentMethod === 'POINT') {
        await tx.user.update({
          where: { id: userId },
          data: { point: { decrement: file.price } },
        });
      }

      // Create purchase record
      await tx.purchase.create({
        data: {
          userId,
          fileId: id,
          price: file.price,
          priceType: paymentMethod as any,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount: -file.price,
          balance: paymentMethod === 'CASH' ? user.cash - file.price : user.point - file.price,
          currency: paymentMethod as any,
          description: `Purchased: ${file.title}`,
          status: 'COMPLETED',
        },
      });

      // Credit seller
      const sellerBalance = await tx.user.findUnique({
        where: { id: file.uploaderId },
        select: { cash: true },
      });

      const commission = Math.floor(file.price * 0.1); // 10% commission
      const sellerAmount = file.price - commission;

      await tx.user.update({
        where: { id: file.uploaderId },
        data: { cash: { increment: sellerAmount } },
      });

      await tx.transaction.create({
        data: {
          userId: file.uploaderId,
          type: 'REWARD',
          amount: sellerAmount,
          balance: (sellerBalance?.cash || 0) + sellerAmount,
          currency: 'CASH',
          description: `Sale: ${file.title}`,
          status: 'COMPLETED',
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Purchase completed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/files/{id}/favorite:
 *   post:
 *     summary: 파일 찜하기
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 찜하기 완료
 */
export const toggleFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_fileId: {
          userId,
          fileId: id,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: {
          userId_fileId: {
            userId,
            fileId: id,
          },
        },
      });

      await prisma.file.update({
        where: { id },
        data: { favoriteCount: { decrement: 1 } },
      });

      res.status(200).json({
        success: true,
        message: 'Removed from favorites',
        isFavorite: false,
      });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId,
          fileId: id,
        },
      });

      await prisma.file.update({
        where: { id },
        data: { favoriteCount: { increment: 1 } },
      });

      res.status(200).json({
        success: true,
        message: 'Added to favorites',
        isFavorite: true,
      });
    }
  } catch (error) {
    next(error);
  }
};
