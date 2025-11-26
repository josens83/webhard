import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../services/socket.service';

// 친구 목록 조회
export const getFriends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { groupName, search } = req.query;

    const whereClause: any = {
      userId,
      isBlocked: false,
    };

    if (groupName) {
      whereClause.groupName = groupName as string;
    }

    const friends = await prisma.friend.findMany({
      where: whereClause,
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            lastLoginAt: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { isFavorite: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 검색어가 있는 경우 필터링
    let filteredFriends = friends;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredFriends = friends.filter(f =>
        f.friend.username.toLowerCase().includes(searchLower) ||
        f.friend.displayName?.toLowerCase().includes(searchLower) ||
        f.nickname?.toLowerCase().includes(searchLower)
      );
    }

    // 그룹별로 정리
    const groups = await prisma.friend.groupBy({
      by: ['groupName'],
      where: { userId, isBlocked: false },
      _count: { id: true },
    });

    res.status(200).json({
      success: true,
      data: {
        friends: filteredFriends,
        groups: groups.map(g => ({
          name: g.groupName || '기본',
          count: g._count.id,
        })),
        totalCount: friends.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 친구 요청 보내기
export const sendFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { receiverId, receiverUsername, message } = req.body;
    const requesterId = req.user!.id;

    // 수신자 찾기
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
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    if (receiver.id === requesterId) {
      throw new AppError('자기 자신에게 친구 요청을 보낼 수 없습니다.', 400);
    }

    // 이미 친구인지 확인
    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: requesterId,
          friendId: receiver.id,
        },
      },
    });

    if (existingFriend) {
      if (existingFriend.isBlocked) {
        throw new AppError('차단된 사용자입니다.', 400);
      }
      throw new AppError('이미 친구입니다.', 400);
    }

    // 기존 요청 확인
    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId,
          receiverId: receiver.id,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new AppError('이미 친구 요청을 보냈습니다.', 400);
      }
      // REJECTED 상태면 다시 보낼 수 있음 - 삭제 후 재생성
      await prisma.friendRequest.delete({
        where: { id: existingRequest.id },
      });
    }

    // 반대로 요청이 와있는지 확인
    const reverseRequest = await prisma.friendRequest.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: receiver.id,
          receiverId: requesterId,
        },
      },
    });

    if (reverseRequest && reverseRequest.status === 'PENDING') {
      // 상대방이 먼저 요청한 경우, 바로 수락 처리
      await acceptFriendRequestLogic(reverseRequest.id, requesterId);
      return res.status(200).json({
        success: true,
        message: '상대방의 요청을 수락하여 친구가 되었습니다.',
      });
    }

    // 친구 요청 생성
    const request = await prisma.friendRequest.create({
      data: {
        requesterId,
        receiverId: receiver.id,
        message,
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // 실시간 알림
    try {
      const io = getIO();
      io.to(`user:${receiver.id}`).emit('friend:request', {
        id: request.id,
        requester: request.requester,
        message: request.message,
        createdAt: request.createdAt,
      });
    } catch (e) {
      // Socket.io 오류는 무시
    }

    res.status(201).json({
      success: true,
      data: request,
      message: '친구 요청을 보냈습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 친구 요청 수락 로직 (내부 함수)
async function acceptFriendRequestLogic(requestId: string, userId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: {
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

  if (!request) {
    throw new AppError('친구 요청을 찾을 수 없습니다.', 404);
  }

  if (request.receiverId !== userId) {
    throw new AppError('접근 권한이 없습니다.', 403);
  }

  if (request.status !== 'PENDING') {
    throw new AppError('이미 처리된 요청입니다.', 400);
  }

  // 트랜잭션으로 친구 관계 생성 및 요청 업데이트
  await prisma.$transaction([
    // 요청 상태 업데이트
    prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    }),
    // 양방향 친구 관계 생성
    prisma.friend.create({
      data: {
        userId: request.requesterId,
        friendId: request.receiverId,
      },
    }),
    prisma.friend.create({
      data: {
        userId: request.receiverId,
        friendId: request.requesterId,
      },
    }),
  ]);

  // 실시간 알림
  try {
    const io = getIO();
    io.to(`user:${request.requesterId}`).emit('friend:accepted', {
      user: request.receiver,
    });
  } catch (e) {
    // Socket.io 오류는 무시
  }

  return request;
}

// 친구 요청 수락
export const acceptFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const request = await acceptFriendRequestLogic(id, userId);

    res.status(200).json({
      success: true,
      message: '친구 요청을 수락했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 친구 요청 거절
export const rejectFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const request = await prisma.friendRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new AppError('친구 요청을 찾을 수 없습니다.', 404);
    }

    if (request.receiverId !== userId) {
      throw new AppError('접근 권한이 없습니다.', 403);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('이미 처리된 요청입니다.', 400);
    }

    await prisma.friendRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: '친구 요청을 거절했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 받은 친구 요청 목록
export const getReceivedRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// 보낸 친구 요청 목록
export const getSentRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.friendRequest.findMany({
      where: {
        requesterId: userId,
        status: 'PENDING',
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
    });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// 친구 요청 취소
export const cancelFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const request = await prisma.friendRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new AppError('친구 요청을 찾을 수 없습니다.', 404);
    }

    if (request.requesterId !== userId) {
      throw new AppError('접근 권한이 없습니다.', 403);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('이미 처리된 요청입니다.', 400);
    }

    await prisma.friendRequest.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: '친구 요청을 취소했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 친구 삭제
export const removeFriend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendId } = req.params;
    const userId = req.user!.id;

    // 양방향 친구 관계 삭제
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    res.status(200).json({
      success: true,
      message: '친구를 삭제했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 친구 차단
export const blockFriend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendId } = req.params;
    const userId = req.user!.id;

    // 기존 친구 관계가 있는지 확인
    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (existingFriend) {
      // 기존 관계 업데이트
      await prisma.friend.update({
        where: { id: existingFriend.id },
        data: { isBlocked: true },
      });
    } else {
      // 새로운 차단 관계 생성
      await prisma.friend.create({
        data: {
          userId,
          friendId,
          isBlocked: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: '사용자를 차단했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 친구 차단 해제
export const unblockFriend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendId } = req.params;
    const userId = req.user!.id;

    await prisma.friend.deleteMany({
      where: {
        userId,
        friendId,
        isBlocked: true,
      },
    });

    res.status(200).json({
      success: true,
      message: '차단을 해제했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 차단 목록
export const getBlockedUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const blocked = await prisma.friend.findMany({
      where: {
        userId,
        isBlocked: true,
      },
      include: {
        friend: {
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
      data: blocked,
    });
  } catch (error) {
    next(error);
  }
};

// 친구 그룹 변경
export const updateFriendGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendId } = req.params;
    const { groupName } = req.body;
    const userId = req.user!.id;

    const friend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (!friend) {
      throw new AppError('친구를 찾을 수 없습니다.', 404);
    }

    await prisma.friend.update({
      where: { id: friend.id },
      data: { groupName: groupName || '기본' },
    });

    res.status(200).json({
      success: true,
      message: '친구 그룹을 변경했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 친구 별명 설정
export const updateFriendNickname = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendId } = req.params;
    const { nickname } = req.body;
    const userId = req.user!.id;

    const friend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (!friend) {
      throw new AppError('친구를 찾을 수 없습니다.', 404);
    }

    await prisma.friend.update({
      where: { id: friend.id },
      data: { nickname },
    });

    res.status(200).json({
      success: true,
      message: '친구 별명을 설정했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 즐겨찾기 토글
export const toggleFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendId } = req.params;
    const userId = req.user!.id;

    const friend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (!friend) {
      throw new AppError('친구를 찾을 수 없습니다.', 404);
    }

    await prisma.friend.update({
      where: { id: friend.id },
      data: { isFavorite: !friend.isFavorite },
    });

    res.status(200).json({
      success: true,
      message: friend.isFavorite ? '즐겨찾기를 해제했습니다.' : '즐겨찾기에 추가했습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 친구 수 및 요청 수 조회
export const getFriendCounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const [friendCount, pendingRequestCount] = await Promise.all([
      prisma.friend.count({
        where: {
          userId,
          isBlocked: false,
        },
      }),
      prisma.friendRequest.count({
        where: {
          receiverId: userId,
          status: 'PENDING',
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        friendCount,
        pendingRequestCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 사용자 검색 (친구 추가용)
export const searchUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query } = req.query;
    const userId = req.user!.id;

    if (!query || (query as string).length < 2) {
      throw new AppError('검색어는 2자 이상 입력해주세요.', 400);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { isActive: true },
          {
            OR: [
              { username: { contains: query as string, mode: 'insensitive' } },
              { displayName: { contains: query as string, mode: 'insensitive' } },
            ],
          },
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

    // 각 사용자와의 친구/요청 상태 확인
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const [friendship, sentRequest, receivedRequest] = await Promise.all([
          prisma.friend.findUnique({
            where: {
              userId_friendId: {
                userId,
                friendId: user.id,
              },
            },
          }),
          prisma.friendRequest.findFirst({
            where: {
              requesterId: userId,
              receiverId: user.id,
              status: 'PENDING',
            },
          }),
          prisma.friendRequest.findFirst({
            where: {
              requesterId: user.id,
              receiverId: userId,
              status: 'PENDING',
            },
          }),
        ]);

        let status = 'none';
        if (friendship && !friendship.isBlocked) status = 'friend';
        else if (friendship?.isBlocked) status = 'blocked';
        else if (sentRequest) status = 'requested';
        else if (receivedRequest) status = 'pending';

        return { ...user, status };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithStatus,
    });
  } catch (error) {
    next(error);
  }
};
