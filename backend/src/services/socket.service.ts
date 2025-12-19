import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

let io: SocketServer;

export function initializeSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, isAdmin: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.username} (${user.id})`);

    // Join user's personal room
    socket.join(`user:${user.id}`);

    // Join admin room if admin
    if (user.isAdmin) {
      socket.join('admin');
    }

    // 사용자가 참여 중인 모든 채팅방에 자동 조인
    try {
      const chatParticipants = await prisma.chatParticipant.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        select: { chatRoomId: true },
      });

      chatParticipants.forEach((participant) => {
        socket.join(`chat:${participant.chatRoomId}`);
      });

      console.log(`User ${user.username} joined ${chatParticipants.length} chat rooms`);
    } catch (error) {
      console.error('Error joining chat rooms:', error);
    }

    // Handle file upload progress
    socket.on('upload:progress', (data) => {
      socket.emit('upload:progress', data);
    });

    // Handle download progress
    socket.on('download:progress', (data) => {
      socket.emit('download:progress', data);
    });

    // ============================================
    // 채팅 관련 이벤트 핸들러
    // ============================================

    // 채팅방 입장
    socket.on('chat:join', async (roomId: string) => {
      try {
        // 사용자가 채팅방 참가자인지 확인
        const participant = await prisma.chatParticipant.findFirst({
          where: {
            chatRoomId: roomId,
            userId: user.id,
            isActive: true,
          },
        });

        if (participant) {
          socket.join(`chat:${roomId}`);
          console.log(`User ${user.username} joined chat room: ${roomId}`);

          // 다른 참가자들에게 온라인 상태 알림
          socket.to(`chat:${roomId}`).emit('user:online', {
            userId: user.id,
            username: user.username,
            roomId,
          });
        }
      } catch (error) {
        console.error('Error joining chat room:', error);
      }
    });

    // 채팅방 퇴장
    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`chat:${roomId}`);
      console.log(`User ${user.username} left chat room: ${roomId}`);

      // 다른 참가자들에게 오프라인 상태 알림
      socket.to(`chat:${roomId}`).emit('user:offline', {
        userId: user.id,
        roomId,
      });
    });

    // 타이핑 시작
    socket.on('chat:typing:start', (roomId: string) => {
      socket.to(`chat:${roomId}`).emit('typing:start', {
        userId: user.id,
        username: user.username,
        roomId,
      });
    });

    // 타이핑 종료
    socket.on('chat:typing:stop', (roomId: string) => {
      socket.to(`chat:${roomId}`).emit('typing:stop', {
        userId: user.id,
        roomId,
      });
    });

    // 메시지 읽음 처리
    socket.on('chat:read', async (data: { roomId: string }) => {
      try {
        await prisma.chatParticipant.updateMany({
          where: {
            chatRoomId: data.roomId,
            userId: user.id,
            isActive: true,
          },
          data: {
            lastReadAt: new Date(),
            unreadCount: 0,
          },
        });

        socket.to(`chat:${data.roomId}`).emit('messages:read', {
          roomId: data.roomId,
          userId: user.id,
          readAt: new Date(),
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // 기존 타이핑 인디케이터 (하위 호환성)
    socket.on('typing:start', (data) => {
      socket.to(data.room).emit('typing:start', {
        userId: user.id,
        username: user.username,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.room).emit('typing:stop', {
        userId: user.id,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.username}`);

      // 모든 채팅방에 오프라인 상태 알림
      socket.rooms.forEach((room) => {
        if (room.startsWith('chat:')) {
          socket.to(room).emit('user:offline', {
            userId: user.id,
          });
        }
      });
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Helper functions

export async function sendNotificationToUser(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    link?: string;
  }
) {
  if (!io) return;

  // Save to database
  await prisma.notification.create({
    data: {
      userId,
      type: notification.type as any,
      title: notification.title,
      message: notification.message,
      link: notification.link,
    },
  });

  // Send via socket
  io.to(`user:${userId}`).emit('notification', notification);
}

export async function sendNotificationToAdmins(notification: {
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  if (!io) return;

  // Get all admin users
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true },
  });

  // Save to database for all admins
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: notification.type as any,
      title: notification.title,
      message: notification.message,
      link: notification.link,
    })),
  });

  // Send via socket
  io.to('admin').emit('notification', notification);
}

export function notifyFileUpload(uploaderId: string, fileName: string) {
  sendNotificationToAdmins({
    type: 'SYSTEM',
    title: '새 파일 업로드',
    message: `${fileName} 파일이 업로드되었습니다. 승인이 필요합니다.`,
    link: '/admin/files',
  });
}

export function notifyFilePurchase(
  sellerId: string,
  buyerUsername: string,
  fileName: string,
  amount: number
) {
  sendNotificationToUser(sellerId, {
    type: 'PURCHASE',
    title: '파일 판매',
    message: `${buyerUsername}님이 "${fileName}" 파일을 ${amount.toLocaleString()}원에 구매했습니다.`,
    link: '/mypage/sales',
  });
}

export function notifyFileApproval(uploaderId: string, fileName: string, approved: boolean) {
  sendNotificationToUser(uploaderId, {
    type: 'SYSTEM',
    title: approved ? '파일 승인' : '파일 거부',
    message: approved
      ? `"${fileName}" 파일이 승인되었습니다.`
      : `"${fileName}" 파일이 거부되었습니다.`,
    link: '/mypage/uploads',
  });
}

export function notifyNewComment(
  fileOwnerId: string,
  commenterUsername: string,
  fileName: string,
  fileId: string
) {
  sendNotificationToUser(fileOwnerId, {
    type: 'COMMENT',
    title: '새 댓글',
    message: `${commenterUsername}님이 "${fileName}" 파일에 댓글을 남겼습니다.`,
    link: `/files/${fileId}`,
  });
}

export function notifyNewRating(
  fileOwnerId: string,
  raterUsername: string,
  fileName: string,
  rating: number,
  fileId: string
) {
  sendNotificationToUser(fileOwnerId, {
    type: 'RATING',
    title: '새 평점',
    message: `${raterUsername}님이 "${fileName}" 파일에 ${rating}점을 주었습니다.`,
    link: `/files/${fileId}`,
  });
}

// Message notifications (쪽지 알림)
export function notifyNewMessage(
  recipientId: string,
  senderUsername: string,
  messageTitle: string
) {
  if (!io) return;

  io.to(`user:${recipientId}`).emit('message:new', {
    senderUsername,
    title: messageTitle,
  });

  sendNotificationToUser(recipientId, {
    type: 'MESSAGE',
    title: '새 쪽지',
    message: `${senderUsername}님이 쪽지를 보냈습니다: ${messageTitle}`,
    link: '/messages',
  });
}

// Friend notifications (친구 알림)
export function notifyFriendRequest(
  recipientId: string,
  senderUsername: string
) {
  if (!io) return;

  io.to(`user:${recipientId}`).emit('friend:request', {
    senderUsername,
  });

  sendNotificationToUser(recipientId, {
    type: 'FRIEND',
    title: '친구 요청',
    message: `${senderUsername}님이 친구 요청을 보냈습니다.`,
    link: '/friends',
  });
}

export function notifyFriendAccepted(
  recipientId: string,
  accepterUsername: string
) {
  if (!io) return;

  io.to(`user:${recipientId}`).emit('friend:accepted', {
    accepterUsername,
  });

  sendNotificationToUser(recipientId, {
    type: 'FRIEND',
    title: '친구 수락',
    message: `${accepterUsername}님이 친구 요청을 수락했습니다.`,
    link: '/friends',
  });
}

// Upload progress notification
export function notifyUploadProgress(
  userId: string,
  fileId: string,
  progress: number,
  fileName: string
) {
  if (!io) return;

  io.to(`user:${userId}`).emit('upload:progress', {
    fileId,
    progress,
    fileName,
  });
}

// Download progress notification
export function notifyDownloadProgress(
  userId: string,
  fileId: string,
  progress: number,
  fileName: string
) {
  if (!io) return;

  io.to(`user:${userId}`).emit('download:progress', {
    fileId,
    progress,
    fileName,
  });
}

// Online status
export function updateUserOnlineStatus(userId: string, isOnline: boolean) {
  if (!io) return;

  io.emit('user:status', {
    userId,
    isOnline,
  });
}
