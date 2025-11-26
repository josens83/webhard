import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../services/socket.service';

// 쪽지 보내기
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { receiverId, receiverUsername, content } = req.body;
    const senderId = req.user!.id;

    if (!content || content.trim().length === 0) {
      throw new AppError('메시지 내용을 입력해주세요.', 400);
    }

    // 수신자 찾기 (ID 또는 username으로)
    let receiver;
    if (receiverId) {
      receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, username: true },
      });
    } else if (receiverUsername) {
      receiver = await prisma.user.findUnique({
        where: { username: receiverUsername },
        select: { id: true, username: true },
      });
    }

    if (!receiver) {
      throw new AppError('수신자를 찾을 수 없습니다.', 404);
    }

    if (receiver.id === senderId) {
      throw new AppError('자기 자신에게 쪽지를 보낼 수 없습니다.', 400);
    }

    // 차단 여부 확인
    const blocked = await prisma.friend.findFirst({
      where: {
        userId: receiver.id,
        friendId: senderId,
        isBlocked: true,
      },
    });

    if (blocked) {
      throw new AppError('상대방이 쪽지 수신을 차단했습니다.', 403);
    }

    // 쪽지 생성
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: receiver.id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // 실시간 알림 전송
    try {
      const io = getIO();
      io.to(`user:${receiver.id}`).emit('message:new', {
        id: message.id,
        sender: message.sender,
        content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
        createdAt: message.createdAt,
      });
    } catch (e) {
      // Socket.io 오류는 무시
    }

    res.status(201).json({
      success: true,
      data: message,
      message: '쪽지를 전송했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 받은 쪽지 목록
export const getInbox = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where: {
          receiverId: userId,
          isDeletedByReceiver: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          receiverId: userId,
          isDeletedByReceiver: false,
        },
      }),
      prisma.message.count({
        where: {
          receiverId: userId,
          isDeletedByReceiver: false,
          isRead: false,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 보낸 쪽지 목록
export const getSentMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          senderId: userId,
          isDeletedBySender: false,
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          senderId: userId,
          isDeletedBySender: false,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 쪽지 상세 보기 (읽음 처리 포함)
export const getMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    if (!message) {
      throw new AppError('쪽지를 찾을 수 없습니다.', 404);
    }

    // 권한 확인
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new AppError('접근 권한이 없습니다.', 403);
    }

    // 수신자가 읽는 경우 읽음 처리
    if (message.receiverId === userId && !message.isRead) {
      await prisma.message.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // 발신자에게 읽음 알림
      try {
        const io = getIO();
        io.to(`user:${message.senderId}`).emit('message:read', {
          messageId: id,
          readAt: new Date(),
        });
      } catch (e) {
        // Socket.io 오류는 무시
      }
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// 쪽지 삭제
export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new AppError('쪽지를 찾을 수 없습니다.', 404);
    }

    // 발신자인 경우
    if (message.senderId === userId) {
      await prisma.message.update({
        where: { id },
        data: { isDeletedBySender: true },
      });
    }
    // 수신자인 경우
    else if (message.receiverId === userId) {
      await prisma.message.update({
        where: { id },
        data: { isDeletedByReceiver: true },
      });
    } else {
      throw new AppError('접근 권한이 없습니다.', 403);
    }

    // 양쪽 다 삭제한 경우 실제 삭제
    const updatedMessage = await prisma.message.findUnique({
      where: { id },
    });

    if (updatedMessage?.isDeletedBySender && updatedMessage?.isDeletedByReceiver) {
      await prisma.message.delete({
        where: { id },
      });
    }

    res.status(200).json({
      success: true,
      message: '쪽지가 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 여러 쪽지 삭제
export const deleteMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageIds, type } = req.body; // type: 'inbox' | 'sent'
    const userId = req.user!.id;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      throw new AppError('삭제할 쪽지를 선택해주세요.', 400);
    }

    if (type === 'inbox') {
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          receiverId: userId,
        },
        data: { isDeletedByReceiver: true },
      });
    } else if (type === 'sent') {
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          senderId: userId,
        },
        data: { isDeletedBySender: true },
      });
    }

    res.status(200).json({
      success: true,
      message: `${messageIds.length}개의 쪽지가 삭제되었습니다.`,
    });
  } catch (error) {
    next(error);
  }
};

// 읽지 않은 쪽지 수
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isDeletedByReceiver: false,
        isRead: false,
      },
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    next(error);
  }
};

// 모든 쪽지 읽음 처리
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    await prisma.message.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: '모든 쪽지를 읽음 처리했습니다.',
    });
  } catch (error) {
    next(error);
  }
};
