import express from 'express';
import multer from 'multer';
import path from 'path';
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

export default router;
