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

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.username} (${user.id})`);

    // Join user's personal room
    socket.join(`user:${user.id}`);

    // Join admin room if admin
    if (user.isAdmin) {
      socket.join('admin');
    }

    // Handle file upload progress
    socket.on('upload:progress', (data) => {
      socket.emit('upload:progress', data);
    });

    // Handle download progress
    socket.on('download:progress', (data) => {
      socket.emit('download:progress', data);
    });

    // Handle typing indicator
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
