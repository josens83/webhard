import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getFiles,
  getFileById,
  uploadFile,
  downloadFile,
  purchaseFile,
  toggleFavorite,
} from '../controllers/file.controller';
import { authenticate, requireSeller, requirePurchaseOrOwnership, optionalAuth, requireDailyLimit } from '../middleware/auth';
import { fileSearchValidation, fileIdValidation, purchaseValidation } from '../middleware/validators';
import { prisma } from '../config/database';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Allowed file types
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'text/plain',
  'application/json',
];

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10737418240'), // 10GB
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  },
});

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, fileSearchValidation, getFiles);
router.get('/:id', optionalAuth, fileIdValidation, getFileById);

// Protected routes
router.post('/upload', authenticate, requireSeller, requireDailyLimit('uploads', 50), upload.single('file'), uploadFile);
router.post('/:id/download', authenticate, fileIdValidation, requirePurchaseOrOwnership, downloadFile);
router.post('/:id/purchase', authenticate, fileIdValidation, purchaseFile);
router.post('/:id/favorite', authenticate, fileIdValidation, toggleFavorite);

// File preview endpoint - streams file for preview
router.get('/:id/preview', optionalAuth, fileIdValidation, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        storagePath: true,
        mimeType: true,
        fileName: true,
        fileSize: true,
        price: true,
        uploaderId: true,
        status: true,
      },
    });

    if (!file || file.status !== 'APPROVED') {
      return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
    }

    // Check access rights for paid files
    if (file.price > 0 && file.uploaderId !== userId) {
      if (!userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
      }

      // Check if user purchased the file
      const purchase = await prisma.purchase.findFirst({
        where: { userId, fileId: id },
      });

      if (!purchase) {
        return res.status(403).json({ success: false, message: '구매 후 이용 가능합니다.' });
      }
    }

    // Check if file exists
    const filePath = path.resolve(file.storagePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '파일이 존재하지 않습니다.' });
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Handle range requests for video/audio streaming
    const range = req.headers.range;

    if (range && (file.mimeType.startsWith('video/') || file.mimeType.startsWith('audio/'))) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.mimeType,
      });

      fileStream.pipe(res);
    } else {
      // Regular file streaming
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
        'Cache-Control': 'private, max-age=3600',
      });

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, message: '미리보기를 로드할 수 없습니다.' });
  }
});

// Thumbnail endpoint for generating/serving thumbnails
router.get('/:id/thumbnail', optionalAuth, fileIdValidation, async (req: any, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        storagePath: true,
        mimeType: true,
        thumbnailPath: true,
        status: true,
      },
    });

    if (!file || file.status !== 'APPROVED') {
      return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
    }

    // If thumbnail exists, serve it
    if (file.thumbnailPath && fs.existsSync(file.thumbnailPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      fs.createReadStream(file.thumbnailPath).pipe(res);
      return;
    }

    // For images, serve the original as thumbnail (resized via frontend)
    if (file.mimeType.startsWith('image/') && fs.existsSync(file.storagePath)) {
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      fs.createReadStream(file.storagePath).pipe(res);
      return;
    }

    // Return placeholder for other file types
    res.status(404).json({ success: false, message: '썸네일이 없습니다.' });
  } catch (error) {
    console.error('Thumbnail error:', error);
    res.status(500).json({ success: false, message: '썸네일을 로드할 수 없습니다.' });
  }
});

export default router;
