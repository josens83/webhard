import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../services/socket.service';

// 채팅방 목록 조회
export const getChatRooms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
        isActive: true,
      },
      include: {
        participants: {
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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    // 각 채팅방의 안 읽은 메시지 수 계산
    const roomsWithUnread = chatRooms.map((room) => {
      const participant = room.participants.find((p) => p.userId === userId);
      return {
        ...room,
        unreadCount: participant?.unreadCount || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: roomsWithUnread,
    });
  } catch (error) {
    next(error);
  }
};

// 채팅방 생성 (1:1 또는 그룹)
export const createChatRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { targetUserId, type = 'DIRECT', name, participantIds } = req.body;

    // 1:1 채팅방인 경우
    if (type === 'DIRECT') {
      if (!targetUserId) {
        throw new AppError('대화 상대를 지정해주세요.', 400);
      }

      // 기존 1:1 채팅방이 있는지 확인
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            {
              participants: {
                some: { userId, isActive: true },
              },
            },
            {
              participants: {
                some: { userId: targetUserId, isActive: true },
              },
            },
          ],
        },
        include: {
          participants: {
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
      });

      if (existingRoom) {
        return res.status(200).json({
          success: true,
          data: existingRoom,
          message: '기존 채팅방을 불러왔습니다.',
        });
      }

      // 새 1:1 채팅방 생성
      const chatRoom = await prisma.chatRoom.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { userId, role: 'MEMBER' },
              { userId: targetUserId, role: 'MEMBER' },
            ],
          },
        },
        include: {
          participants: {
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
      });

      return res.status(201).json({
        success: true,
        data: chatRoom,
        message: '채팅방이 생성되었습니다.',
      });
    }

    // 그룹 채팅방인 경우
    if (type === 'GROUP') {
      if (!name) {
        throw new AppError('그룹 채팅방 이름을 입력해주세요.', 400);
      }

      const allParticipantIds = [userId, ...(participantIds || [])];

      const chatRoom = await prisma.chatRoom.create({
        data: {
          type: 'GROUP',
          name,
          participants: {
            create: allParticipantIds.map((id: string, index: number) => ({
              userId: id,
              role: index === 0 ? 'OWNER' : 'MEMBER',
            })),
          },
        },
        include: {
          participants: {
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
      });

      return res.status(201).json({
        success: true,
        data: chatRoom,
        message: '그룹 채팅방이 생성되었습니다.',
      });
    }

    throw new AppError('유효하지 않은 채팅방 유형입니다.', 400);
  } catch (error) {
    next(error);
  }
};

// 채팅방 상세 조회
export const getChatRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      include: {
        participants: {
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
    });

    if (!chatRoom) {
      throw new AppError('채팅방을 찾을 수 없습니다.', 404);
    }

    res.status(200).json({
      success: true,
      data: chatRoom,
    });
  } catch (error) {
    next(error);
  }
};

// 메시지 목록 조회 (페이지네이션)
export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const { cursor, limit = 50 } = req.query;

    // 사용자가 채팅방 참가자인지 확인
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new AppError('채팅방에 접근 권한이 없습니다.', 403);
    }

    const messages = await prisma.message.findMany({
      where: {
        chatRoomId: roomId,
        isDeleted: false,
      },
      take: Number(limit) + 1,
      ...(cursor && {
        cursor: { id: cursor as string },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    const hasMore = messages.length > Number(limit);
    const data = hasMore ? messages.slice(0, -1) : messages;

    // 읽음 처리
    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });

    res.status(200).json({
      success: true,
      data: data.reverse(), // 오래된 순으로 정렬
      hasMore,
      nextCursor: hasMore ? data[data.length - 1]?.id : null,
    });
  } catch (error) {
    next(error);
  }
};

// 메시지 전송
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const { content, messageType = 'TEXT', replyToId, attachmentUrl, attachmentType, attachmentName } = req.body;

    if (!content && !attachmentUrl) {
      throw new AppError('메시지 내용을 입력해주세요.', 400);
    }

    // 사용자가 채팅방 참가자인지 확인
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new AppError('채팅방에 접근 권한이 없습니다.', 403);
    }

    // 메시지 생성
    const message = await prisma.message.create({
      data: {
        content: content || '',
        messageType,
        senderId: userId,
        chatRoomId: roomId,
        replyToId,
        attachmentUrl,
        attachmentType,
        attachmentName,
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
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    // 채팅방 마지막 메시지 업데이트
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        lastMessage: content || '[첨부파일]',
        lastMessageAt: new Date(),
      },
    });

    // 다른 참가자들의 안 읽은 메시지 수 증가
    await prisma.chatParticipant.updateMany({
      where: {
        chatRoomId: roomId,
        userId: { not: userId },
        isActive: true,
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Socket.io로 실시간 전송
    const io = getIO();
    io.to(`chat:${roomId}`).emit('message:new', message);

    // 다른 참가자들에게 알림
    const otherParticipants = await prisma.chatParticipant.findMany({
      where: {
        chatRoomId: roomId,
        userId: { not: userId },
        isActive: true,
        isMuted: false,
      },
      select: { userId: true },
    });

    otherParticipants.forEach((p) => {
      io.to(`user:${p.userId}`).emit('chat:notification', {
        roomId,
        message,
      });
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// 메시지 수정
export const updateMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError('메시지를 찾을 수 없습니다.', 404);
    }

    if (message.senderId !== userId) {
      throw new AppError('메시지를 수정할 권한이 없습니다.', 403);
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
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
    });

    // Socket.io로 수정 알림
    const io = getIO();
    io.to(`chat:${message.chatRoomId}`).emit('message:updated', updatedMessage);

    res.status(200).json({
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// 메시지 삭제
export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError('메시지를 찾을 수 없습니다.', 404);
    }

    if (message.senderId !== userId && !req.user!.isAdmin) {
      throw new AppError('메시지를 삭제할 권한이 없습니다.', 403);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Socket.io로 삭제 알림
    const io = getIO();
    io.to(`chat:${message.chatRoomId}`).emit('message:deleted', {
      messageId,
      chatRoomId: message.chatRoomId,
    });

    res.status(200).json({
      success: true,
      message: '메시지가 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 채팅방 나가기
export const leaveChatRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new AppError('채팅방에 참여하고 있지 않습니다.', 404);
    }

    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    // 시스템 메시지 추가
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, username: true },
    });

    await prisma.message.create({
      data: {
        content: `${user?.displayName || user?.username}님이 채팅방을 나갔습니다.`,
        messageType: 'SYSTEM',
        senderId: userId,
        chatRoomId: roomId,
      },
    });

    // Socket.io로 퇴장 알림
    const io = getIO();
    io.to(`chat:${roomId}`).emit('participant:left', {
      roomId,
      userId,
      username: user?.displayName || user?.username,
    });

    res.status(200).json({
      success: true,
      message: '채팅방을 나갔습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 참가자 초대 (그룹 채팅방)
export const inviteParticipants = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError('초대할 사용자를 선택해주세요.', 400);
    }

    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        type: 'GROUP',
      },
      include: {
        participants: {
          where: { userId, isActive: true },
        },
      },
    });

    if (!chatRoom) {
      throw new AppError('그룹 채팅방을 찾을 수 없습니다.', 404);
    }

    const currentParticipant = chatRoom.participants[0];
    if (!currentParticipant || (currentParticipant.role !== 'OWNER' && currentParticipant.role !== 'ADMIN')) {
      throw new AppError('참가자를 초대할 권한이 없습니다.', 403);
    }

    // 새 참가자 추가
    const newParticipants = await Promise.all(
      userIds.map(async (id: string) => {
        const existing = await prisma.chatParticipant.findFirst({
          where: { chatRoomId: roomId, userId: id },
        });

        if (existing) {
          // 이전에 나갔던 경우 다시 활성화
          return prisma.chatParticipant.update({
            where: { id: existing.id },
            data: { isActive: true, leftAt: null },
          });
        }

        return prisma.chatParticipant.create({
          data: {
            chatRoomId: roomId,
            userId: id,
            role: 'MEMBER',
          },
        });
      })
    );

    // 시스템 메시지
    const invitedUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { displayName: true, username: true },
    });

    const names = invitedUsers.map((u) => u.displayName || u.username).join(', ');
    await prisma.message.create({
      data: {
        content: `${names}님이 채팅방에 초대되었습니다.`,
        messageType: 'SYSTEM',
        senderId: userId,
        chatRoomId: roomId,
      },
    });

    // Socket.io로 알림
    const io = getIO();
    io.to(`chat:${roomId}`).emit('participants:invited', {
      roomId,
      newParticipants,
    });

    res.status(200).json({
      success: true,
      message: '참가자가 초대되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 읽음 처리
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: roomId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new AppError('채팅방에 접근 권한이 없습니다.', 403);
    }

    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });

    // Socket.io로 읽음 상태 전파
    const io = getIO();
    io.to(`chat:${roomId}`).emit('messages:read', {
      roomId,
      userId,
      readAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: '읽음 처리되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 사용자 검색 (채팅 시작용)
export const searchUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { query } = req.query;

    if (!query || (query as string).length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        OR: [
          { username: { contains: query as string, mode: 'insensitive' } },
          { displayName: { contains: query as string, mode: 'insensitive' } },
          { email: { contains: query as string, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
